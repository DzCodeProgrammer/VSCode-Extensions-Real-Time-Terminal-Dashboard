const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const vscode = require("vscode");

class BackendManager {
  constructor(context) {
    this.context = context;
    this.process = undefined;
    this.output = vscode.window.createOutputChannel("Real-Time Terminal Dashboard");
  }

  get baseUrl() {
    const port = vscode.workspace
      .getConfiguration("realtimeTerminalDashboard")
      .get("backendPort", 8765);
    return `http://127.0.0.1:${port}`;
  }

  async start() {
    if (this.process && !this.process.killed) {
      return;
    }

    const config = vscode.workspace.getConfiguration("realtimeTerminalDashboard");
    const port = config.get("backendPort", 8765);
    const backendPath = path.resolve(this.context.extensionPath, "..", "backend");
    const localVenvPython = path.join(backendPath, ".venv", "Scripts", "python.exe");
    const pythonPath = fs.existsSync(localVenvPython)
      ? localVenvPython
      : config.get("pythonPath", "python");

    this.output.appendLine(`Starting backend at ${this.baseUrl}`);
    this.process = cp.spawn(
      pythonPath,
      ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", String(port)],
      {
        cwd: backendPath,
        env: { ...process.env, PYTHONUNBUFFERED: "1" },
      },
    );

    this.process.stdout.on("data", (chunk) => this.output.append(chunk.toString()));
    this.process.stderr.on("data", (chunk) => this.output.append(chunk.toString()));
    this.process.on("exit", (code) => {
      this.output.appendLine(`Backend exited with code ${code ?? "unknown"}`);
      this.process = undefined;
    });

    await this.waitUntilHealthy();
  }

  stop() {
    if (!this.process) {
      return;
    }

    this.output.appendLine("Stopping backend.");
    this.process.kill();
    this.process = undefined;
  }

  dispose() {
    this.stop();
    this.output.dispose();
  }

  async waitUntilHealthy() {
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
}

module.exports = { BackendManager };
