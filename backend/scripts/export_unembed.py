"""Dump the unembed matrix + a canonical residual to a JSON the frontend can load.

Used by Slice #12 (Unembedding Tower). The room is fully client-side after load:
the slider perturbs `resid` at position k, then the page computes
    logits = (resid + delta) @ W_U + b_U
    softmax = softmax(logits[:P])
    ce     = -log(softmax[answer])
on every tick, with no network round-trip.

Run from repo root:
    uv run python backend/scripts/export_unembed.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

# Make the backend package importable when running this script directly.
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import torch  # noqa: E402

from transformer_rooms.checkpoint_registry import CheckpointRegistry  # noqa: E402
from transformer_rooms.model_loader import ModelLoader  # noqa: E402

P = 113
EQUALS = P  # token id for "="
STEP = 39999

# (a, b) we'll feed: 5 + 17 = 22 (mod 113). The frontend uses 22 as the "correct" answer.
A, B = 5, 17
ANSWER = (A + B) % P


def _find_ckpt_dir(start: Path) -> Path:
    """Walk up looking for a backend/checkpoints dir that contains step_39999.pt.

    This lets the script run from a git worktree (which doesn't carry the
    multi-GB checkpoint files) by falling back to the primary clone above it.
    """
    candidates = [start, *start.parents]
    for c in candidates:
        d = c / "backend" / "checkpoints"
        if (d / f"step_{STEP:05d}.pt").exists():
            return d
    raise FileNotFoundError(
        f"Could not find step_{STEP:05d}.pt under any backend/checkpoints/ "
        f"walking up from {start}"
    )


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    ckpt_dir = _find_ckpt_dir(repo_root)
    out_path = repo_root / "frontend" / "static" / "weights" / "unembed.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    registry = CheckpointRegistry(ckpt_dir)
    loader = ModelLoader(registry, device="cpu")
    model = loader.load(STEP)

    W_U = model.W_U.detach().cpu()  # [d_model, d_vocab]
    b_U = model.b_U.detach().cpu()  # [d_vocab]
    assert W_U.shape == (128, P + 1), f"Unexpected W_U shape {tuple(W_U.shape)}"
    assert b_U.shape == (P + 1,), f"Unexpected b_U shape {tuple(b_U.shape)}"

    tokens = torch.tensor([[A, B, EQUALS]])
    with torch.no_grad():
        _, cache = model.run_with_cache(tokens)
    # Residual at the final ("=") position, after block 0.
    resid_post = cache["blocks.0.hook_resid_post"][0, -1].detach().cpu()  # [d_model]
    assert resid_post.shape == (128,), f"Unexpected resid shape {tuple(resid_post.shape)}"

    payload = {
        "step": STEP,
        "P": P,
        "d_model": int(W_U.shape[0]),
        "d_vocab": int(W_U.shape[1]),
        "answer": ANSWER,
        "tokens": [A, B, EQUALS],
        # Row-major: W_U[i] is the i-th d_model row; W_U[i][j] is contribution of dim i to vocab j.
        "W_U": W_U.tolist(),
        "b_U": b_U.tolist(),
        "resid_post_final": resid_post.tolist(),
    }

    out_path.write_text(json.dumps(payload))
    bytes_written = out_path.stat().st_size
    print(f"Wrote {out_path} ({bytes_written:,} bytes)")
    print(f"  step={STEP} d_model={payload['d_model']} d_vocab={payload['d_vocab']}")
    print(f"  answer={ANSWER} for ({A}, {B}, =)")


if __name__ == "__main__":
    main()
