"""Offline EmbeddingsExporter — dumps PCA-2D projections of W_E per checkpoint.

For each requested training step, loads the corresponding checkpoint via
ModelLoader, extracts the embedding matrix W_E (shape [114, 128] in our
locked Nanda config), runs PCA → 2D on the first 113 rows (the integer
tokens 0..112; row 113 is the "=" token), and writes a small JSON file
to ``frontend/static/embeddings/step_NNNNN.json``.

The JSON shape mirrors the existing mock format consumed by
``frontend/src/routes/embedding-garden/+page.svelte``::

    {
      "step": 0,
      "label": "step 0",
      "points": [{"i": 0, "x": ..., "y": ...}, ...]   # 113 entries
    }

PCA is implemented via numpy SVD (no sklearn dependency). The transform is
deterministic given a fixed checkpoint, modulo the standard SVD sign
ambiguity which we resolve by anchoring the sign of each principal axis
on its largest-magnitude component (so re-running on the same checkpoint
produces byte-identical output).
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable

import numpy as np

from transformer_rooms.checkpoint_registry import CheckpointRegistry
from transformer_rooms.model_loader import ModelLoader

P = 113

DEFAULT_STEPS: tuple[int, ...] = (0, 1000, 5000, 10000, 18000, 39999)

# Repo-root-relative default paths so this works the same from a worktree
# or the main checkout.
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_REPO_ROOT = _BACKEND_DIR.parent
DEFAULT_CKPT_DIR = _BACKEND_DIR / "checkpoints"
DEFAULT_OUT_DIR = _REPO_ROOT / "frontend" / "static" / "embeddings"


def pca_2d(W: np.ndarray) -> np.ndarray:
    """Project rows of W (n×d) onto their top 2 principal components.

    Centers the data, then uses ``np.linalg.svd`` on the centered matrix.
    Returns an ``(n, 2)`` array. Sign ambiguity is resolved deterministically
    by flipping each component so that its largest-magnitude entry is
    positive — this makes the output byte-stable across reruns.
    """
    Wc = W - W.mean(axis=0, keepdims=True)
    U, S, Vt = np.linalg.svd(Wc, full_matrices=False)
    proj = U[:, :2] * S[:2]

    # Deterministic sign: flip each axis so that the entry with the largest
    # absolute value is non-negative. SVD is sign-ambiguous; this nails it.
    for k in range(proj.shape[1]):
        idx = int(np.argmax(np.abs(proj[:, k])))
        if proj[idx, k] < 0:
            proj[:, k] = -proj[:, k]

    return proj


def _label_for(step: int) -> str:
    return f"step {step}"


def export(step: int, loader: ModelLoader, out_dir: Path) -> Path:
    """Export one checkpoint's W_E PCA-2D to ``out_dir/step_NNNNN.json``.

    Returns the written path.
    """
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    model = loader.load(step)
    # TransformerLens exposes the embedding matrix as a parameter at
    # ``model.W_E`` with shape ``[d_vocab, d_model]``.
    W_E = model.W_E.detach().cpu().numpy().astype(np.float64)
    assert W_E.shape == (P + 1, 128), f"unexpected W_E shape {W_E.shape}"

    # Drop row P (the "=" token); only project the integer tokens 0..112.
    W_int = W_E[:P]
    proj = pca_2d(W_int)

    points = [
        {"i": int(i), "x": float(proj[i, 0]), "y": float(proj[i, 1])}
        for i in range(P)
    ]
    payload = {
        "step": int(step),
        "label": _label_for(step),
        "points": points,
    }

    out_path = out_dir / f"step_{step:05d}.json"
    # Stable serialization: no trailing whitespace, fixed key order, ensure
    # ASCII-only so the bytes don't drift across platforms.
    out_path.write_text(json.dumps(payload, sort_keys=False))
    return out_path


def export_all(
    steps: Iterable[int],
    *,
    ckpt_dir: Path = DEFAULT_CKPT_DIR,
    out_dir: Path = DEFAULT_OUT_DIR,
    device: str = "cpu",
) -> list[Path]:
    """Export the given steps; returns the list of written paths."""
    loader = ModelLoader(CheckpointRegistry(Path(ckpt_dir)), device=device)
    written = []
    for step in steps:
        path = export(step=step, loader=loader, out_dir=Path(out_dir))
        print(f"wrote {path}", flush=True)
        written.append(path)
    return written


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--steps",
        type=int,
        nargs="*",
        default=list(DEFAULT_STEPS),
        help=f"Training steps to export (default: {list(DEFAULT_STEPS)}).",
    )
    parser.add_argument("--ckpt-dir", type=Path, default=DEFAULT_CKPT_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--device", default="cpu")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    export_all(
        steps=args.steps,
        ckpt_dir=args.ckpt_dir,
        out_dir=args.out_dir,
        device=args.device,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
