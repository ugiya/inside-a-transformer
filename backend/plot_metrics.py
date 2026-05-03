"""Plot training/test loss and accuracy curves from metrics.json.

Renders a single PNG with two stacked subplots (loss above, accuracy below),
both on a log-scaled x-axis (so the memorization → grokking transition is
visible despite happening across orders of magnitude of training time).
"""

from __future__ import annotations
import json
import os
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


def plot(metrics_path: str, out_path: str) -> None:
    with open(metrics_path) as f:
        m = json.load(f)

    epochs = m["epochs"]
    fig, (ax_loss, ax_acc) = plt.subplots(2, 1, figsize=(10, 7), sharex=True)

    ax_loss.plot(epochs, m["train_loss"], label="train loss", linewidth=1.4)
    ax_loss.plot(epochs, m["test_loss"], label="test loss", linewidth=1.4)
    ax_loss.set_yscale("log")
    ax_loss.set_xscale("symlog", linthresh=100)
    ax_loss.set_ylabel("loss (log)")
    ax_loss.legend()
    ax_loss.grid(True, which="both", alpha=0.3)

    ax_acc.plot(epochs, m["train_acc"], label="train acc", linewidth=1.4)
    ax_acc.plot(epochs, m["test_acc"], label="test acc", linewidth=1.4)
    ax_acc.set_xscale("symlog", linthresh=100)
    ax_acc.set_ylim(-0.02, 1.02)
    ax_acc.set_xlabel("epoch (symlog)")
    ax_acc.set_ylabel("accuracy")
    ax_acc.legend()
    ax_acc.grid(True, which="both", alpha=0.3)
    ax_acc.axhline(1 / 113, color="grey", linestyle=":", linewidth=0.8, alpha=0.6, label="random (1/113)")

    fig.suptitle(
        f"modular addition spike — {len(epochs)} log points, {epochs[-1]} epochs total",
        fontsize=11,
    )
    fig.tight_layout()
    fig.savefig(out_path, dpi=140, bbox_inches="tight")
    print(f"saved {out_path}", flush=True)

    # Quick numerical summary
    final_train = m["train_acc"][-1]
    final_test = m["test_acc"][-1]
    peak_test = max(m["test_acc"])
    peak_idx = m["test_acc"].index(peak_test)
    peak_epoch = m["epochs"][peak_idx]

    print(f"final train_acc: {final_train:.4f}")
    print(f"final test_acc:  {final_test:.4f}")
    print(f"peak test_acc:   {peak_test:.4f} at epoch {peak_epoch}")


if __name__ == "__main__":
    here = os.path.dirname(__file__)
    metrics_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, "metrics.json")
    out_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(here, "spike_curves.png")
    plot(metrics_path, out_path)
