from __future__ import annotations

from functools import lru_cache

from app.services.git_service import GitService
from app.services.process_service import ProcessService
from app.services.system_monitor import SystemMonitor
from app.services.terminal_log_service import TerminalLogService


@lru_cache(maxsize=1)
def get_system_monitor() -> SystemMonitor:
    return SystemMonitor()


@lru_cache(maxsize=1)
def get_process_service() -> ProcessService:
    return ProcessService()


@lru_cache(maxsize=1)
def get_git_service() -> GitService:
    return GitService()


@lru_cache(maxsize=1)
def get_terminal_log_service() -> TerminalLogService:
    return TerminalLogService()
