from __future__ import annotations

import asyncio

import psutil

from app.core.config import settings
from app.models.telemetry import ProcessSnapshot


class ProcessService:
    """Provides a bounded live process view sorted by resource pressure."""

    async def get_top_processes(self, limit: int | None = None) -> list[ProcessSnapshot]:
        return await asyncio.to_thread(self._collect_processes, limit or settings.process_limit)

    def _collect_processes(self, limit: int) -> list[ProcessSnapshot]:
        snapshots: list[ProcessSnapshot] = []
        attrs = ["pid", "name", "username", "cpu_percent", "memory_percent", "status"]

        for process in psutil.process_iter(attrs=attrs):
            try:
                info = process.info
                snapshots.append(
                    ProcessSnapshot(
                        pid=int(info["pid"]),
                        name=str(info.get("name") or "unknown"),
                        username=info.get("username"),
                        cpu_percent=float(info.get("cpu_percent") or 0),
                        memory_percent=float(info.get("memory_percent") or 0),
                        status=info.get("status"),
                    )
                )
            except (psutil.NoSuchProcess, psutil.AccessDenied, ValueError):
                continue

        return sorted(
            snapshots,
            key=lambda item: (item.cpu_percent, item.memory_percent),
            reverse=True,
        )[:limit]
