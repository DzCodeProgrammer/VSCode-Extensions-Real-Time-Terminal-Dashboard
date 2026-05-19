import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";

export type BackendStatus = "offline" | "starting" | "online" | "installing" | "error";

export class BackendManager implements vscode.Disposable {
  private process?: cp.ChildProcessWithoutNullStreams;
  private status: BackendStatus = "offline";
  private readonly output = vscode.window.createOutputChannel("Real-Time Terminal Dashboard");
  private readonly statusEmitter = new vscode.EventEmitter<BackendStatus>();

  public readonly onDidChangeStatus = this.statusEmitter.event;

  public constructor(private readonly context: vscode.ExtensionContext) {}

  public get baseUrl(): string {
    const port = vscode.workspace
      .getConfiguration("realtimeTerminalDashboard")
      .get<number>("backendPort", 8765);
    return `http://127.0.0.1:${port}`;
  }

  public get currentStatus(): BackendStatus {
    return this.status;
  }

  public async start(): Promise<void> {
    if (this.process && !this.process.killed) {
      await this.refreshHealth();
      return;
    }

    if (!this.hasLocalBackendEnvironment()) {
      const action = "Install Dependencies";
      const selected = await vscode.window.showWarningMessage(
        "Dashboard backend dependencies are not installed yet.",
        action,
      );
      if (selected === action) {
        await this.installDependencies();
      } else {
        this.setStatus("error");
        return;
      }
    }

    const port = vscode.workspace
      .getConfiguration("realtimeTerminalDashboard")
      .get<number>("backendPort", 8765);

    this.setStatus("starting");
    this.output.appendLine(`Starting backend at ${this.baseUrl}`);
    this.process = cp.spawn(
      this.getPythonPath(),
      ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", String(port)],
      {
        cwd: this.backendPath,
        env: { ...process.env, PYTHONUNBUFFERED: "1" },
      },
    );

    this.process.stdout.on("data", (chunk: Buffer) => this.output.append(chunk.toString()));
    this.process.stderr.on("data", (chunk: Buffer) => this.output.append(chunk.toString()));
    this.process.on("error", (error) => {
      this.output.appendLine(`Backend launch failed: ${error.message}`);
      this.setStatus("error");
      vscode.window.showErrorMessage(`Dashboard backend failed to start: ${error.message}`);
    });
    this.process.on("exit", (code) => {
      this.output.appendLine(`Backend exited with code ${code ?? "unknown"}`);
      this.process = undefined;
      this.setStatus("offline");
    });

    const healthy = await this.waitUntilHealthy();
    if (healthy) {
      this.setStatus("online");
      await this.appendBackendLog("VSCode extension connected to backend.");
    } else {
      this.setStatus("error");
      vscode.window.showWarningMessage("Dashboard backend is starting slowly. Check the output channel for details.");
    }
  }

  public async stop(): Promise<void> {
    if (!this.process) {
      this.setStatus("offline");
      return;
    }

    await this.appendBackendLog("VSCode extension requested backend shutdown.");
    this.output.appendLine("Stopping backend.");
    this.process.kill();
    this.process = undefined;
    this.setStatus("offline");
  }

  public async installDependencies(): Promise<void> {
    this.setStatus("installing");
    this.output.show(true);

    try {
      if (!fs.existsSync(this.venvPythonPath)) {
        this.output.appendLine("Creating backend virtual environment.");
        await this.runProcess(this.getConfiguredPythonPath(), ["-m", "venv", ".venv"], this.backendPath);
      }

      this.output.appendLine("Installing backend Python dependencies.");
      await this.runProcess(this.venvPythonPath, ["-m", "pip", "install", "-r", "requirements.txt"], this.backendPath);
      vscode.window.showInformationMessage("Dashboard backend dependencies installed.");
      this.setStatus("offline");
    } catch (error) {
      this.output.appendLine(`Dependency install failed: ${String(error)}`);
      this.setStatus("error");
      vscode.window.showErrorMessage("Failed to install dashboard backend dependencies. Check the output channel.");
    }
  }

  public async refreshHealth(): Promise<BackendStatus> {
    if (this.status === "installing" || this.status === "starting") {
      return this.status;
    }

    const online = await this.isHealthy();
    this.setStatus(online ? "online" : "offline");
    return this.status;
  }

  public dispose(): void {
    void this.stop();
    this.statusEmitter.dispose();
    this.output.dispose();
  }

  private get backendPath(): string {
    return path.resolve(this.context.extensionPath, "..", "backend");
  }

  private get venvPythonPath(): string {
    return path.join(this.backendPath, ".venv", "Scripts", "python.exe");
  }

  private hasLocalBackendEnvironment(): boolean {
    return fs.existsSync(this.venvPythonPath) && fs.existsSync(path.join(this.backendPath, "requirements.txt"));
  }

  private getConfiguredPythonPath(): string {
    return vscode.workspace
      .getConfiguration("realtimeTerminalDashboard")
      .get<string>("pythonPath", "python");
  }

  private getPythonPath(): string {
    return fs.existsSync(this.venvPythonPath) ? this.venvPythonPath : this.getConfiguredPythonPath();
  }

  private setStatus(status: BackendStatus): void {
    if (this.status === status) {
      return;
    }

    this.status = status;
    this.statusEmitter.fire(status);
  }

  private async waitUntilHealthy(): Promise<boolean> {
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if (await this.isHealthy()) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    return false;
  }

  private async isHealthy(): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    try {
      const response = await fetch(`${this.baseUrl}/api/telemetry`, { signal: controller.signal });
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  private async appendBackendLog(message: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/telemetry/terminal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stream: "system", message }),
      });
    } catch (error) {
      this.output.appendLine(`Unable to append backend log: ${String(error)}`);
    }
  }

  private runProcess(command: string, args: string[], cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = cp.spawn(command, args, { cwd, env: { ...process.env, PYTHONUNBUFFERED: "1" } });

      child.stdout.on("data", (chunk: Buffer) => this.output.append(chunk.toString()));
      child.stderr.on("data", (chunk: Buffer) => this.output.append(chunk.toString()));
      child.on("error", reject);
      child.on("exit", (code) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(`${command} exited with code ${code ?? "unknown"}`));
      });
    });
  }
}