import * as vscode from "vscode";
import { BackendManager, BackendStatus } from "./backendManager";

const statusLabels: Record<BackendStatus, string> = {
  offline: "$(circle-slash) Dashboard Offline",
  starting: "$(sync~spin) Dashboard Starting",
  online: "$(pulse) Dashboard Online",
  installing: "$(cloud-download) Dashboard Installing",
  error: "$(warning) Dashboard Error",
};

const statusColors: Partial<Record<BackendStatus, vscode.ThemeColor>> = {
  online: new vscode.ThemeColor("statusBarItem.prominentForeground"),
  starting: new vscode.ThemeColor("statusBarItem.warningForeground"),
  installing: new vscode.ThemeColor("statusBarItem.warningForeground"),
  error: new vscode.ThemeColor("statusBarItem.errorForeground"),
};

export class BackendStatusBar implements vscode.Disposable {
  private readonly item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 90);
  private readonly disposables: vscode.Disposable[] = [];
  private readonly pollTimer: NodeJS.Timeout;

  public constructor(private readonly backend: BackendManager) {
    this.item.command = "realtimeTerminalDashboard.open";
    this.item.tooltip = "Open Real-Time Terminal Dashboard";
    this.disposables.push(this.backend.onDidChangeStatus((status) => this.render(status)));
    this.render(this.backend.currentStatus);
    this.item.show();

    this.pollTimer = setInterval(() => {
      void this.backend.refreshHealth();
    }, 7000);
  }

  public dispose(): void {
    clearInterval(this.pollTimer);
    this.disposables.forEach((disposable) => disposable.dispose());
    this.item.dispose();
  }

  private render(status: BackendStatus): void {
    this.item.text = statusLabels[status];
    this.item.color = statusColors[status];
    this.item.backgroundColor = status === "error" ? new vscode.ThemeColor("statusBarItem.errorBackground") : undefined;
  }
}