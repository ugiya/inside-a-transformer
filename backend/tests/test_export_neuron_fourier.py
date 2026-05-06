"""Tests for the offline NeuronFourierExporter.

Dumps per-neuron projections onto the 5 canonical Nanda frequencies
``k ∈ {14, 35, 41, 42, 52}`` for the MLP's input matrix ``W_in``
(shape ``[d_model=128, d_mlp=512]``) at a fixed checkpoint.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import pytest

from transformer_rooms.checkpoint_registry import CheckpointRegistry
from transformer_rooms.model_loader import ModelLoader

CKPT_DIR = Path(__file__).parent.parent / "checkpoints"
CANONICAL_FREQUENCIES = (14, 35, 41, 42, 52)


@pytest.fixture(scope="module")
def loader():
    return ModelLoader(CheckpointRegistry(CKPT_DIR), device="cpu")


def test_export_module_is_importable():
    from scripts import export_neuron_fourier  # noqa: F401

    assert hasattr(export_neuron_fourier, "export")
    assert hasattr(export_neuron_fourier, "compute_coefficients")
    assert hasattr(export_neuron_fourier, "CANONICAL_FREQUENCIES")
    assert tuple(export_neuron_fourier.CANONICAL_FREQUENCIES) == CANONICAL_FREQUENCIES


def test_compute_coefficients_shape_and_dtype():
    """Pure function: given W_E[:113] and W_in, returns [d_mlp, 5] floats."""
    from scripts.export_neuron_fourier import compute_coefficients

    rng = np.random.default_rng(0)
    W_E = rng.normal(size=(113, 128)).astype(np.float64)
    W_in = rng.normal(size=(128, 512)).astype(np.float64)

    coeffs = compute_coefficients(W_E, W_in, frequencies=CANONICAL_FREQUENCIES)

    assert coeffs.shape == (512, 5)
    assert coeffs.dtype == np.float64
    # Magnitudes are non-negative.
    assert np.all(coeffs >= 0.0)


def test_compute_coefficients_matches_reference_formula():
    """Spot-check: for a single neuron and frequency, verify exact formula."""
    from scripts.export_neuron_fourier import compute_coefficients

    rng = np.random.default_rng(1)
    W_E = rng.normal(size=(113, 128)).astype(np.float64)
    W_in = rng.normal(size=(128, 4)).astype(np.float64)

    P = 113
    k = 14
    p = np.arange(P)
    cos_k = np.cos(2 * math.pi * k * p / P)
    sin_k = np.sin(2 * math.pi * k * p / P)
    # Project Fourier basis through embeddings: 128-dim vectors.
    c_k = W_E.T @ cos_k  # (128,)
    s_k = W_E.T @ sin_k  # (128,)

    coeffs = compute_coefficients(W_E, W_in, frequencies=(k,))
    for n in range(4):
        cp = float(W_in[:, n] @ c_k)
        sp = float(W_in[:, n] @ s_k)
        expected = math.sqrt(cp * cp + sp * sp)
        assert coeffs[n, 0] == pytest.approx(expected, rel=1e-9, abs=1e-12)


def test_export_writes_json_with_512_neurons(tmp_path, loader):
    from scripts.export_neuron_fourier import export

    out = export(step=39999, loader=loader, out_dir=tmp_path)

    assert out.exists()
    assert out.name == "neuron_coefficients.json"
    payload = json.loads(out.read_text())

    assert "neurons" in payload
    neurons = payload["neurons"]
    assert isinstance(neurons, list)
    assert len(neurons) == 512

    seen_idx = set()
    for entry in neurons:
        assert set(entry.keys()) >= {"idx", "coefficients"}
        assert isinstance(entry["idx"], int)
        coeffs = entry["coefficients"]
        assert isinstance(coeffs, list) and len(coeffs) == 5
        for c in coeffs:
            assert isinstance(c, float)
            assert math.isfinite(c)
            assert c >= 0.0
        seen_idx.add(entry["idx"])

    assert seen_idx == set(range(512))


def test_export_includes_frequencies_metadata(tmp_path, loader):
    from scripts.export_neuron_fourier import export

    out = export(step=39999, loader=loader, out_dir=tmp_path)
    payload = json.loads(out.read_text())

    assert payload.get("frequencies") == list(CANONICAL_FREQUENCIES)
    assert payload.get("step") == 39999


def test_export_is_deterministic_for_fixed_checkpoint(tmp_path, loader):
    from scripts.export_neuron_fourier import export

    a = export(step=39999, loader=loader, out_dir=tmp_path / "a")
    b = export(step=39999, loader=loader, out_dir=tmp_path / "b")

    assert a.read_bytes() == b.read_bytes()
