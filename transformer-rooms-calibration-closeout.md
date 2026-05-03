---
type: session-summary
project: "Transformer Rooms"
topic: "Calibration Closeout — T5 + final recommendation"
session_type: "development"
created: 2026-05-03
---

# Transformer Rooms — Calibration Closeout

**Date:** 2026-05-03 (Sunday)
**Duration:** ~06:35 - 07:07 IDT (~32 min)
**Type:** personal

## Objective

Close out Phase 2.5 of Matt Pocock's AI-driven development workflow on the Transformer Rooms project: complete the **final tier (T5 — mechinterp sensibility)** of the knowledge calibration grill that was paused yesterday at a defensive checkpoint, then finalize the on-ramp recommendation (Level 0 Math Antechamber yes/no, per-room primer scope) that becomes input to Step C (acceptance criteria) and Phase 5 (`/to-prd`).

## Summary

Resumed the calibration grill in a fresh session, picking up exactly where yesterday's defensive checkpoint stopped — T5 (mechinterp sensibility) was the only remaining tier. Verified state with `git log --oneline` (4 commits on `main`, last was the session summary commit `e85a718`) and confirmed `calibration.md` still showed T5 as PENDING. Proceeded with the two-part T5 probe: (a) "What does 'reverse-engineer a neural network' mean to you in your own words?" and (b) name-recognition check on three terms: *circuit* (mechinterp sense), *ablation*, and *activation patching*.

