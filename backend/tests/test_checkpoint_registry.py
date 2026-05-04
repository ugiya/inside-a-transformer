"""CheckpointRegistry unit tests using isolated fixture directories."""
from __future__ import annotations
from pathlib import Path

import pytest

from transformer_rooms.checkpoint_registry import (
    CheckpointRegistry,
    CheckpointNotFoundError,
)


def _make_fixture_dir(tmp_path: Path, step_numbers: list[int]) -> Path:
    """Create empty `step_NNNNN.pt` files for each step. Returns the dir."""
    d = tmp_path / "ckpts"
    d.mkdir()
    for step in step_numbers:
        (d / f"step_{step:05d}.pt").touch()
    return d


def test_available_steps_returns_sorted_ascending(tmp_path):
    d = _make_fixture_dir(tmp_path, [3000, 1000, 0, 39999, 18000])

    registry = CheckpointRegistry(d)
    steps = registry.available_steps()

    assert steps == [0, 1000, 3000, 18000, 39999]


def test_path_resolves_existing_step(tmp_path):
    d = _make_fixture_dir(tmp_path, [42])

    registry = CheckpointRegistry(d)
    p = registry.path(42)

    assert p.exists()
    assert p.name == "step_00042.pt"


def test_path_raises_typed_error_for_missing_step(tmp_path):
    d = _make_fixture_dir(tmp_path, [0, 1000])

    registry = CheckpointRegistry(d)

    with pytest.raises(CheckpointNotFoundError) as exc:
        registry.path(9999)

    assert "9999" in str(exc.value)
