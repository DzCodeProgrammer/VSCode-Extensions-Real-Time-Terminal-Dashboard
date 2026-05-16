from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from app.core.dependencies import (
    get_git_service,
    get_process_service,
    get_system_monitor,
    get_terminal_log_service,
)
from app.services.git_service import GitService
from app.services.process_service import ProcessService
from app.services.system_monitor import SystemMonitor
from app.services.terminal_log_service import TerminalLogService

templates = Jinja2Templates(directory="app/templates")
router = APIRouter(tags=["dashboard"])


@router.get("/", response_class=HTMLResponse)
async def dashboard(
    request: Request,
    monitor: SystemMonitor = Depends(get_system_monitor),
    process_service: ProcessService = Depends(get_process_service),
    git_service: GitService = Depends(get_git_service),
    terminal_log_service: TerminalLogService = Depends(get_terminal_log_service),
) -> HTMLResponse:
    snapshot = await monitor.collect(process_service, git_service, terminal_log_service)
    return templates.TemplateResponse(
        "dashboard.html",
        {"request": request, "snapshot": snapshot},
    )


@router.get("/partials/telemetry", response_class=HTMLResponse)
async def telemetry_partial(
    request: Request,
    monitor: SystemMonitor = Depends(get_system_monitor),
    process_service: ProcessService = Depends(get_process_service),
    git_service: GitService = Depends(get_git_service),
    terminal_log_service: TerminalLogService = Depends(get_terminal_log_service),
) -> HTMLResponse:
    snapshot = await monitor.collect(process_service, git_service, terminal_log_service)
    return templates.TemplateResponse(
        "partials.html",
        {"request": request, "snapshot": snapshot},
    )
