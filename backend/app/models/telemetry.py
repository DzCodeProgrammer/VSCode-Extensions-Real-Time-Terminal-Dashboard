from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class CpuSnapshot(BaseModel):
    percent: float = Field(ge=0, le=100)
    cores: list[float]


class MemorySnapshot(BaseModel):
    total: int
    available: int
    used: int
    percent: float = Field(ge=0, le=100)


class NetworkSnapshot(BaseModel):
    bytes_sent: int
    bytes_recv: int
    packets_sent: int
    packets_recv: int


class ProcessSnapshot(BaseModel):
    pid: int
    name: str
    username: str | None = None
    cpu_percent: float = 0
    memory_percent: float = 0
    status: str | None = None


class GitSnapshot(BaseModel):
    repository: str | None = None
    branch: str | None = None
    commit: str | None = None
    dirty: bool = False
    changed_files: int = 0
    error: str | None = None


class TerminalLogEntry(BaseModel):
    timestamp: datetime
    stream: Literal["stdout", "stderr", "system"] = "system"
    message: str


class TerminalLogCreate(BaseModel):
    stream: Literal["stdout", "stderr", "system"] = "system"
    message: str = Field(min_length=1, max_length=1000)


class TelemetrySnapshot(BaseModel):
    timestamp: datetime
    cpu: CpuSnapshot
    memory: MemorySnapshot
    network: NetworkSnapshot
    processes: list[ProcessSnapshot]
    git: GitSnapshot
    terminal: list[TerminalLogEntry]
