# Real-Time Terminal Dashboard

Premium VSCode developer tool for realtime terminal, system, Git, process, and network observability.

The project combines a VSCode extension, a local FastAPI monitoring backend, WebSocket streams, and a cyberpunk HTMX dashboard. It is designed as a local developer tool: the backend binds to `127.0.0.1` and runs on the user machine.

## Current Status

- Local VSCode extension: ready for development/testing with `F5`.
- GitHub repository: active and updated.
- VSIX package workflow: ready.
- Visual Studio Marketplace publish: prepared, but requires your publisher account and token.
- Publishing cost: free. You only need a Microsoft/Azure DevOps account and Marketplace publisher.

## Architecture

- `backend/app/services`: monitoring and domain logic.
- `backend/app/routes`: REST and HTMX endpoints.
- `backend/app/websockets`: realtime WebSocket streams.
- `backend/app/templates`: HTMX dashboard templates.
- `backend/app/static`: dashboard CSS and vanilla JavaScript.
- `extension/src`: VSCode extension lifecycle, commands, status bar, and webview bridge.
- `extension/scripts`: packaging helper scripts.

## Performance Defaults

- The chart uses a lightweight custom canvas renderer instead of Chart.js.
- `/ws/pulse` sends only CPU and RAM every 2 seconds.
- Full telemetry updates are slower and bounded to reduce CPU pressure.
- The browser pauses the pulse WebSocket when the dashboard tab is hidden.
- Extension health checks use lightweight `/api/health` instead of full telemetry.

## File Tree

```text
.
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── static/
│   │   ├── templates/
│   │   ├── websockets/
│   │   └── main.py
│   ├── scripts/
│   │   └── start-server.ps1
│   └── requirements.txt
├── extension/
│   ├── assets/
│   ├── scripts/
│   ├── src/
│   ├── package.json
│   ├── README.md
│   └── tsconfig.json
└── .vscode/
    ├── launch.json
    └── tasks.json
```

## Run Backend Manually

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\scripts\start-server.ps1
```

Open:

```text
http://127.0.0.1:8765
```

## Run Extension Locally

```powershell
cd extension
npm.cmd install
npm.cmd run compile
```

Then press `F5` in VSCode from the repository root and run:

```text
Real-Time Terminal Dashboard: Open Dashboard
```

## VSCode Extension UX

Status bar states:

- `Dashboard Offline`: backend is not reachable.
- `Dashboard Starting`: backend launch is in progress.
- `Dashboard Online`: backend health check passed.
- `Dashboard Installing`: Python environment/dependencies are being installed.
- `Dashboard Error`: startup or install failed; check the output channel.

Command Palette actions:

```text
Real-Time Terminal Dashboard: Open Dashboard
Real-Time Terminal Dashboard: Start Backend
Real-Time Terminal Dashboard: Stop Backend
Real-Time Terminal Dashboard: Install Backend Dependencies
```

If `.venv` is missing, opening the dashboard offers to install backend dependencies automatically.

## Build VSIX

```powershell
cd extension
npm.cmd install
npm.cmd run package
```

The package script syncs `backend/` into `extension/backend`, compiles TypeScript, and creates:

```text
extension/real-time-terminal-dashboard.vsix
```

Test install locally:

```powershell
code --install-extension real-time-terminal-dashboard.vsix
```

## Publish To Marketplace

Publishing to Visual Studio Code Marketplace is free.

You need:

- A Microsoft/Azure DevOps account.
- A Visual Studio Marketplace publisher named `DzCodeProgrammer`.
- A Personal Access Token with Marketplace Manage permission.

Login and publish:

```powershell
cd extension
npx vsce login DzCodeProgrammer
npm.cmd run publish
```

## Repository

```text
https://github.com/DzCodeProgrammer/VSCode-Extensions-Real-Time-Terminal-Dashboard
```
