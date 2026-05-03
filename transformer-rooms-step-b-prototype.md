---
type: session-summary
project: "Transformer Rooms"
project_folder: "/Users/uri/projects/ai/transformer-rooms"
topic: "Step B Prototype — training spike grokked + art consistency validated"
session_type: "development"
created: 2026-05-03
---

# Transformer Rooms — Step B Prototype Session

**Date:** 2026-05-03 (Sunday)
**Duration:** ~07:10 - 13:19 IDT (~6h 9min, intermittent)
**Type:** personal
**Project folder:** `/Users/uri/projects/ai/transformer-rooms`

## Objective

Execute Step B (Phase 3 — Prototype) of Matt Pocock's 7-phase AI-driven development workflow on the Transformer Rooms project: validate the most consequential design assumptions before locking acceptance criteria and writing the PRD. Three sub-tasks: (B.1) art-style consistency test across multiple scene prompts; (B.2) Nanda model training spike to verify the modular-addition transformer actually groks on our exact config; (B.3) one mini-interactive prototype of Embedding Garden to validate play-feel.

## Summary

Started by initializing time tracking via `/task-start` and immediately running the two parallelizable sub-tasks. Set up the backend Python environment with `uv init` and added `torch + transformer-lens` (and later `matplotlib`). Wrote `train_spike.py` implementing Nanda's exact published config: 1-layer attention+MLP HookedTransformer, p=113, d_model=128, n_heads=4, d_head=32, d_mlp=512, no LayerNorm, AdamW lr=1e-3 wd=1.0 betas=(0.9, 0.98), full-batch GD, 30% train fraction. First launched on MPS, hit `torch.Generator(device="mps")` device-mismatch error and a TransformerLens warning that "MPS may produce silently incorrect results"; defensively switched to CPU. v1 ran 12k epochs in 3.6 min and reproduced the memorization phase exactly per Nanda but didn't reach grokking (final test_acc 0.17, trending up). Re-ran v2 at 40k epochs to match Nanda's reference impl. **v2 GROKKED.** Final train_acc 1.0000, test_acc 0.9999, peak 1.0000 at epoch 18,800. The canonical four-phase Nanda figure was reproduced (memorization, circuit formation oscillations, grokking transition, post-grok stability). 41 checkpoints saved every 1000 epochs — usable for the Grokking Bell room's training-trajectory replay. Built `plot_metrics.py` for log-x dual-panel curves; the resulting plots are committed and viewable in `backend/spike_curves_v2.png`.

Mid-session, Uri pushed back on the conservative CPU choice: *"why aren't we using MLX? we have 128gb of unified memory?"* Gave honest answer: MLX would force giving up TransformerLens (architectural cost too high), but MPS is the right way to leverage Apple Silicon GPU while keeping the mechinterp toolkit. Ran live research (`backend/`-bordering investigation captured in `research.md` §7) into PyTorch 2.9–2.11 MPS correctness fixes — found that the "silently incorrect results" framing is community/TransformerLens, not PyTorch official, and recent releases shipped specific MPS correctness fixes. Then ran a 500-epoch CPU-vs-MPS parity test (`backend/mps_parity.py`) — both devices reach memorization at the same epoch, train losses agree to 3-4 decimals, no NaN, 1.43x speedup on MPS. Updated `train_spike.py` to default to MPS for future runs (the existing CPU v2 checkpoints remain the gold-standard reference). Uri also rightly pushed back on my unverified "TransformerLens is PyTorch-only" assertion; verified via four independent sources (TL pyproject.toml, registry_io.html, GitHub issue search, NotebookLM cross-check) and confirmed: TL really is PyTorch-only and the only "MLX" mention in the entire codebase is in `is_quantized_model()` for string-based filename suffix detection.

