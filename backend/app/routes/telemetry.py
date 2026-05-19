from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import (
    get_git_service,
    get_process_service,
    get_system_monitor,
    get_terminal_log_service,
)
from app.models.telemetry import TerminalLogCreate, TerminalLogEntry, TelemetrySnapshot
from app.services.git_service import GitService
from app.services.process_service import ProcessService
from app.services.system_monitor import SystemMonitor
from app.services.terminal_log_service import TerminalLogService

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


@router.get("", response_model=TelemetrySnapshot)
async def telemetry_snapshot(
    monitor: SystemMonitor = Depends(get_system_monitor),
    process_service: ProcessService = Depends(get_process_service),
    git_service: GitService = Depends(get_git_service),
    terminal_log_service: TerminalLogService = Depends(get_terminal_log_service),
) -> TelemetrySnapshot:
    return await monitor.collect(process_service, git_service, terminal_log_service)


@router.post("/terminal", response_model=TerminalLogEntry)
async def append_terminal_log(
    payload: TerminalLogCreate,
    terminal_log_service: TerminalLogService = Depends(get_terminal_log_service),
) -> TerminalLogEntry:
    return await terminal_log_service.append(payload.message, payload.stream)
