# Transformer Rooms — Design

> Locked design decisions, pedagogical on-ramp rationale, and validated milestones for `transformer-rooms`. The eight numbered decisions below were locked after a multi-day grill + research + knowledge-calibration design phase. The technical spec is cross-referenced into [`research.md`](research.md); the per-tier pedagogical calibration is in [`calibration.md`](calibration.md).

---

## 1. Eight locked design decisions

These are the load-bearing choices the whole project hangs on. Each one has at least one alternative that was considered and rejected; the rationale below is the short version.

### 1.1 Arc — hybrid, build-leaning
Each room **constructs** a transformer component, then briefly **observes** what that component does on the live model. Mechinterp doesn't appear until Level 6 (the Fourier Wing); the earlier rooms are construction sites.

Rejected: pure observation (you'd be watching, not building); pure build (you'd never see the model behave).

### 1.2 World — one task, one world
A single canonical task — **modular addition `(a + b) mod p` with `p = 113`** — using Nanda's exact configuration. The whole game lives inside one mathematical universe so motifs (the 113 vessels, the number ring, the five key frequencies) can be planted in Level 1 and pay off in Level 6.

Rejected: multiple tasks (sortable, copyable, induction-head). Cost of context-switching exceeds the pedagogical benefit at MVP scale.

### 1.3 Platform — local web
Frontend + Python backend, run locally. Audience = single user (you, or whoever clones the repo). No public deployment in v1. This decision is what makes the project tractable solo.

Rejected: in-browser model (forces giving up TransformerLens — the entire mechinterp toolkit). Rejected: SaaS deployment (cost out of proportion to the value for a teaching artifact).

### 1.4 Level unit — spatial rooms as labs
Each level is a **room**: a painted scene you can navigate, with interactive instruments embedded in it. Rooms are both visual environments *and* build-then-probe labs. This anchors abstract mathematics to architectural memory.

Reference: Machinarium (painted point-and-click), The Witness (puzzles are the learning), Distill.pub (manipulable mathematics).

### 1.5 Room slate — eight rooms (post-calibration)
The calibration round (see §3 below) added a Level 0 to the original seven:

| # | Room | Status | Purpose |
|---|------|--------|---------|
| 0 | 🧮 **Math Antechamber** *(NEW post-calibration)* | full | Vectors, matrix×vector, dot product, sin/cos as waves, unit circle |
| 1 | 🌱 **Embedding Garden** | full | The 113 vessels; lookup-table intuition; PCA over checkpoints |
| 1.5 | 🕯 **Hall of Memory** | thin | RNN/LSTM prologue — what was wrong before transformers |
| 2 | 👁 **Attention Hall** | full | Dot product as alignment; QK heatmap; OV circuit |
| 3 | 🔥 **MLP Forge** | full | Neurons, ReLU as gate, neuron ablation |
| 4 | 🗼 **Unembedding Tower** | thin (v1) | Logits → softmax → cross-entropy |
| 5 | 🔔 **Grokking Bell** | full | Pre-recorded training replay; the four-phase Nanda curve |
| 6 | 🌀 **Fourier Wing** | full | The mechinterp finale — re-enter each prior room and see the Fourier circuit hiding in plain sight |

### 1.6 Visual language — clockpunk + sacred geometry + ink-and-color-wash
- **Style prefix** (shared across all generated scene art): *painted ink and color wash illustration, deep teal and warm brass palette with ivory off-white, slightly hand-drawn imperfection, slightly elevated 3/4 view of an architectural interior, no text, no logos, painterly brushwork.*
- **Recurring motifs** (number rings, nested wheels, light beams, sacred-geometry tilework) are planted across rooms 1–4 and retroactively explained in the Fourier Wing as the literal structure of the model's learned circuit.
- **No avatar, no platforming, no twitch.** Cursor-only. Each room takes ~10–15 minutes.