B.1 (art consistency test) was initially blocked because none of the four image-generation API keys (Replicate, Google, OpenAI, Discord/Midjourney) existed in `~/.claude/.env`. Uri added a Google AI Studio key, hit the free-tier `gemini-3-pro-image` quota (limit: 0), then enabled paid Tier 1 billing. Generated four test images via `nano-banana-pro` (Gemini 3 Pro Image) using the locked style prefix from research.md ("painted ink and color wash illustration, deep teal and warm brass palette with ivory off-white, slightly hand-drawn imperfection, slightly elevated 3/4 view of an architectural interior, no text, no logos, painterly brushwork") for four distinct rooms: Embedding Garden, Attention Hall, MLP Forge, Grokking Bell. Saved to `~/Downloads/transformer-rooms-style-test/` per the Art skill's preview-first rule. **Verdict: STRONG style consistency** — all four images share the deep teal + brass + ivory palette, the painterly ink-and-wash medium with deckled edges, the elevated 3/4 view, and feel like four illustrations from the same illustrated novel. Atmospheric mood varies appropriately by scene. The Fourier-Wing reveal mechanic ("the wallpaper has been showing you the circuits since Room 1") is technically achievable. Total cost: ~$0.16 for 4 images at Tier 1 pricing. Repo copy of the four images is **pending Uri's explicit go** per the Art skill's "after approval" rule.

B.3 (mini-interactive prototype) was deferred — out of scope for this session given the time already spent on B.1 and B.2 plus the MLX/MPS investigation. Six new commits landed on `main` (a3e... through latest checkpoint summary): training spike pipeline, v1 results, v2 success, MPS parity validation, research.md §7 (MPS+Apple Silicon), and the prior session's calibration closeout. Three new global memory files were also written: `project_transformer_rooms.md` (status + locked specs), `feedback_verify_before_asserting.md` (codifying the verification rule), and `reference_uri_skills_and_keys.md` (which API keys are configured and which path each `--model` flag uses).

## Key Decisions

