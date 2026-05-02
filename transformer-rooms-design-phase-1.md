---
type: session-summary
project: "Transformer Rooms"
topic: "Design Phase 1 — grill + research + calibration"
session_type: "development"
created: 2026-05-02
---

# Transformer Rooms — Design Phase 1

**Date:** 2026-05-02 (Saturday)
**Duration:** ~18:04 - 21:57 IDT (~4 hours, intermittent)
**Type:** personal

## Objective

Lock the initial design, gather authoritative research, and calibrate Day-1-Player technical knowledge for **Transformer Rooms** — a 2D point-and-click interactive lab game that teaches transformer architecture and mechanistic interpretability via Nanda's modular-addition setup, culminating in a Fourier-circuits finale.

## Summary

Spent the session executing phases 1-2.5 of Matt Pocock's "7 phases of AI-driven development" workflow on a new greenfield project. Started by globally installing 14 of Matt's skills as symlinks from `~/projects/ai/skills` to `~/.claude/skills` (7 already existed; `obsidian-vault` skipped because Uri's personal version differs from Matt's generic one). Then ran a substantial `/grill-me` design session that locked **eight design decisions**: hybrid build-then-probe arc, single unified world (modular addition with `p=113`), local web platform with audience = single user, spatial rooms as build-then-probe labs, a 7-room slate (Embedding Garden → Hall of Memory → Attention Hall → MLP Forge → Unembedding Tower → Grokking Bell → Fourier Wing), clockpunk + sacred-geometry + ink-wash visual language, SvelteKit + FastAPI + PyTorch + TransformerLens stack, and a tight MVP/stretch/out-of-scope cut. Used NotebookLM with Matt Pocock's last 12 YouTube videos to verify what skill comes next in his methodology — confirmed `to-prd` is next, but flagged that we'd skipped phases 2 (Research) and 3 (Prototype).

Created the local repo at `~/projects/ai/transformer-rooms` with a comprehensive README capturing all eight decisions plus a `.gitignore` covering Python + Node/SvelteKit. Then executed **Phase 2 — Research** by spawning three parallel research agents covering (a) Nanda's "Progress measures for grokking" paper and TransformerLens current API, (b) Svelte 5 + SvelteKit 2 + Motion One stack, (c) reference works (bbycroft.net/llm, Bret Victor, The Witness, Gorogoa, Distill). Synthesized findings into `research.md` (10KB). Six concrete amendments to the design landed: (1) the model is 1-layer **attention + MLP** not attention-only; (2) locked `d_vocab=114`, `n_ctx=3`; (3) locked training: AdamW, `lr=1e-3`, `wd=1.0`, full-batch, 40k epochs, train fraction 30%; (4) the **5 key Fourier frequencies** `k ∈ {14, 35, 41, 42, 52}` become art-direction constraints — recurring visual motifs planted across rooms 1-4 that are revealed in Level 6; (5) use the `motion` npm package, NOT the unmaintained `@motionone/svelte`; (6) backend pipeline: train in plain PyTorch, load into TransformerLens via `load_and_process_state_dict(fold_ln=False, ...)`.

Phase 3 (Prototype) was paused mid-flight when Uri raised an important meta-concern: the design had quietly drifted upward in prerequisites and was assuming more than "basic DNN understanding." Pivoted into a **knowledge-calibration grill round** — a structured 5-tier probe (DNN basics, training mechanics, NLP/sequence basics, math for the Fourier finale, mechinterp sensibility). Captured T1-T4 in detail before user requested a defensive checkpoint mid-T5. Calibration findings: structural mental model of DNNs is intact (T1: 2.5/4), but training mechanics are thin (T2: 1.5/4 — overfitting concept solid, optimizers black-box), output-side NLP terminology is blank (T3: 1.5/4 — strong tokenization intuition, no logits/softmax/CE), and math for the Fourier finale is the deepest gap (T4: 1/4 — matrix×vector compute confused, no wave intuition for sin/cos). Pattern across all tiers: AWS ML Specialty exposure → terminology familiarity without operational understanding — exactly the audience signature the game is designed for.

Preliminary recommendation captured in `calibration.md`: **add a Level 0 Math Antechamber** (~10-15 min standalone room covering matrix×vector and waves only) **plus per-room just-in-time primer scenes**. Cost: ~+1.5 weeks on the original 5-week MVP estimate (so ~6.5 weeks total). Three commits on `main`: `f15d788` (initial repo), `c8cf3fd` (research), `ba7e83c` (calibration WIP). T5 probe and final recommendation pending.

