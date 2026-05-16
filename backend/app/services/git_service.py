from __future__ import annotations

import asyncio
from pathlib import Path

from git import InvalidGitRepositoryError, Repo

from app.core.config import settings
from app.models.telemetry import GitSnapshot


class GitService:
    """Reads repository state for dashboard context."""

    def __init__(self, repository_path: Path | None = None) -> None:
        self.repository_path = repository_path or settings.repository_path

    async def get_snapshot(self) -> GitSnapshot:
        return await asyncio.to_thread(self._read_snapshot)

    def _read_snapshot(self) -> GitSnapshot:
        try:
            repo = Repo(self.repository_path, search_parent_directories=True)
            head = repo.head.commit.hexsha[:8] if repo.head.is_valid() else None
            changed_files = len(repo.index.diff(None)) + len(repo.untracked_files)
            return GitSnapshot(
                repository=str(repo.working_tree_dir),
                branch=repo.active_branch.name if not repo.head.is_detached else "DETACHED",
                commit=head,
                dirty=repo.is_dirty(untracked_files=True),
                changed_files=changed_files,
            )
        except (InvalidGitRepositoryError, TypeError, ValueError) as exc:
            return GitSnapshot(error=str(exc))
