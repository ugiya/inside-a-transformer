#!/usr/bin/env python3
"""
Generate the ground-truth RNN forward-pass fixture used by
`frontend/src/lib/rnn/recurrence.test.ts`.

This script implements Geron's `SimpleRnnModel` from Hands-On ML Ch. 13
(memory cell = single Linear layer over [x_t, h_{t-1}] followed by tanh)
and dumps the weights + a chosen input sequence + the resulting hidden-state
trajectory to JSON.

The TS `recurrence.runSequence` must produce numerically equal values to the
ones recorded here. Mathematical equivalence:

    Geron concatenated form:   h_t = tanh(W · concat(x_t, h_{t-1}) + b)
    Our separated form:        h_t = tanh(W_x · x_t + W_h · h_{t-1} + b)

We slice Linear's weight matrix so that:
    W_x = linear.weight[:, :input_size]   (shape: hidden × embed_dim)
    W_h = linear.weight[:, input_size:]   (shape: hidden × hidden)
    b   = linear.bias                     (shape: hidden)

Re-run with `python frontend/scripts/generate-rnn-fixture.py` if you ever
change N, embedDim, T, seed, or want to refresh the fixture.

Source: https://github.com/uri-gil/transformer-rooms/issues/19
"""

import json
import sys
from pathlib import Path

import torch
import torch.nn as nn

# Pinned configuration so the JSON is reproducible.
SEED = 42
N = 12          # hidden_size
EMBED_DIM = 4   # input_size
T = 7           # sequence length

OUTPUT_PATH = (
    Path(__file__).resolve().parent.parent
    / "src" / "lib" / "rnn" / "__fixtures__" / "geron-ch13-rnn.json"
)


def main() -> int:
    torch.manual_seed(SEED)

    # Geron's cell: a single linear layer over the concatenated [x, h].
    cell = nn.Linear(EMBED_DIM + N, N)

    # Pre-generate the input sequence (T x EMBED_DIM) under the same seed
    # stream so the fixture is fully deterministic.
    x_seq = torch.randn(T, EMBED_DIM)

    # Run the forward pass step-by-step (Geron pattern), saving every h_t.
    h = torch.zeros(N)
    trajectory = [h.clone()]
    for t in range(T):
        x_t = x_seq[t]
        xh = torch.cat((x_t, h), dim=0)
        h = torch.tanh(cell(xh))
        trajectory.append(h.clone())

    # Slice Linear's weight matrix to recover separated W_x, W_h.
    full_w = cell.weight.detach().numpy()  # shape (N, EMBED_DIM + N)
    Wx = full_w[:, :EMBED_DIM].tolist()
    Wh = full_w[:, EMBED_DIM:].tolist()
    b = cell.bias.detach().numpy().tolist()

    fixture = {
        "_comment": (
            "Ground-truth RNN forward pass for recurrence.test.ts. "
            "Generated from Geron Ch. 13 SimpleRnnModel pattern. "
            "Re-generate with `python frontend/scripts/generate-rnn-fixture.py`."
        ),
        "config": {
            "seed": SEED,
            "N": N,
            "embedDim": EMBED_DIM,
            "T": T,
            "torchVersion": torch.__version__,
        },
        "weights": {"Wx": Wx, "Wh": Wh, "b": b},
        "inputs": x_seq.detach().numpy().tolist(),  # [T][embedDim]
        "expectedTrajectory": [h.detach().numpy().tolist() for h in trajectory],  # [T+1][N]
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(fixture, indent=2) + "\n")
    print(f"Wrote {OUTPUT_PATH}")
    print(f"  N={N}, embedDim={EMBED_DIM}, T={T}, seed={SEED}")
    print(f"  trajectory steps: {len(trajectory)} (h_0..h_{T})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
