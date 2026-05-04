"""Tests for the offline EmbeddingsExporter (PCA→2D dump of W_E)."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from transformer_rooms.checkpoint_registry import CheckpointRegistry
from transformer_rooms.model_loader import ModelLoader

CKPT_DIR = Path(__file__).parent.parent / "checkpoints"


@pytest.fixture(scope="module")
def loader():
    return ModelLoader(CheckpointRegistry(CKPT_DIR), device="cpu")


def test_export_module_is_importable():
    # Resolves the script as an importable module under backend/scripts/.
    from scripts import export_embeddings  # noqa: F401

    assert hasattr(export_embeddings, "export")
    assert hasattr(export_embeddings, "pca_2d")


def test_export_writes_json_with_113_entries(tmp_path, loader):
    from scripts.export_embeddings import export

    out = export(step=0, loader=loader, out_dir=tmp_path)

    assert out.exists()
    assert out.name == "step_00000.json"
    payload = json.loads(out.read_text())

    assert payload["step"] == 0
    assert isinstance(payload["label"], str) and payload["label"]
    points = payload["points"]
    assert isinstance(points, list)
    assert len(points) == 113

    for p in points:
        assert set(p.keys()) == {"i", "x", "y"}
        assert isinstance(p["i"], int)
        assert isinstance(p["x"], float)
        assert isinstance(p["y"], float)


def test_export_indices_cover_0_to_112_exactly(tmp_path, loader):
    from scripts.export_embeddings import export

    out = export(step=0, loader=loader, out_dir=tmp_path)
    payload = json.loads(out.read_text())
    indices = sorted(p["i"] for p in payload["points"])

    assert indices == list(range(113))


def test_export_is_deterministic_for_fixed_checkpoint(tmp_path, loader):
    from scripts.export_embeddings import export

    out_a = export(step=0, loader=loader, out_dir=tmp_path / "a")
    out_b = export(step=0, loader=loader, out_dir=tmp_path / "b")

    assert out_a.read_bytes() == out_b.read_bytes()


def test_pca_2d_returns_shape_113_by_2():
    import numpy as np
    from scripts.export_embeddings import pca_2d

    rng = np.random.default_rng(0)
    W = rng.normal(size=(114, 128)).astype(np.float32)
    proj = pca_2d(W[:113])

    assert proj.shape == (113, 2)
