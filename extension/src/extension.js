const vscode = require("vscode");
const { BackendManager } = require("./backendManager");
const { DashboardWebviewProvider } = require("./webviewProvider");

function activate(context) {
  const backend = new BackendManager(context);
  context.subscriptions.push(backend);

  context.subscriptions.push(
    vscode.commands.registerCommand("realtimeTerminalDashboard.startBackend", async () => {
      await backend.start();
      vscode.window.showInformationMessage("Real-Time Terminal Dashboard backend started.");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("realtimeTerminalDashboard.stopBackend", () => {
      backend.stop();
      vscode.window.showInformationMessage("Real-Time Terminal Dashboard backend stopped.");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("realtimeTerminalDashboard.open", async () => {
      await backend.start();
      new DashboardWebviewProvider(backend.baseUrl).open();
    }),
  );
}

function deactivate() {
  // VSCode disposes registered subscriptions automatically.
}

module.exports = {
  activate,
  deactivate,
};
