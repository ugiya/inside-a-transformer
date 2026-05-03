"""MPS vs CPU parity test for our specific 1L modular-addition transformer.

Per the research findings: PyTorch RNG bit-exactness differs across devices,
so we can't expect identical loss values, but we DO expect:
  1. Both devices to reproduce the memorization phase (train_acc -> 1.0 by ~epoch 200).
  2. Final-epoch losses within fp32 noise (~3-4 decimal places agreement on stable values).
  3. No NaNs, no divergence, no garbage outputs on MPS.

Quick spike: train the same config on each device for 500 epochs and dump
side-by-side metrics. If MPS tracks CPU qualitatively, MPS is trustworthy
for our workload.
"""

from __future__ import annotations
import json
import os
import time

import torch
import torch.nn.functional as F
from transformer_lens import HookedTransformer, HookedTransformerConfig

P = 113
N_EPOCHS = 500
LOG_EVERY = 50
SEED = 42
TRAIN_FRAC = 0.3
LR = 1e-3
WD = 1.0
BETAS = (0.9, 0.98)


def train_run(device: str) -> dict:
    print(f"\n=== device: {device} ===", flush=True)
    torch.manual_seed(SEED)

    cfg = HookedTransformerConfig(
        n_layers=1, d_model=128, d_head=32, n_heads=4, d_mlp=512,
        d_vocab=P + 1, n_ctx=3, act_fn="relu",
        normalization_type=None, attn_only=False, seed=SEED, device=device,
    )
    model = HookedTransformer(cfg)

    all_pairs = torch.tensor(
        [[a, b, P] for a in range(P) for b in range(P)], device=device,
    )
    all_labels = torch.tensor(
        [(a + b) % P for a in range(P) for b in range(P)], device=device,
    )
    n = len(all_pairs)
    perm = torch.randperm(n)
    n_train = int(TRAIN_FRAC * n)
    train_x, train_y = all_pairs[perm[:n_train]], all_labels[perm[:n_train]]
    test_x, test_y = all_pairs[perm[n_train:]], all_labels[perm[n_train:]]

    opt = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=WD, betas=BETAS)

    metrics = {"epochs": [], "train_loss": [], "test_loss": [], "train_acc": [], "test_acc": []}
    start = time.time()

    for epoch in range(N_EPOCHS):
        model.train()
        logits = model(train_x)[:, -1, :P]
        loss = F.cross_entropy(logits, train_y)
        opt.zero_grad()
        loss.backward()
        opt.step()

        if epoch % LOG_EVERY == 0 or epoch == N_EPOCHS - 1:
            model.eval()
            with torch.no_grad():
                tr = model(train_x)[:, -1, :P]
                te = model(test_x)[:, -1, :P]
                tr_loss = F.cross_entropy(tr, train_y).item()
                te_loss = F.cross_entropy(te, test_y).item()
                tr_acc = (tr.argmax(-1) == train_y).float().mean().item()
                te_acc = (te.argmax(-1) == test_y).float().mean().item()

            # NaN check
            if any(map(lambda x: x != x, [tr_loss, te_loss, tr_acc, te_acc])):
                print(f"  !!! NaN at epoch {epoch} on {device} — abort", flush=True)
                metrics["NAN_AT"] = epoch
                break

            metrics["epochs"].append(epoch)
            metrics["train_loss"].append(tr_loss)
            metrics["test_loss"].append(te_loss)
            metrics["train_acc"].append(tr_acc)
            metrics["test_acc"].append(te_acc)
            print(
                f"  ep {epoch:>4} | tr_L {tr_loss:.4f} A {tr_acc:.4f} | "
                f"te_L {te_loss:.4f} A {te_acc:.4f}",
                flush=True,
            )

    metrics["wall_seconds"] = time.time() - start
    return metrics


def main():
    print("MPS available:", torch.backends.mps.is_available(), flush=True)

    cpu_m = train_run("cpu")
    mps_m = train_run("mps") if torch.backends.mps.is_available() else None

    print("\n\n=== PARITY REPORT ===")
    print(f"{'epoch':>6} | {'cpu_tr_acc':>10} {'mps_tr_acc':>10} | "
          f"{'cpu_te_acc':>10} {'mps_te_acc':>10} | "
          f"{'cpu_tr_loss':>11} {'mps_tr_loss':>11}")
    if mps_m is None:
        print("  MPS unavailable on this machine.")
        return

    for i, ep in enumerate(cpu_m["epochs"]):
        if i >= len(mps_m["epochs"]):
            break
        print(
            f"{ep:>6} | "
            f"{cpu_m['train_acc'][i]:>10.4f} {mps_m['train_acc'][i]:>10.4f} | "
            f"{cpu_m['test_acc'][i]:>10.4f} {mps_m['test_acc'][i]:>10.4f} | "
            f"{cpu_m['train_loss'][i]:>11.4f} {mps_m['train_loss'][i]:>11.4f}"
        )

    print(f"\nwall: cpu {cpu_m['wall_seconds']:.1f}s | mps {mps_m['wall_seconds']:.1f}s "
          f"(speedup {cpu_m['wall_seconds']/mps_m['wall_seconds']:.2f}x)")

    final_cpu = cpu_m["train_acc"][-1]
    final_mps = mps_m["train_acc"][-1]
    if final_cpu > 0.99 and final_mps > 0.99:
        print("\nVERDICT: BOTH devices reach memorization (train_acc > 0.99). MPS is viable.")
    elif final_cpu > 0.99 and final_mps < 0.5:
        print("\nVERDICT: CPU memorized but MPS DIDN'T. MPS produces wrong results — stay on CPU.")
    else:
        print(f"\nVERDICT: ambiguous — cpu {final_cpu:.4f}, mps {final_mps:.4f}. Inspect manually.")

    out = os.path.join(os.path.dirname(__file__), "mps_parity_metrics.json")
    with open(out, "w") as f:
        json.dump({"cpu": cpu_m, "mps": mps_m}, f, indent=2)
    print(f"\nSaved {out}")


if __name__ == "__main__":
    main()
