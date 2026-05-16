from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from app.core.config import settings
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
from app.websockets.manager import websocket_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/telemetry")
async def telemetry_websocket(
    websocket: WebSocket,
    monitor: SystemMonitor = Depends(get_system_monitor),
    process_service: ProcessService = Depends(get_process_service),
    git_service: GitService = Depends(get_git_service),
    terminal_log_service: TerminalLogService = Depends(get_terminal_log_service),
) -> None:
    await websocket_manager.connect(websocket)
    try:
        while True:
            snapshot = await monitor.collect(process_service, git_service, terminal_log_service)
            await websocket.send_json(snapshot.model_dump(mode="json"))
            await asyncio.sleep(settings.telemetry_interval_seconds)
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
    except RuntimeError:
        websocket_manager.disconnect(websocket)


@router.websocket("/ws/pulse")
async def pulse_websocket(
    websocket: WebSocket,
    monitor: SystemMonitor = Depends(get_system_monitor),
) -> None:
    await websocket.accept()
    try:
        while True:
            cpu, memory = await asyncio.gather(monitor.get_cpu(), monitor.get_memory())
            await websocket.send_json(
                {
                    "cpu": cpu.percent,
                    "memory": memory.percent,
                }
            )
            await asyncio.sleep(settings.pulse_interval_seconds)
    except WebSocketDisconnect:
        return
    except RuntimeError:
        return
