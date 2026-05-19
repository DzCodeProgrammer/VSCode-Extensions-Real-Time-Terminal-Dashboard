# Real-Time Terminal Dashboard

Premium VSCode developer tool for realtime terminal, system, Git, and process observability.

## Architecture

The project is split into strict layers:

- `backend/app/services`: monitoring and domain logic.
- `backend/app/routes`: REST and HTMX endpoints.
- `backend/app/websockets`: realtime WebSocket streams.
- `backend/app/templates` and `backend/app/static`: HTMX dashboard UI.
- `extension/src`: VSCode extension lifecycle, commands, and webview bridge.

## Performance Defaults

- The chart uses a small custom canvas renderer instead of Chart.js.
- `/ws/pulse` sends only CPU and RAM every 2 seconds for graphing.
- Full telemetry updates are slower and bounded to reduce CPU pressure.
- The browser pauses the pulse WebSocket when the dashboard tab is hidden.

## File Tree

```text
.
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── dependencies.py
│   │   ├── models/
│   │   │   └── telemetry.py
│   │   ├── routes/
│   │   │   ├── dashboard.py
│   │   │   └── telemetry.py
│   │   ├── services/
│   │   │   ├── git_service.py
│   │   │   ├── process_service.py
│   │   │   ├── system_monitor.py
│   │   │   └── terminal_log_service.py
│   │   ├── static/
│   │   │   ├── css/dashboard.css
│   │   │   └── js/dashboard.js
│   │   ├── templates/
│   │   │   ├── dashboard.html
│   │   │   └── partials.html
│   │   ├── websockets/
│   │   │   ├── manager.py
│   │   │   └── telemetry_socket.py
│   │   └── main.py
│   ├── scripts/
│   │   └── start-server.ps1
│   └── requirements.txt
├── extension/
│   ├── src/
│   │   ├── backendManager.ts
│   │   ├── extension.ts
│   │   └── webviewProvider.ts
│   ├── package.json
│   └── tsconfig.json
└── .vscode/
    ├── launch.json
    └── tasks.json
```

## Run Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\scripts\start-server.ps1
```

Open `http://127.0.0.1:8765`.

## Run Extension

Press `F5` in VSCode from the workspace root, then run `Real-Time Terminal Dashboard: Open Dashboard`.

On Windows PowerShell, use `npm.cmd` if `npm` is blocked by execution policy:

```powershell
cd extension
npm.cmd install
npm.cmd run compile
```
## VSCode Extension UX

After pressing `F5`, the Extension Development Host shows a status bar item:

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