## Deliverables

### Repo files
- [README.md (locked design)](file:///Users/uri/projects/ai/transformer-rooms/README.md)
- [research.md (Phase 2 cached research)](file:///Users/uri/projects/ai/transformer-rooms/research.md)
- [calibration.md (T1-T4 captured, T5 pending)](file:///Users/uri/projects/ai/transformer-rooms/calibration.md)
- [.gitignore](file:///Users/uri/projects/ai/transformer-rooms/.gitignore)

### Skill installations (symlinks)
- 14 new symlinks under `~/.claude/skills/` pointing to `/Users/uri/projects/ai/skills/<name>`
- New: caveman, design-an-interface, edit-article, git-guardrails-claude-code, github-triage, improve-codebase-architecture, migrate-to-shoehorn, qa, scaffold-exercises, setup-pre-commit, tdd, to-issues, triage-issue, write-a-skill
- Pre-existing (kept): domain-model, grill-me, request-refactor-plan, to-prd, ubiquitous-language, zoom-out

## Key Decisions

- **Game genre & playability**: Not a platformer; 2D point-and-click interactive lab (Machinarium + Bret Victor + The Witness lineage). Cursor-only, no avatar, ~10-15 min per room.
- **Model spec**: Adopted Nanda's exact config (1-layer attention+MLP, p=113, d_model=128, n_heads=4, d_head=32, d_mlp=512, no LayerNorm, learned positional encoding, AdamW lr=1e-3 wd=1.0, full-batch, 40k epochs, 30% train fraction). Reaching grokking on this config reproduces Nanda et al. 2023 exactly.
- **Stack pivot**: User had no preference between React/Svelte; chose Svelte 5 + SvelteKit 2 because (a) lower cliff for non-framework writer, (b) better fit for live SVG-with-data, (c) "I write Svelte 5 less reliably than React" hedge dissolves with WebFetch/context7 docs at implementation time.
- **Backend choice**: Pivoted from initial "in-browser model" recommendation to FastAPI + PyTorch + TransformerLens (B-local) per user push. Audience = single user, no deployment cost.
- **Animation library**: `motion` npm package (v12.37.0) NOT `@motionone/svelte` (unmaintained since 2023).
- **Five Fourier frequencies as visual constraints**: Every recurring motif planted across rooms 1-4 (wheels, beams, tilework patterns) should be drawable at one of `wₖ = 2kπ/113` for `k ∈ {14, 35, 41, 42, 52}`. Pays off in Level 6 reveal.
- **Pause Step B for calibration**: User caught that we'd assumed too much technical baseline. Pivoted Phase 3 prototype into Phase 2.5 calibration first.
- **Preliminary on-ramp design**: Level 0 Math Antechamber + per-room JIT primers, not just per-room.

## Technical Context

- **Repo**: `/Users/uri/projects/ai/transformer-rooms`, local-only, 3 commits on `main` (`ba7e83c` HEAD).
- **Phase tracking**: Following Matt Pocock's "7 phases of AI-driven development":
  - Phase 1 (Idea): ✅ implicit
  - Phase 2 (Research): ✅ done — `research.md`
  - Phase 3 (Prototype): ⏸ paused at user request
  - Phase 2.5 (Knowledge calibration): ⏸ paused at T5 boundary
  - Phase 4 (Grill-me design): ✅ done
  - Phase 5 (`/to-prd`): pending
- **Architectural anchors**:
  - Frontend `$lib/assets/art/<room>/<scene>.webp` for `/art` outputs (NOT `static/`).
  - Vite proxy `/api/*` → `localhost:8000` to avoid CORS.
  - View Transitions API in `+layout.svelte` for room-to-room nav.
  - Single source of truth for the model: TransformerLens `HookedTransformer` from day one.
  - Train in plain PyTorch (transparent code), load via `load_and_process_state_dict(fold_ln=False, center_writing_weights=False, center_unembed=False, fold_value_biases=False)`.

## Research Findings

- **Nanda paper config verified** against arXiv HTML, neelnanda.io, and the reference implementation. 1L attn+MLP (NOT attention-only), AdamW with `wd=1.0` is load-bearing for grokking; without weight decay, the model just memorizes.
- **Grokking timing**: Memorization ~0-1.4k epochs, circuit formation ~1.4-9.4k, cleanup/grokking ~9.4-14k.
- **Fourier circuit**: Model implements `cos(wₖ(a+b−c)) = cos(wₖ(a+b))cos(wₖc) + sin(wₖ(a+b))sin(wₖc)`; key frequencies for p=113 are `{14, 35, 41, 42, 52}`.
- **Progress measures**: Restricted loss (zero out non-key-freq logits) decreases throughout training even before test acc moves; excluded loss (zero out key-freq components) rises during cleanup as memorization unwinds.
- **TransformerLens v3.1.0** (Apr 30 2026) — `HookedTransformer` is still the path for custom configs. Hook naming convention: `blocks.{i}.attn.hook_q/_k/_v/_z/_pattern`, `blocks.{i}.hook_resid_pre/_mid/_post`, `blocks.{i}.mlp.hook_pre/_post`.
- **Svelte 5.55.5 + SvelteKit 2.59.0** (May 2026) — runes API stable; idiomatic per-route component pattern works for one-room-per-route layout.
- **Reference works to study before code**: bbycroft.net/llm (closest existing artifact), Bret Victor "Up and Down the Ladder of Abstraction" (the navigation thesis), The Witness (didactic philosophy), Gorogoa (panel-as-manipulable-truth), Distill Building Blocks + Activation Atlas (mechinterp visual conventions).
- **Existing pedagogy to differentiate from**: ARENA (assumes PyTorch fluency + 30+ hr/week), Karpathy "Let's build GPT" (teaches building, not seeing), Anthropic Transformer Circuits Thread (canonical content with no canonical interactive), Neuronpedia (microscope not textbook).

### Sources
- arXiv: <https://arxiv.org/abs/2301.05217>
- Nanda companion: <https://www.neelnanda.io/grokking-paper>
- Modular-addition walkthrough: <https://www.neelnanda.io/mechanistic-interpretability/modular-addition-walkthrough>
- TransformerLens docs: <https://transformerlensorg.github.io/TransformerLens/>
- Svelte: <https://svelte.dev/docs/svelte/overview>
- SvelteKit: <https://svelte.dev/docs/kit/routing>
- Motion: <https://motion.dev/docs/quick-start>
- Reference inspiration: <https://bbycroft.net/llm>, <https://worrydream.com/LadderOfAbstraction/>, <https://distill.pub/2018/building-blocks/>

## Current Status & Next Steps

- **Resolved:**
  - 8 design decisions locked in `README.md`.
  - Research baseline cached in `research.md` with 6 concrete design amendments.
  - T1-T4 of knowledge calibration captured in `calibration.md`.
  - Local repo created with 3 clean commits.
  - Matt Pocock's skill set installed globally as symlinks.
- **Pending:**
  - **T5 probe** (mechinterp sensibility) — single question prepared, user paused for safety checkpoint.
  - Finalize calibration recommendation (Level 0 Antechamber yes/no + per-room primer budgets).
  - Step B (Phase 3 — Prototype): art-style consistency test (4 generations), Nanda model training spike (~30 min), one mini-interactive prototype for Embedding Garden's pedestal.
  - Step C: per-room acceptance criteria pass (one short grill round).
  - Phase 5: `/to-prd`.
- **Next action when session resumes:** Run T5 probe with the question already prepared in this thread (mechinterp sensibility — "reverse-engineer a NN" + circuit/ablation/activation-patching name recognition). After answer, finalize `calibration.md` and commit. Then proceed to Step B prototype phase or Step C acceptance criteria depending on user preference.
- **Blockers:**
  - Repo name decision still open (current: `transformer-rooms`; alternatives floated: `the-grokking-bell`, `fourier-wing`, `modular-rooms`).
  - GitHub remote not yet created (`/to-prd` will need a destination).

## Related Topics
- Mechanistic interpretability
- Neel Nanda — Progress measures for grokking
- Modular addition transformer
- Matt Pocock — 7 phases of AI-driven development
- `/grill-me`, `/to-prd` skills
- SvelteKit 2 / Svelte 5 runes
- TransformerLens (HookedTransformer)
- Bret Victor / explorable explanations
- Game pedagogy (The Witness, Machinarium, Gorogoa)
