import * as vscode from "vscode";
import { BackendManager } from "./backendManager";
import { BackendStatusBar } from "./backendStatusBar";
import { DashboardWebviewProvider } from "./webviewProvider";

export function activate(context: vscode.ExtensionContext): void {
  const backend = new BackendManager(context);
  const statusBar = new BackendStatusBar(backend);
  context.subscriptions.push(backend, statusBar);

  context.subscriptions.push(
    vscode.commands.registerCommand("realtimeTerminalDashboard.installBackendDependencies", async () => {
      await backend.installDependencies();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("realtimeTerminalDashboard.startBackend", async () => {
      await backend.start();
      if (backend.currentStatus === "online") {
        vscode.window.showInformationMessage("Real-Time Terminal Dashboard backend started.");
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("realtimeTerminalDashboard.stopBackend", async () => {
      await backend.stop();
      vscode.window.showInformationMessage("Real-Time Terminal Dashboard backend stopped.");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("realtimeTerminalDashboard.open", async () => {
      await backend.start();
      if (backend.currentStatus === "online") {
        new DashboardWebviewProvider(backend.baseUrl).open();
      }
    }),
  );

  void backend.refreshHealth();
}

export function deactivate(): void {
  // VSCode disposes registered subscriptions automatically.
}