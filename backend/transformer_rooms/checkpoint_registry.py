"""Maps integer training-step numbers to checkpoint files on disk."""
from __future__ import annotations
from pathlib import Path
import re


class CheckpointNotFoundError(KeyError):
    """Raised when a requested checkpoint step has no file on disk."""


_STEP_RE = re.compile(r"^step_(\d+)\.pt$")


class CheckpointRegistry:
    def __init__(self, ckpt_dir: Path):
        self._dir = Path(ckpt_dir)

    def available_steps(self) -> list[int]:
        steps: list[int] = []
        for p in self._dir.iterdir():
            m = _STEP_RE.match(p.name)
            if m:
                steps.append(int(m.group(1)))
        steps.sort()
        return steps

    def path(self, step: int) -> Path:
        p = self._dir / f"step_{step:05d}.pt"
        if not p.exists():
            raise CheckpointNotFoundError(
                f"No checkpoint at step {step} (looked for {p.name} in {self._dir})"
            )
        return p