### 1.7 Stack
- **Frontend:** SvelteKit 2 (Svelte 5 runes), TypeScript, SVG + Canvas, [`motion`](https://motion.dev) (v12+, NOT the unmaintained `@motionone/svelte`).
- **Backend:** FastAPI, PyTorch ≥2.6, TransformerLens (`HookedTransformer`).
- **Protocol:** REST (`/forward`, `/probe`, `/checkpoint/{step}`); one WebSocket is a stretch goal for Grokking Bell live training.
- **State:** `localStorage`. No auth, no backend persistence.
- **Art:** Generated externally with the style prefix above (validated on Nano Banana Pro / Gemini 3 Pro Image); committed as static assets, not generated at runtime.

Stack rationale: Svelte 5 over React was chosen for lower friction with live-SVG-with-data. PyTorch+TransformerLens over MLX was chosen because TransformerLens is the canonical mechinterp toolkit and has no MLX equivalent of `HookedTransformer` / `run_with_cache` / `run_with_hooks`.

### 1.8 Scope — MVP / Stretch / Out-of-scope

**MVP (v1 ships with):**
- All 8 rooms exist as scenes.
- 6 rooms fully interactive (Math Antechamber, Embedding Garden, Attention Hall, MLP Forge, Grokking Bell, Fourier Wing).
- 2 rooms thin (Hall of Memory: click-through prologue; Unembedding Tower: one slider, ~2-min scene).
- Trained model + 41 checkpoints (every 1000 epochs across the 40k run) shipped or downloadable.
- Backend: `/forward`, `/probe`, `/checkpoint/{step}`. No WebSocket in v1.
- Discovery challenges accept-on-attempt, not gated by correctness.
- Training is **replayed** (pre-recorded trajectories), not live.
- Audio: ambient room loops. No voiced narration.
- Save state: `localStorage`.
- Desktop, mouse-only, modern browsers.

**Stretch (priority order):**
1. Live training in Grokking Bell with hyperparameter knobs (WebSocket).
2. Hall of Memory becomes interactive (drag a memory packet along the RNN chain).
3. Unembedding Tower as a full room.
4. Voiced narration.
5. Multi-layer model option (induction heads, copying tasks).
6. Replay sharing (export trajectory as URL).
7. Mobile/touch.

**Out-of-scope (by design):**
- Multiplayer / social / leaderboards / XP.
- Procedural levels.
- A second task or world.
- 3D rendering.
- Native apps.
- Runtime AI generation.
- Monetization.

---

## 2. Model spec (locked, exact Nanda config)

> Source: Nanda, N., Chan, L., Lieberum, T., Smith, J., & Steinhardt, J. (2023). *Progress measures for grokking via mechanistic interpretability.* arXiv:[2301.05217](https://arxiv.org/abs/2301.05217). Reproduction details in [`research.md`](research.md).

- 1-layer transformer, **attention + MLP** (ReLU). Not attention-only — the canonical Fourier circuit lives in the MLP.
- `d_model=128`, `n_heads=4`, `d_head=32`, `d_mlp=512`, `d_vocab=114` (113 numbers + `=` token), `n_ctx=3`.
- LayerNorm: none. Positional encoding: learned.
- Optimizer: AdamW, `lr=1e-3`, `weight_decay=1.0`, `betas=(0.9, 0.98)`, full-batch GD, 40,000 epochs.
- Train fraction: 30% of all `(a, b)` pairs.
- **Five key frequencies** for `p=113`: `k ∈ {14, 35, 41, 42, 52}` — each one is a visual motif planted across rooms 1–4 and revealed in the Fourier Wing as a frequency `wₖ = 2kπ/113`.
- Reaching grokking on this config reproduces Nanda et al.'s central finding.

Loading: train in plain PyTorch (transparent code), then load into TransformerLens via `load_and_process_state_dict(fold_ln=False, center_writing_weights=False, center_unembed=False, fold_value_biases=False)` so the math you teach in the rooms matches the math you probe.

---

## 3. Pedagogical on-ramp — calibration-driven

The on-ramp design was the output of a structured five-tier knowledge calibration round (see [`calibration.md`](calibration.md) for the full study). Calibration result, summarised:

| Tier | Topic | Comfort | Implication for primer design |
|------|-------|---------|------------------------------|
| T1 | DNN basics | 2.5/4 | Light vocabulary primer |
| T2 | Training mechanics | 1.5/4 | Heavy concept primer (covers SGD/Adam, LR, weight decay → grokking link) |
| T3 | NLP output side | 1.5/4 | Light vocabulary primer (logits, softmax, CE) |
| T4 | Math for Fourier | 1/4 | **Standalone Level 0 room** — matrix×vector + sin/cos waves cannot be folded in |
| T5 | Mechinterp sensibility | 2/4 | **Vocabulary-only** primer (operational posture is already there) |

The non-obvious design insight from T5: **a learner who already has the operational posture of debugging (input → hypothesis → probe → intervention) does not need conceptual mechinterp scaffolding — only vocabulary.** This lightened the Fourier Wing's scope substantially.

**Primer-design rule** (codified from the calibration asymmetry): where intuition is strong but vocabulary is thin, primer = *"here's the name for what you already know"* (cheap). Where both are thin, primer = *teach the concept* (expensive). This rule guides every room's JIT primer.

MVP estimate post-calibration: **~6.5 weeks of focused solo work** (vs ~5 weeks pre-calibration — the math primer adds ~1.5 weeks).

---

## 4. Architectural anchors

For anyone forking or contributing:

- **Frontend** lays out one route per room under `src/routes/<room>/+page.svelte`.
- **Generated art** lives at `frontend/src/lib/assets/art/<room>/<scene>.webp` (NOT `static/`), so Vite resolves it at build time.
- **Vite proxy** maps `/api/*` → `localhost:8000` (avoids CORS in dev).
- **View Transitions API** is wired in `+layout.svelte` for room-to-room navigation.
- **Single source of truth for the model** is TransformerLens `HookedTransformer` from day one — both training-side hooks and probe-side interventions go through it.
- **Training** is in plain PyTorch (`backend/train_spike.py`); model is then loaded into TransformerLens via the function call above. Two-step instead of one because plain PyTorch code is more legible for the player to read.
- **Probe endpoint** (`POST /probe`) is a generic intervention primitive: name a hook, supply replacement activations, get the resulting output. All the mechinterp room tools build on this one endpoint.

---

## 5. Validated milestones

Each of the load-bearing assumptions has been independently validated before the full build began.

### 5.1 Grokking reproduces on our exact config
The training spike was run end-to-end on the canonical 40k-epoch Nanda config. **Result: GROKKED.** Final `train_acc = 1.0000`, `test_acc = 0.9999`, peak `1.0000` at epoch 18,800. The canonical four-phase Nanda curve was reproduced: memorization (0–200 epochs), circuit formation oscillations (~1k–17k epochs, train loss spikes), grokking transition (~14k–18k, test_acc rockets from 5% to 100% in ~4k epochs), post-grok stability (~18k–40k, both losses pinned ~10⁻⁵). See [`backend/spike_curves_v2.png`](backend/spike_curves_v2.png) for the dual-panel log-x curves. 41 checkpoints (every 1000 epochs) are now available for the Grokking Bell room's replay.

### 5.2 Art style is reproducible
Four test scenes (Embedding Garden, Attention Hall, MLP Forge, Grokking Bell) were generated with the locked style prefix. Verdict: **strong visual coherence** — all four share the deep teal + warm brass + ivory palette, the painterly ink-and-wash medium, the deckled edges, and the elevated 3/4 view. The recurring-motifs-become-Fourier-circuits payoff is technically achievable: motifs can be planted in early-room art and retroactively explained in Level 6.

### 5.3 PyTorch on Apple Silicon
The community-folk-wisdom about "MPS produces silently incorrect results" is outdated for our hardware path. PyTorch 2.9–2.11 shipped specific MPS correctness fixes; an empirical 500-epoch CPU-vs-MPS parity test in [`backend/mps_parity.py`](backend/mps_parity.py) shows both devices reach memorization at the same epoch with train losses agreeing to 3–4 decimals, no NaN, and a ~1.43× speedup on MPS. Training now defaults to MPS; the CPU v2 checkpoints remain the gold-standard reference. (Note: TransformerLens is **strictly PyTorch-only** — there is no MLX path that preserves `HookedTransformer` / `run_with_cache` / `run_with_hooks`.)

---

## 6. Sources

Primary research (verified live during the design phase):

- **Nanda et al. (2023).** *Progress measures for grokking via mechanistic interpretability.* arXiv:[2301.05217](https://arxiv.org/abs/2301.05217). Companion: [neelnanda.io/grokking-paper](https://www.neelnanda.io/grokking-paper). Walkthrough: [neelnanda.io/mechanistic-interpretability/modular-addition-walkthrough](https://www.neelnanda.io/mechanistic-interpretability/modular-addition-walkthrough).
- **TransformerLens docs:** [transformerlensorg.github.io/TransformerLens](https://transformerlensorg.github.io/TransformerLens/).
- **Svelte 5 / SvelteKit 2:** [svelte.dev/docs/svelte/overview](https://svelte.dev/docs/svelte/overview) · [svelte.dev/docs/kit/routing](https://svelte.dev/docs/kit/routing).
- **Motion:** [motion.dev/docs/quick-start](https://motion.dev/docs/quick-start).
- **PyTorch MPS:** [docs.pytorch.org/docs/stable/notes/mps.html](https://docs.pytorch.org/docs/stable/notes/mps.html); meta-tracker [PyTorch issue #77764](https://github.com/pytorch/pytorch/issues/77764).

Reference works that shaped the design:

- **[bbycroft.net/llm](https://bbycroft.net/llm)** — the closest existing artifact in the explorable-explanations tradition for transformers.
- **Bret Victor — [Up and Down the Ladder of Abstraction](https://worrydream.com/LadderOfAbstraction/)** — the navigation thesis (zoom in to a concrete instance, zoom out to the abstract structure).
- **Distill — [Building Blocks](https://distill.pub/2018/building-blocks/) + Activation Atlas** — visual conventions for mechinterp.
- **The Witness** — didactic puzzle philosophy: the puzzles ARE the learning.
- **Gorogoa** — panel-as-manipulable-truth.

Existing pedagogy this project differentiates from:

- **ARENA** — assumes PyTorch fluency + 30+ hr/week. Excellent, but a different audience.
- **Karpathy "Let's build GPT"** — teaches building, not seeing inside. Complementary, not redundant.
- **Anthropic Transformer Circuits Thread** — canonical content with no canonical interactive companion. *Be the explorable explanation the Thread never produced.*
- **Neuronpedia** — microscope, not textbook. (Different inflection of mechinterp tooling.)

---

## 7. Glossary of terms used in this doc

- **Grokking** — the empirical phenomenon where a small model fits the training set very early (memorization) but only generalises to the test set much later (sometimes 10–100× more epochs).
- **Circuit** — in mechinterp, a *subgraph* of the model — a small program assembled from multiple components (heads, neurons) that together implement an identifiable computation.
- **Ablation** — removing or zeroing out a component to see how performance changes. The clean way to test "is this component load-bearing?"
- **Activation patching** — replacing a component's activation on one input with the activation it would have had on a different input, to test "does this part carry the difference between the two cases?"
- **Restricted / Excluded loss** (Nanda 2023) — Restricted loss zeros out non-key-frequency logits; excluded loss zeros out the key-frequency components. Restricted loss decreases throughout training (even before test acc moves); excluded loss rises during cleanup as memorization unwinds. Together they're the *progress measures* the paper's title refers to.

---

*Design locked through a multi-day grill-and-research design phase ending 2026-05-03; calibration round ending 2026-05-03; prototype validation (Step B) ending 2026-05-03. Built solo as a personal exploration in mechinterp pedagogy + manipulable mathematics + painted-scene UX.*
