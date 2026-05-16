from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class Settings:
    """Runtime settings kept simple for extension-managed local hosting."""

    app_name: str = "Real-Time Terminal Dashboard"
    host: str = "127.0.0.1"
    port: int = 8765
    telemetry_interval_seconds: float = 3.0
    pulse_interval_seconds: float = 2.0
    process_limit: int = 8
    repository_path: Path = Path.cwd()


settings = Settings()
