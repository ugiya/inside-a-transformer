"""Build the three Grokking Bell trajectory JSONs.

Outputs
-------
frontend/static/trajectories/
    default-grok.json   # Real Step B.2 run, downsampled to ~80 points.
    fast-grok.json      # Synthesized: full grok by epoch ~5000.
    never-grok.json     # Synthesized: train fits, test stuck at chance.

The shape used by the frontend room is:
    {
        "id":         "default-grok",
        "label":      "Default grok (real Step B.2 run)",
        "steps":      [int, ...],
        "train_loss": [float, ...],
        "train_acc":  [float, ...],
        "test_loss":  [float, ...],
        "test_acc":   [float, ...]
    }

This script is deterministic: rerunning produces byte-identical output.
"""
from __future__ import annotations

import json
import math
import random
from pathlib import Path

P = 113
CHANCE = 1.0 / P  # ~0.00885

# Resolve repo paths relative to this file.
BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent
METRICS_V2 = BACKEND_DIR / "metrics_v2_40k_cpu.json"
OUT_DIR = REPO_ROOT / "frontend" / "static" / "trajectories"


def _round_list(xs: list[float], n: int = 6) -> list[float]:
    return [round(float(x), n) for x in xs]


def build_default_grok(target_points: int = 80) -> dict:
    """Downsample the real metrics_v2 trajectory to ~target_points."""
    raw = json.loads(METRICS_V2.read_text())
    epochs = raw["epochs"]
    n = len(epochs)
    # Even stride downsample, then ensure first + last are present.
    stride = max(1, n // target_points)
    idx = list(range(0, n, stride))
    if idx[-1] != n - 1:
        idx.append(n - 1)

    def take(key: str) -> list[float]:
        return [raw[key][i] for i in idx]

    return {
        "id": "default-grok",
        "label": "Default grok (real Step B.2 run, 40k epochs)",
        "steps": [int(epochs[i]) for i in idx],
        "train_loss": _round_list(take("train_loss")),
        "train_acc": _round_list(take("train_acc")),
        "test_loss": _round_list(take("test_loss")),
        "test_acc": _round_list(take("test_acc")),
    }


def _sample_steps(end: int, n: int) -> list[int]:
    """Roughly log-spaced step grid from 0..end with n points; first=0, last=end."""
    if n < 2:
        return [0, end]
    pts = []
    for i in range(n):
        # log-spaced with a small linear term so we get points near 0.
        t = i / (n - 1)
        # quadratic-ish curve emphasizes early epochs (where the action is)
        s = int(round(end * (t ** 1.4)))
        pts.append(s)
    pts[0] = 0
    pts[-1] = end
    # de-dup while preserving order
    seen: set[int] = set()
    out: list[int] = []
    for s in pts:
        if s not in seen:
            seen.add(s)
            out.append(s)
    return out


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def build_fast_grok(seed: int = 7) -> dict:
    """Synthesized trajectory where test_acc reaches 1.0 by epoch ~5000."""
    rng = random.Random(seed)
    end = 40000
    steps = _sample_steps(end, 80)
    train_loss: list[float] = []
    train_acc: list[float] = []
    test_loss: list[float] = []
    test_acc: list[float] = []
    for s in steps:
        # Training fits very fast (by ~800 epochs).
        tr_l = max(1e-4, 5.0 * math.exp(-s / 250.0)) * (1.0 + 0.05 * rng.uniform(-1, 1))
        tr_a = min(1.0, max(0.0, 1.0 - math.exp(-s / 220.0))) * (1.0 - 0.005 * rng.random())
        # Test grokking centered at ~3500 with a fast transition (sigma ~600).
        center = 3500
        sigma = 600
        progress = _sigmoid((s - center) / sigma)
        te_a = max(CHANCE, min(1.0, CHANCE + (1.0 - CHANCE) * progress))
        # Test loss high (~5) until grok, then drops sharply toward ~1e-3.
        te_l = (5.0 * (1.0 - progress)) + (1e-3 * progress) + 0.02 * rng.uniform(-1, 1)
        te_l = max(1e-4, te_l)
        train_loss.append(tr_l)
        train_acc.append(tr_a)
        test_loss.append(te_l)
        test_acc.append(te_a)
    # Force the post-grok plateau to be exactly 1.0 / near-zero.
    for i, s in enumerate(steps):
        if s >= 5000:
            test_acc[i] = 1.0
            test_loss[i] = max(1e-4, test_loss[i] * 0.0 + 1e-3)
            train_acc[i] = 1.0
            train_loss[i] = max(1e-4, 5e-4)
    return {
        "id": "fast-grok",
        "label": "Fast grok (synthesized — full generalization by epoch ~5000)",
        "steps": steps,
        "train_loss": _round_list(train_loss),
        "train_acc": _round_list(train_acc),
        "test_loss": _round_list(test_loss),
        "test_acc": _round_list(test_acc),
    }


def build_never_grok(seed: int = 13) -> dict:
    """Synthesized trajectory: train fits, test stays near chance the whole way."""
    rng = random.Random(seed)
    end = 40000
    steps = _sample_steps(end, 80)
    train_loss: list[float] = []
    train_acc: list[float] = []
    test_loss: list[float] = []
    test_acc: list[float] = []
    for s in steps:
        # Train still fits, just slower than fast-grok.
        tr_l = max(1e-4, 5.0 * math.exp(-s / 1500.0)) * (1.0 + 0.05 * rng.uniform(-1, 1))
        tr_a = min(1.0, max(0.0, 1.0 - math.exp(-s / 1300.0))) * (1.0 - 0.005 * rng.random())
        # Test never generalizes — random class probability.
        # Add slow drift in test_loss as the model overfits (cross-entropy gets worse).
        te_a = max(0.0, min(1.0, CHANCE + 0.003 * rng.uniform(-1, 1)))
        # Cross-entropy on random ~ ln(P) ≈ 4.73, slowly rising as overfitting grows.
        baseline = math.log(P)
        te_l = baseline + 0.4 * (s / end) + 0.05 * rng.uniform(-1, 1)
        train_loss.append(tr_l)
        train_acc.append(tr_a)
        test_loss.append(te_l)
        test_acc.append(te_a)
    return {
        "id": "never-grok",
        "label": "Never grok (synthesized — overfitting forever, test stays at chance)",
        "steps": steps,
        "train_loss": _round_list(train_loss),
        "train_acc": _round_list(train_acc),
        "test_loss": _round_list(test_loss),
        "test_acc": _round_list(test_acc),
    }


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    trajectories = {
        "default-grok.json": build_default_grok(),
        "fast-grok.json": build_fast_grok(),
        "never-grok.json": build_never_grok(),
    }
    for name, data in trajectories.items():
        out = OUT_DIR / name
        out.write_text(json.dumps(data, indent=2) + "\n")
        print(f"wrote {out}  ({len(data['steps'])} points)")


if __name__ == "__main__":
    main()
