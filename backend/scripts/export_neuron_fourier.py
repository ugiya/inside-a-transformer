"""Offline NeuronFourierExporter — per-neuron projections onto canonical
Fourier modes for the modular-addition MLP at a fixed checkpoint.

For each MLP neuron ``n ∈ [0, 512)`` we measure how strongly its input
direction ``W_in[:, n]`` (a 128-dim vector) responds to the cos/sin
Fourier basis at each canonical frequency ``k ∈ {14, 35, 41, 42, 52}``
mapped through the token embedding ``W_E[:113]``.

For one frequency ``k``::

    cos_k, sin_k ∈ R^113                (Fourier basis on token grid)
    c_k = W_E[:113].T @ cos_k ∈ R^128   (basis lifted to model space)
    s_k = W_E[:113].T @ sin_k ∈ R^128
    cos_proj_n = W_in[:, n] · c_k
    sin_proj_n = W_in[:, n] · s_k
    coeff[n, k] = sqrt(cos_proj_n^2 + sin_proj_n^2)

Output written to ``frontend/static/fourier/neuron_coefficients.json``::

    {
      "step": 39999,
      "frequencies": [14, 35, 41, 42, 52],
      "neurons": [
        {"idx": 0, "coefficients": [c14, c35, c41, c42, c52]},
        ...
      ]
    }
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from transformer_rooms.checkpoint_registry import CheckpointRegistry
from transformer_rooms.model_loader import ModelLoader

P = 113
D_MODEL = 128
D_MLP = 512

CANONICAL_FREQUENCIES: tuple[int, ...] = (14, 35, 41, 42, 52)

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_REPO_ROOT = _BACKEND_DIR.parent
DEFAULT_CKPT_DIR = _BACKEND_DIR / "checkpoints"
DEFAULT_OUT_DIR = _REPO_ROOT / "frontend" / "static" / "fourier"
DEFAULT_STEP = 39999


def compute_coefficients(
    W_E: np.ndarray,
    W_in: np.ndarray,
    frequencies: tuple[int, ...] = CANONICAL_FREQUENCIES,
) -> np.ndarray:
    """Compute per-neuron Fourier-coefficient magnitudes.

    Args:
        W_E: ``[P, d_model]`` — embedding matrix restricted to integer tokens.
        W_in: ``[d_model, d_mlp]`` — MLP input matrix.
        frequencies: tuple of integer frequencies to project onto.

    Returns:
        ``[d_mlp, len(frequencies)]`` of non-negative magnitudes.
    """
    if W_E.ndim != 2 or W_E.shape[0] != P:
        raise ValueError(f"W_E must be [P={P}, d_model], got {W_E.shape}")
    if W_in.ndim != 2 or W_in.shape[0] != W_E.shape[1]:
        raise ValueError(
            f"W_in must be [d_model={W_E.shape[1]}, d_mlp], got {W_in.shape}"
        )

    p = np.arange(P, dtype=np.float64)
    out = np.zeros((W_in.shape[1], len(frequencies)), dtype=np.float64)

    for ki, k in enumerate(frequencies):
        angle = 2.0 * np.pi * k * p / P
        cos_k = np.cos(angle)
        sin_k = np.sin(angle)
        # Lift basis through embedding: (d_model,)
        c_k = W_E.T.astype(np.float64) @ cos_k
        s_k = W_E.T.astype(np.float64) @ sin_k
        # Project each neuron's input direction; W_in[:, n].
        cos_proj = W_in.astype(np.float64).T @ c_k  # (d_mlp,)
        sin_proj = W_in.astype(np.float64).T @ s_k  # (d_mlp,)
        out[:, ki] = np.sqrt(cos_proj * cos_proj + sin_proj * sin_proj)

    return out


def export(step: int, loader: ModelLoader, out_dir: Path) -> Path:
    """Export per-neuron Fourier coefficients for the given checkpoint step."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    model = loader.load(step)

    W_E_full = model.W_E.detach().cpu().numpy().astype(np.float64)
    assert W_E_full.shape == (P + 1, D_MODEL), (
        f"unexpected W_E shape {W_E_full.shape}"
    )
    W_E = W_E_full[:P]  # token rows only

    W_in = model.W_in[0].detach().cpu().numpy().astype(np.float64)
    # TransformerLens W_in shape is [n_layers, d_model, d_mlp]; layer 0 → [d_model, d_mlp].
    assert W_in.shape == (D_MODEL, D_MLP), f"unexpected W_in shape {W_in.shape}"

    coeffs = compute_coefficients(W_E, W_in, frequencies=CANONICAL_FREQUENCIES)
    assert coeffs.shape == (D_MLP, len(CANONICAL_FREQUENCIES))

    neurons = [
        {
            "idx": int(n),
            "coefficients": [float(coeffs[n, ki]) for ki in range(coeffs.shape[1])],
        }
        for n in range(D_MLP)
    ]
    payload = {
        "step": int(step),
        "frequencies": list(CANONICAL_FREQUENCIES),
        "neurons": neurons,
    }

    out_path = out_dir / "neuron_coefficients.json"
    out_path.write_text(json.dumps(payload, sort_keys=False))
    return out_path


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--step", type=int, default=DEFAULT_STEP)
    parser.add_argument("--ckpt-dir", type=Path, default=DEFAULT_CKPT_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--device", default="cpu")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    loader = ModelLoader(CheckpointRegistry(args.ckpt_dir), device=args.device)
    out = export(step=args.step, loader=loader, out_dir=args.out_dir)
    print(f"wrote {out}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
