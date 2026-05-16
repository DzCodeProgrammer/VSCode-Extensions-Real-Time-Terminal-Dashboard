const vscode = require("vscode");

class DashboardWebviewProvider {
  constructor(backendUrl) {
    this.backendUrl = backendUrl;
  }

  open() {
    const panel = vscode.window.createWebviewPanel(
      "realTimeTerminalDashboard",
      "Real-Time Terminal Dashboard",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    );

    panel.webview.html = this.renderHtml();
  }

  renderHtml() {
    const escapedUrl = this.backendUrl.replace(/"/g, "&quot;");
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body, iframe {
        width: 100%;
        height: 100%;
        margin: 0;
        border: 0;
        background: #06070d;
      }
    </style>
  </head>
  <body>
    <iframe src="${escapedUrl}" title="Real-Time Terminal Dashboard"></iframe>
  </body>
</html>`;
  }
}

module.exports = { DashboardWebviewProvider };
