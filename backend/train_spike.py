"""Step B.2 — Nanda modular-addition training spike.

Goal: validate that grokking actually happens on our exact config in
reasonable wall-clock time before committing the rest of the project.

Trains a 1-layer attention+MLP transformer on (a + b) mod 113 using
Nanda's published hyperparameters. Logs train/test loss + accuracy at
log-spaced epochs; saves checkpoints; emits metrics.json for later
plotting and replay in the Grokking Bell room.
"""

from __future__ import annotations
import json
import os
import time

import torch
import torch.nn.functional as F
from transformer_lens import HookedTransformer, HookedTransformerConfig

# --- config ---
P = 113
N_EPOCHS = 40_000  # match Nanda's reference impl exactly; v1 at 12k didn't fully grok
LOG_EVERY = 100
CKPT_EVERY = 1_000
SEED = 42
TRAIN_FRAC = 0.3
LR = 1e-3
WD = 1.0
BETAS = (0.9, 0.98)

# CPU is the safe choice: TransformerLens warns MPS can silently produce wrong
# results in PyTorch 2.11. For a config-validation spike we need trustworthy
# results more than speed.
device = "cpu"
print(f"device: {device}", flush=True)

torch.manual_seed(SEED)

# --- model ---
cfg = HookedTransformerConfig(
    n_layers=1,
    d_model=128,
    d_head=32,
    n_heads=4,
    d_mlp=512,
    d_vocab=P + 1,
    n_ctx=3,
    act_fn="relu",
    normalization_type=None,
    attn_only=False,
    seed=SEED,
    device=device,
)
model = HookedTransformer(cfg)

# --- data: all (a, b, =) pairs and labels ---
all_pairs = torch.tensor(
    [[a, b, P] for a in range(P) for b in range(P)],
    device=device,
)
all_labels = torch.tensor(
    [(a + b) % P for a in range(P) for b in range(P)],
    device=device,
)

n = len(all_pairs)
perm = torch.randperm(n)  # uses global RNG seeded above
n_train = int(TRAIN_FRAC * n)
train_idx = perm[:n_train]
test_idx = perm[n_train:]
train_x, train_y = all_pairs[train_idx], all_labels[train_idx]
test_x, test_y = all_pairs[test_idx], all_labels[test_idx]

print(f"train: {len(train_x)} pairs | test: {len(test_x)} pairs", flush=True)

# --- optimizer ---
opt = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=WD, betas=BETAS)

# --- training loop ---
metrics = {"epochs": [], "train_loss": [], "test_loss": [], "train_acc": [], "test_acc": []}

ckpt_dir = os.path.join(os.path.dirname(__file__), "checkpoints")
os.makedirs(ckpt_dir, exist_ok=True)

start = time.time()
last_log_time = start

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

        metrics["epochs"].append(epoch)
        metrics["train_loss"].append(tr_loss)
        metrics["test_loss"].append(te_loss)
        metrics["train_acc"].append(tr_acc)
        metrics["test_acc"].append(te_acc)

        now = time.time()
        elapsed = now - start
        delta = now - last_log_time
        last_log_time = now
        print(
            f"epoch {epoch:>5}/{N_EPOCHS} | "
            f"train L {tr_loss:.4f} A {tr_acc:.4f} | "
            f"test L {te_loss:.4f} A {te_acc:.4f} | "
            f"+{delta:.1f}s tot {elapsed:.1f}s",
            flush=True,
        )

    if epoch % CKPT_EVERY == 0 or epoch == N_EPOCHS - 1:
        torch.save(model.state_dict(), os.path.join(ckpt_dir, f"step_{epoch:05d}.pt"))

# --- save metrics ---
out = os.path.join(os.path.dirname(__file__), "metrics.json")
with open(out, "w") as f:
    json.dump(metrics, f, indent=2)

elapsed = time.time() - start
print(f"\nDone. Total time: {elapsed:.1f}s. Metrics: {out}", flush=True)
print(f"Checkpoints: {ckpt_dir}/ ({len(os.listdir(ckpt_dir))} files)", flush=True)

# --- grokking detection ---
last_train_acc = metrics["train_acc"][-1]
last_test_acc = metrics["test_acc"][-1]
peak_test_acc = max(metrics["test_acc"])
peak_test_idx = metrics["test_acc"].index(peak_test_acc)
peak_test_epoch = metrics["epochs"][peak_test_idx]

print(f"\n=== GROKKING SPIKE RESULT ===")
print(f"final train_acc: {last_train_acc:.4f}")
print(f"final test_acc:  {last_test_acc:.4f}")
print(f"peak test_acc:   {peak_test_acc:.4f} at epoch {peak_test_epoch}")
if last_test_acc > 0.95:
    print("VERDICT: GROKKED. Test accuracy >0.95 — Nanda config reproduced.")
elif last_test_acc > 0.5:
    print("VERDICT: PARTIAL. Test accuracy moved but didn't fully grok in this many epochs.")
else:
    print("VERDICT: NO GROK YET. Either need more epochs or config drift.")
