from __future__ import annotations

import asyncio
from collections import deque
from datetime import datetime, timezone

from app.models.telemetry import TerminalLogEntry


class TerminalLogService:
    """In-memory rolling log buffer for extension and backend events."""

    def __init__(self, max_entries: int = 200) -> None:
        self._entries: deque[TerminalLogEntry] = deque(maxlen=max_entries)
        self._lock = asyncio.Lock()
        self._entries.append(
            TerminalLogEntry(
                timestamp=datetime.now(timezone.utc),
                stream="system",
                message="Dashboard telemetry service initialized.",
            )
        )

    async def append(self, message: str, stream: str = "system") -> TerminalLogEntry:
        entry = TerminalLogEntry(
            timestamp=datetime.now(timezone.utc),
            stream=stream,  # type: ignore[arg-type]
            message=message.strip(),
        )
        async with self._lock:
            self._entries.append(entry)
        return entry

    async def tail(self, limit: int = 20) -> list[TerminalLogEntry]:
        async with self._lock:
            return list(self._entries)[-limit:]
