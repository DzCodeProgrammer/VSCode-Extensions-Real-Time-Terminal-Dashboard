from __future__ import annotations

import asyncio
from datetime import datetime, timezone

import psutil

from app.models.telemetry import CpuSnapshot, MemorySnapshot, NetworkSnapshot, TelemetrySnapshot
from app.services.git_service import GitService
from app.services.process_service import ProcessService
from app.services.terminal_log_service import TerminalLogService


class SystemMonitor:
    """Collects host telemetry without leaking psutil details to routes."""

    async def collect(
        self,
        process_service: ProcessService,
        git_service: GitService,
        terminal_log_service: TerminalLogService,
    ) -> TelemetrySnapshot:
        cpu, memory, network, processes, git, terminal = await asyncio.gather(
            self.get_cpu(),
            self.get_memory(),
            self.get_network(),
            process_service.get_top_processes(),
            git_service.get_snapshot(),
            terminal_log_service.tail(),
        )

        return TelemetrySnapshot(
            timestamp=datetime.now(timezone.utc),
            cpu=cpu,
            memory=memory,
            network=network,
            processes=processes,
            git=git,
            terminal=terminal,
        )

    async def get_cpu(self) -> CpuSnapshot:
        def read_cpu() -> CpuSnapshot:
            return CpuSnapshot(
                percent=psutil.cpu_percent(interval=None),
                cores=psutil.cpu_percent(interval=None, percpu=True),
            )

        return await asyncio.to_thread(read_cpu)

    async def get_memory(self) -> MemorySnapshot:
        def read_memory() -> MemorySnapshot:
            memory = psutil.virtual_memory()
            return MemorySnapshot(
                total=memory.total,
                available=memory.available,
                used=memory.used,
                percent=memory.percent,
            )

        return await asyncio.to_thread(read_memory)

    async def get_network(self) -> NetworkSnapshot:
        def read_network() -> NetworkSnapshot:
            network = psutil.net_io_counters()
            return NetworkSnapshot(
                bytes_sent=network.bytes_sent,
                bytes_recv=network.bytes_recv,
                packets_sent=network.packets_sent,
                packets_recv=network.packets_recv,
            )

        return await asyncio.to_thread(read_network)
