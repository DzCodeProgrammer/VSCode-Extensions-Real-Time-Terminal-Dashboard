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

Node.js is optional for local development now. Press `F5` in VSCode from the workspace root, then run `Real-Time Terminal Dashboard: Open Dashboard`.

If you later install Node.js and want TypeScript compile checks:

```powershell
cd extension
npm install
npm run compile
```
