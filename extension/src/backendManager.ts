import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";

export class BackendManager implements vscode.Disposable {
  private process?: cp.ChildProcessWithoutNullStreams;
  private readonly output = vscode.window.createOutputChannel("Real-Time Terminal Dashboard");

  public constructor(private readonly context: vscode.ExtensionContext) {}

  public get baseUrl(): string {
    const port = vscode.workspace
      .getConfiguration("realtimeTerminalDashboard")
      .get<number>("backendPort", 8765);
    return `http://127.0.0.1:${port}`;
  }

  public async start(): Promise<void> {
    if (this.process && !this.process.killed) {
      return;
    }

    const config = vscode.workspace.getConfiguration("realtimeTerminalDashboard");
    const port = config.get<number>("backendPort", 8765);
    const backendPath = path.resolve(this.context.extensionPath, "..", "backend");
    const localVenvPython = path.join(backendPath, ".venv", "Scripts", "python.exe");
    const pythonPath = fs.existsSync(localVenvPython)
      ? localVenvPython
      : config.get<string>("pythonPath", "python");

    this.output.appendLine(`Starting backend at ${this.baseUrl}`);
    this.process = cp.spawn(
      pythonPath,
      ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", String(port)],
      {
        cwd: backendPath,
        env: { ...process.env, PYTHONUNBUFFERED: "1" },
      },
    );

    this.process.stdout.on("data", (chunk: Buffer) => this.output.append(chunk.toString()));
    this.process.stderr.on("data", (chunk: Buffer) => this.output.append(chunk.toString()));
    this.process.on("error", (error) => {
      this.output.appendLine(`Backend launch failed: ${error.message}`);
      vscode.window.showErrorMessage(`Dashboard backend failed to start: ${error.message}`);
    });
    this.process.on("exit", (code) => {
      this.output.appendLine(`Backend exited with code ${code ?? "unknown"}`);
      this.process = undefined;
    });

    await this.waitUntilHealthy();
    await this.appendBackendLog("VSCode extension connected to backend.");
  }

  public async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    await this.appendBackendLog("VSCode extension requested backend shutdown.");
    this.output.appendLine("Stopping backend.");
    this.process.kill();
    this.process = undefined;
  }

  public dispose(): void {
    void this.stop();
    this.output.dispose();
  }

  private async waitUntilHealthy(): Promise<void> {
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      try {
        const response = await fetch(`${this.baseUrl}/api/telemetry`);
        if (response.ok) {
          return;
        }
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    vscode.window.showWarningMessage("Dashboard backend is starting slowly. Check the output channel for details.");
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
}