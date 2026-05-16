import * as vscode from "vscode";
import { BackendManager } from "./backendManager";
import { DashboardWebviewProvider } from "./webviewProvider";

export function activate(context: vscode.ExtensionContext): void {
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

export function deactivate(): void {
  // VSCode disposes registered subscriptions automatically.
}