- **Train on MPS by default** for future runs after empirical CPU-vs-MPS parity validation (1.43x speedup, agrees to 3-4 decimals on train_loss). CPU v2 checkpoints remain the gold-standard reference; no need to retrain.
- **MLX rejected** for this project. Switching would force giving up TransformerLens and the entire mechinterp ecosystem (no MLX equivalent of `HookedTransformer`, `run_with_cache`, `run_with_hooks`). Cost out of proportion to the speed gain. Documented in `research.md` §7.4.
- **40k epochs is the canonical training run** (matches Nanda's reference impl exactly). 12k was too few — grokking happens at ~10–18k depending on seed.
- **Art-style consistency is acceptable on Nano Banana Pro** with the locked prefix. No prefix iteration needed for v1; minor refinements (`no figures`, `from a corner`) noted for a possible v2 if/when needed.
- **Image budget for MVP holds**: ~21 hero illustrations × ~$0.04/image = ~$0.85 total. Way under the original $5 estimate.
- **B.3 deferred** to a separate session — Step B is "complete enough" with B.2 grokked and B.1 visually validated; the mini-prototype is a play-feel test that's better done in a fresh session.

## Technical Context

- **Repo state**: `/Users/uri/projects/ai/transformer-rooms`, local-only, **8 commits on `main`** as of 2026-05-03 13:19:
  - `f15d788` initial commit (README + .gitignore)
  - `c8cf3fd` Phase 2 research.md
  - `ba7e83c` Phase 2.5 calibration WIP
  - `e85a718` mid-T5 session summary checkpoint
  - `138e57e` Phase 2.5 complete (T5 closed)
  - `bf32122` calibration closeout summary
  - `f647ab4` Step B.2 v1 spike (12k, no grok)
  - `18570df` Step B.2 v2 SUCCESS (40k grokked)
  - `0a4e278` MPS parity validation + default switch
  - `0df9c05` research.md §7 (MPS + Apple Silicon)
- **Backend uv project** at `backend/` with deps: `torch>=2.6`, `transformer-lens>=3.1`, `matplotlib`. Python 3.11 (system), 3.14 (uv venv).
- **Files added this session**: `backend/train_spike.py`, `backend/plot_metrics.py`, `backend/mps_parity.py`, `backend/metrics_v2_40k_cpu.json`, `backend/metrics.json`, `backend/spike_curves_v1.png`, `backend/spike_curves_v2.png`, `backend/mps_parity_metrics.json`, `backend/pyproject.toml`, `backend/uv.lock`. Plus `research.md` §7 update.
- **Gitignored**: `backend/checkpoints/` (~41 .pt files, 25 MB total) — local-only; can be regenerated from `train_spike.py` in 12 min.
- **Apple Silicon hardware acceleration paths** (codified in `research.md` §7.4):
  - GPU matrix units → reachable via PyTorch MPS (what we use).
  - Neural Engine (ANE, 16-core, ~38 TOPS) → unreachable from PyTorch; only via CoreML / MLX bridges.
  - AMX (CPU matrix coprocessor) → used transparently when on CPU device via Accelerate framework.

## Research Findings

- **Nanda's modular-addition config reproduces grokking on our setup**, exactly per the published timeline. Memorization phase ~0–200 epochs (train_acc → 1.0); circuit formation oscillations ~1k–17k (train loss spikes between 10⁻⁶ and 10⁻²); grokking transition ~14k–18k (test_acc rockets 5% → 100% in ~4k epochs); post-grok stability ~18k–40k (both losses pinned ~10⁻⁵).
- **PyTorch MPS in 2.9–2.11 is much improved** vs the era when the TransformerLens warning was written. PyTorch 2.9 fixed BatchNorm gradient bug + SDPA NaN; 2.10 fixed silent-correctness in `fill`/`cat` for large tensors; 2.11 forced fp32 accumulators in SDPA. Live regressions still occur (e.g., #163597 SDPA non-contiguous Q for `head_dim ∈ {64, 96, 128}, seq ≤ 8`) but are narrow and don't affect our `head_dim=32` config. Sources: PyTorch release notes, MPS meta-tracker #77764, TL issue #1178 (closed).
- **TransformerLens is strictly PyTorch-only.** Verified via TL `pyproject.toml` (`torch>=2.6` hard dep, no MLX), TL docs (single "MLX" mention is in `is_quantized_model()` filename-suffix detection), TL GitHub issues+PRs (zero MLX mentions), and NotebookLM cross-check. Decision: stay on PyTorch + MPS.
- **Nano Banana Pro art style consistency**: the locked style prefix produces visually-coherent outputs across distinct architectural scenes. The `is_quantized_model()` MLX mention is purely string-detection (e.g., recognizing `*-mlx-4bit` in HuggingFace model names).

### Sources consulted today
- Nanda paper config: <https://arxiv.org/abs/2301.05217>, <https://www.neelnanda.io/grokking-paper>
- TransformerLens: <https://transformerlensorg.github.io/TransformerLens/>, <https://github.com/TransformerLensOrg/TransformerLens/blob/main/pyproject.toml>, <https://github.com/TransformerLensOrg/TransformerLens/issues/1178>
- PyTorch MPS: <https://docs.pytorch.org/docs/stable/notes/mps.html>, <https://pytorch.org/blog/pytorch-2-11-release-blog/>, <https://github.com/pytorch/pytorch/issues/77764>, <https://github.com/pytorch/pytorch/issues/163597>
- Apple: <https://developer.apple.com/metal/pytorch/>

## Deliverables

### Project folder (~/projects/ai/transformer-rooms)
- [Repo root](file:///Users/uri/projects/ai/transformer-rooms)
- [Session Summary — this note](file:///Users/uri/projects/ai/transformer-rooms/transformer-rooms-step-b-prototype.md)
- [README.md — locked design](file:///Users/uri/projects/ai/transformer-rooms/README.md)
- [research.md — research baseline + §7 MPS](file:///Users/uri/projects/ai/transformer-rooms/research.md)
- [calibration.md — finalized 5-tier sheet](file:///Users/uri/projects/ai/transformer-rooms/calibration.md)
- [backend/train_spike.py](file:///Users/uri/projects/ai/transformer-rooms/backend/train_spike.py)
- [backend/plot_metrics.py](file:///Users/uri/projects/ai/transformer-rooms/backend/plot_metrics.py)
- [backend/mps_parity.py](file:///Users/uri/projects/ai/transformer-rooms/backend/mps_parity.py)
- [backend/spike_curves_v2.png — grokking plot](file:///Users/uri/projects/ai/transformer-rooms/backend/spike_curves_v2.png)
- [backend/metrics_v2_40k_cpu.json](file:///Users/uri/projects/ai/transformer-rooms/backend/metrics_v2_40k_cpu.json)

### Generated art (preview-only, awaiting Uri's go to commit to repo)
- [01_embedding_garden.png](file:///Users/uri/Downloads/transformer-rooms-style-test/01_embedding_garden.png)
- [02_attention_hall.png](file:///Users/uri/Downloads/transformer-rooms-style-test/02_attention_hall.png)
- [03_mlp_forge.png](file:///Users/uri/Downloads/transformer-rooms-style-test/03_mlp_forge.png)
- [04_grokking_bell.png](file:///Users/uri/Downloads/transformer-rooms-style-test/04_grokking_bell.png)

### Previous sessions
- [Yesterday's Phase 1 summary (design + research + calibration T1-T4)](file:///Users/uri/obsidian/work_notes/2026/05_May/week_1_01_02/02_Saturday/transformer-rooms-design-phase-1.md)
- [Yesterday's mid-T5 checkpoint](file:///Users/uri/projects/ai/transformer-rooms/transformer-rooms-design-phase-1.md)
- [This morning's calibration closeout](file:///Users/uri/obsidian/work_notes/2026/05_May/week_2_03_09/03_Sunday/transformer-rooms-calibration-closeout.md)

### Global memory written this session
- [project_transformer_rooms.md](file:///Users/uri/.claude/projects/-Users-uri-projects-tasks-linkedin/memory/project_transformer_rooms.md)
- [feedback_verify_before_asserting.md](file:///Users/uri/.claude/projects/-Users-uri-projects-tasks-linkedin/memory/feedback_verify_before_asserting.md)
- [reference_uri_skills_and_keys.md](file:///Users/uri/.claude/projects/-Users-uri-projects-tasks-linkedin/memory/reference_uri_skills_and_keys.md)

## Current Status & Next Steps

- **Resolved:**
  - B.2 model training spike — Nanda config GROKKED on our exact reproduction (40k epochs, 12.1 min CPU; MPS parity validated at 1.43x speedup).
  - B.1 art-style consistency — STRONG visual coherence across 4 distinct room scenes; prefix is reusable.
  - MPS-vs-CPU question definitively settled (use MPS by default; documented in research.md §7).
  - MLX-vs-PyTorch question definitively settled (TransformerLens is PyTorch-only; verified four ways).
  - Step B "complete enough" — the load-bearing validations are done; B.3 (mini-prototype) deferred to a separate session.
  - Global memory updated with project status, verification rule, and skill/API-key reference.
- **Pending (next session):**
  - **Decide whether to commit the 4 art images to the repo.** They're sitting in `~/Downloads/transformer-rooms-style-test/`. If yes: `cp` to `frontend/static/art/style-test/` plus a `prefix.txt`, optionally generate 256×256 thumbnails to keep the repo small.
  - **Step B.3 (Embedding Garden mini-prototype)** — ~2 hours of frontend work: scaffold SvelteKit, build the pedestal interaction (113 SVG vessels in a ring, drag a compare tool, read cosine similarity).
  - **Step C** (acceptance criteria pass) — short grill round to lock per-room "done" definitions.
  - **Phase 5 — `/to-prd`** — drafts the PRD as a GitHub issue (will need a GitHub remote first).
- **Next action:** Uri's choice between (a) commit the 4 art images now and pause, (b) push into B.3 mini-prototype, or (c) skip B.3, run Step C acceptance criteria, then `/to-prd`.
- **Blockers:**
  - Repo name decision still open (current: `transformer-rooms`; alternatives floated: `the-grokking-bell`, `fourier-wing`, `modular-rooms`).
  - GitHub remote not yet created (`/to-prd` needs a destination).
  - Art images need explicit "go" before being copied from `~/Downloads/` to the repo.

## Related Topics
- Mechanistic interpretability
- Neel Nanda — Progress measures for grokking
- Modular addition transformer
- TransformerLens — HookedTransformer
- PyTorch MPS / Apple Silicon hardware acceleration
- MLX vs PyTorch ecosystem trade-offs
- Matt Pocock — 7 phases of AI-driven development
- Game pedagogy — Bret Victor / The Witness / Machinarium
- Nano Banana Pro / Gemini 3 Pro Image