The T5 result was a real surprise — **conceptual sensibility much stronger than expected**. Uri described mechinterp as *"specific debugging, similarly to using GDB poking specific RAM cells: getting input into the model, analyzing the answers, hypothesizing at which node/neuron(s) in the NN decision points are located, probe hypothesis, check if true, rinse and repeat till places are found. You can also attack those points seeing whether hypothesis is true according to changes in outputs."* That GDB-debugger analogy is exactly what TransformerLens markets itself as, and the operational shape — input/output observation → hypothesis about computation location → probe → causal intervention — *is* mechinterp. Vocabulary was the only gap: *circuit* was conflated with a single neuron (it's actually a subgraph — a tiny program built from multiple components); *ablation* was a complete blank including not knowing the English word; *activation patching* came back surprisingly close ("freezing the model with new activations patched") with one critical correction needed (activations, not weights). Final T5 rating: **2/4** (conceptual ~3/4, vocabulary ~1/4).

The asymmetry across all five tiers became a clean design insight: **strong intuitions but weak vocabulary** in T1, T3, T5 (where short "name what you already know" primers suffice); **both intuition and vocabulary thin** in T2 and T4 (where primers must teach actual concepts). This shape directly informs the on-ramp: light vocabulary onboarding for Level 6 since the mechinterp posture is already there, but heavy concept teaching for Level 0 (math) and Level 5 (training mechanics).

Surgically updated `calibration.md`: changed status from "IN PROGRESS" to "COMPLETE", filled in the T5 section with full diagnostic notes including the verbatim GDB-analogy quote, updated the comfort-rating summary table, added cross-cutting observation #6 about the T5 surprise, added observation #7 about the conceptual-vs-vocabulary asymmetry, renamed "Preliminary recommendation" to "Final recommendation", added a Level 6 adjustment note ("Fourier Wing's primer becomes lighter than originally feared — vocabulary onboarding only"), and ticked off the TODO items. Final recommendation unchanged from preliminary: **YES Level 0 Math Antechamber + per-room JIT primers**, cost ~+1.5 weeks → MVP becomes ~6.5 weeks focused work. Committed as `138e57e` ("Phase 2.5 complete: T5 closed, calibration finalized"). Phase 2.5 is now closed; the project is ready for either Step B (prototype phase) or Step C (acceptance-criteria pass) followed by `/to-prd`.

## Key Decisions

- **Level 0 Math Antechamber: confirmed YES.** Driven primarily by T4's 1/4 rating — matrix×vector and wave-intuition for sin/cos are load-bearing across the entire game (matrix×vector from Level 2; waves for Level 6). Folding this content into other rooms' primers would make those rooms double-duty and shortchange the math.
- **Per-room JIT primers: confirmed YES** for Embedding Garden, Attention Hall, MLP Forge, Unembedding Tower, Grokking Bell, and Fourier Wing. Hall of Memory remains a thin scene with no primer.
- **Level 6 (Fourier Wing) primer scope: vocabulary-only.** Originally feared this room would need heavy mechinterp scaffolding; T5 revealed the user already has the conceptual posture, so the primer just introduces the names (circuit, ablation, activation patching, residual stream) for activities the user can already intuit.
- **MVP estimate update: ~6.5 weeks of focused solo work** (was ~5 weeks pre-calibration). Justified — skipping the math primer would risk the Fourier Wing's punchline landing as nonsense.
- **No expansion of the slate** — kept the original 7 rooms plus the new Level 0; resisted the temptation to add more rooms based on calibration findings.

## Technical Context

- **Repo state**: `/Users/uri/projects/ai/transformer-rooms`, local-only, 5 commits on `main` (`138e57e` HEAD).
- **Surgical edits to `calibration.md`** (no scaffolding added, no components removed):
  - Header: status field updated.
  - Summary table: T5 row populated.
  - T5 section: pending placeholder replaced with full content (probes used, what's solid, gaps, recap items, implication for Level 6).
  - Cross-cutting observations: 2 new entries added (#6 and #7).
  - "Preliminary recommendation" → "Final recommendation".
  - Added Level 6 adjustment note.
  - TODO list: 3 of 4 items checked off (last open item: "Use as input to Step C and `/to-prd`").
- **Phase tracking** (Matt Pocock 7-phase workflow):
  - Phase 1 (Idea): ✅
  - Phase 2 (Research): ✅
  - Phase 2.5 (Calibration): ✅ **closed today**
  - Phase 3 (Prototype): ⏸ pending — Step B candidates: art-style consistency test (4 generations), Nanda model training spike (~30 min), Embedding-Garden mini-prototype
  - Phase 4 (Grill design): ✅
  - Phase 5 (`/to-prd`): pending Step C
- **Updated slate post-calibration** (8 rooms total now, including Math Antechamber):
  0. 🧮 Math Antechamber *(NEW)* — vectors, matrix×vector, dot product, sin/cos as waves, unit circle
  1. 🌱 Embedding Garden + JIT primer (lookup-table, vocabulary)
  1.5. 🕯 Hall of Memory (thin, no primer)
  2. 👁 Attention Hall + JIT primer (dot product as alignment)
  3. 🔥 MLP Forge + JIT primer (ReLU role, bias purpose)
  4. 🗼 Unembedding Tower + JIT primer (logits → softmax, cross-entropy)
  5. 🔔 Grokking Bell + JIT primer (heaviest — covers all T2 gaps: optimizer recipes, SGD/Adam(W), LR effects, weight decay → grokking link)
  6. 🌀 Fourier Wing + JIT primer (vocabulary-only: circuit, ablation, activation patching, residual stream)

## Research Findings

- **Mechinterp pedagogy implication**: a learner who has the operational posture of debugging (input → hypothesis → probe → intervention) does *not* need conceptual mechinterp scaffolding — only vocabulary. This is a non-obvious design insight that lightens Level 6's scope substantially.
- **The GDB / RAM-poking analogy**: TransformerLens explicitly markets itself as a neural network debugger. Worth surfacing this analogy *inside* Level 6's narration to anchor the player's pre-existing debugging mental model.
- **Asymmetry-driven primer-design rule**: where intuition is strong but vocabulary thin, primer = "here's the name for what you already know" (cheap). Where both are thin, primer = teach the concept (expensive). This rule is now codified in `calibration.md` observation #7 and should inform every room's primer design.

## Deliverables

### Repo files (~/projects/ai/transformer-rooms)
- [Session Summary — this note](file:///Users/uri/projects/ai/transformer-rooms/transformer-rooms-calibration-closeout.md)
- [calibration.md — finalized](file:///Users/uri/projects/ai/transformer-rooms/calibration.md)

### Prior session (yesterday)
- [Phase 1 Session Summary — design + research + T1-T4 calibration](file:///Users/uri/projects/ai/transformer-rooms/transformer-rooms-design-phase-1.md)

### Other repo artifacts
- [README.md — locked design](file:///Users/uri/projects/ai/transformer-rooms/README.md)
- [research.md — Phase 2 cached research](file:///Users/uri/projects/ai/transformer-rooms/research.md)

### Git commits added today
- `138e57e` — Phase 2.5 complete: T5 closed, calibration finalized

## Current Status & Next Steps

- **Resolved:**
  - All 5 tiers of knowledge calibration captured with comfort ratings.
  - Final on-ramp recommendation locked: Level 0 Math Antechamber + per-room JIT primers.
  - `calibration.md` finalized and committed (`138e57e`).
  - Phase 2.5 of Matt Pocock's workflow is now closed.
- **Pending:**
  - **Step B (Phase 3 — Prototype):** art-style consistency test (~4 `/art` generations); Nanda model training spike (~30 min, validates that grokking actually happens on our exact config); Embedding-Garden mini-prototype (~2 hours, validates play-feel).
  - **Step C (acceptance criteria pass):** short grill round to lock per-room "done" definitions.
  - **Phase 5 (`/to-prd`):** drafts the PRD as a GitHub issue (will need a GitHub remote first).
- **Next action:** Uri's choice between Step B (prototype, recommended — the model training spike validates the most consequential assumption before PRD locks) and Step C (acceptance criteria, faster path to PRD).
- **Blockers:**
  - Repo name decision still open (`transformer-rooms` vs `the-grokking-bell` / `fourier-wing` / `modular-rooms`).
  - GitHub remote not yet created (`/to-prd` will need a destination).

## Related Topics
- Mechanistic interpretability
- Neel Nanda — Progress measures for grokking
- Modular addition transformer
- Matt Pocock — 7 phases of AI-driven development
- `/grill-me`, `/to-prd` skills
- TransformerLens (HookedTransformer)
- Knowledge calibration / cognitive load on-ramp design
- Bret Victor / explorable explanations
