# Knowledge Calibration Sheet — Uri (Day-1-Player)

**Status:** COMPLETE — all 5 tiers captured, recommendation finalized.
**Date started:** 2026-05-02
**Date completed:** 2026-05-03
**Framing:** mixed, weighted toward α — the finished game must be playable by Day-1-Uri.
**Method:** `/grill-me` knowledge-calibration round (no design; probes only).

This sheet is the input to:
- Step C of phase 2 (per-room acceptance criteria).
- The Level 0 / per-room-explainer-scene decision.
- Eventually the PRD (`/to-prd`).

---

## Summary of comfort ratings

| Tier | Topic | Rating | One-line |
|---|---|---|---|
| T1 | DNN basics | **2.5 / 4** | Structural model intact (layers, weights, ReLU, loss, backprop direction); mechanism vague. |
| T2 | Training mechanics | **1.5 / 4** | Overfitting concept ✅; toolkit of mitigations thin; optimizers = magic boxes. |
| T3 | NLP / sequence basics | **1.5 / 4** | Strong tokenization/semantic-space intuition (input side); output-side terminology thin (logits/softmax/CE blanks). |
| T4 | Math for Fourier finale | **1 / 4** | Linalg shape rule ✅ but matrix×vector compute wrong; trig at SOH-CAH-TOA only, no wave/periodicity intuition; "Fourier" name only via MPEG context. |
| T5 | Mechinterp sensibility | **2 / 4** | Strong conceptual sensibility (~3/4 — "NN debugger" GDB analogy is exactly right); vocabulary thin (~1/4). |

Meta-pattern across all tiers: AWS ML Specialty cert exposure (passed 2 months ago, just before phase-out) → strong **terminology familiarity** without **operational understanding**. *This is the perfect signature for the game's audience — exposure-to-operationalization is exactly what the rooms are designed to do.*

---

## T1 — DNN basics — 2.5 / 4

**Probes used:**
1. *"What does a fully-connected layer compute, given 4-in / 3-out?"*
2. *"If nudging w₅ bigger raises the loss, what do you do? One weight at a time, or all together?"*

**What's solid:**
- Layer architecture: input neurons → hidden → output, weights on connections.
- Per-neuron computation: weighted sum of previous-layer values.
- Bias term exists.
- ReLU named correctly; non-linearity → universal-approximator intuition present.
- Loss function compares prediction to ground truth.
- Backprop direction: "nudge to decrease loss" ✅ (correct sign).
- Term recognition: "gradient descent" rings a bell.

**Gaps:**
- **Matrix-view of a layer** (`output = ReLU(W @ x + b)` as a single vectorized op). Currently thinks neuron-by-neuron — correct but doesn't generalize cleanly.
- **Why bias exists** (shifts the activation; without it every layer must pass through 0).
- **Backprop mechanism** ("somehow"). Lacks chain-rule intuition.
- **One-step vs all-weights**: unsure if updates happen one-at-a-time or all-together. Truth: all weights update simultaneously each step, using gradients computed for all of them in one backward pass.
- Self-described: "no mathematical intuition here, nor actual experience."

**Recap items (1–2 min explainer-scene material):**
- Vectorized layer formula with one visual: `output_j = ReLU(Σᵢ Wⱼᵢ · xᵢ + bⱼ)`.
- Bias as "ability to shift the activation."
- One training step = forward → loss → backward (compute gradients for all weights) → update all weights simultaneously.

---

## T2 — Training mechanics — 1.5 / 4

**Probes used:**
1. *"Train loss → 0; test loss creeps up. What's happening, why, what knobs?"*
2. *"What does learning rate do? What's weight decay?"*
3. *"SGD vs Adam — vibes only."*

**What's solid:**
- ✅ **Overfitting**: recognized, named correctly, gave the correct "why" (no generalization).
- ✅ **Smaller model** as one mitigation.
- ✅ "S" in SGD → stochastic (term recognition).
- 💡 Independently *guessed* "weight decay = weight losing relevancy" — surprisingly close to actual mechanism (pulls weights toward zero each step).

**Gaps:**
- **Early stopping** (the term — recognized concept, not name).
- **Learning rate effects** — confused: thought high LR → underfitting, low LR → overfitting. **MISCONCEPTION**: actually high LR → overshoot/divergence, low LR → slow/stuck. Under/over-fitting are separate axes.
- **Regularization** as umbrella term: not recalled.
- **L1 / L2**: heard, mechanism forgotten.
- **Dropout**: misremembered as "deleting features" (actually zeros activations during training).
- **Data augmentation**: forgotten.
- **Weight decay** (mechanism): unknown — though the *guess* was directionally correct.
- **Optimizers in general**: black-box. Has no model of what an optimizer "does" beyond "updates weights."
- **SGD vs Adam**: undifferentiated. Doesn't know momentum / per-parameter learning rates.
- Threw out "exploding/vanishing gradients" as adjacent terms — different concept, not relevant to grokking.

**Recap items:**
- Learning rate corrected: too-high → divergence; too-low → slow convergence. *Not* directly tied to overfitting.
- Weight decay = "shrink each weight a little every step toward zero." Closely related to L2 regularization.
- Optimizer = "the recipe for *how* you turn gradients into a weight update." SGD = naive recipe. Adam = adds momentum + per-weight adaptive scaling.
- AdamW = Adam with decoupled weight decay (the variant Nanda uses).
- Why weight decay matters for grokking: without it, the model just memorizes; weight decay is what *forces* the model to find the simpler Fourier circuit during the cleanup phase.

---

## T3 — NLP / sequence basics — 1.5 / 4

**Probes used:**
1. *"How does the integer 5 become something a network can multiply?"*
2. *"What are logits / softmax / cross-entropy?"*

**What's solid:**
- ✅ **Tokenization concept**: subword tokens, each → unique ID.
- ✅ **Semantic vector space**: "closely semantic words are also closer in this space" — has the embedding *intuition* even without the mechanism name.
- 💡 Independently asked: *"is there a semantic space where numbers might represent numbers?"* — exactly the right curiosity. Modular addition's answer: yes, beautifully (numbers embed onto a circle reflecting their cyclic structure). This is a Level 1 payoff handle.
- ✅ Q3: arrived at "each number must be a token, unique to its own."

**Gaps:**
- **Embedding mechanism**: doesn't know "lookup table → row of W_E." Confused with float type-cast ("convert 5 to 5.000" — that's int→float in memory, not embedding).
- **Logits**: term not recognized.
- **Softmax**: concept *partially* there ("normalize to 0–1"), name blended ("sigmax" — sigmoid is the binary cousin; softmax is multi-class).
- **Cross-entropy loss**: complete blank.
- Self-flagged "overwhelmed" at this point (term-density spike).

**Recap items:**
- Embedding lookup as visual: vocab index `i` → row `i` of an embedding matrix `W_E`. Each row is a learned vector.
- Logits: "raw output before turning into probabilities." Just a name for a vector.
- Softmax: "exponentiate, normalize" — turns 114 raw numbers into 114 probabilities summing to 1.
- Cross-entropy: "how far is predicted distribution from the right answer." `−log(p_correct)`.

---

## T4 — Math for the Fourier finale — 1 / 4

**Probes used:**
1. *"Matrix×vector — output shape and what's in it? Sin/cos — graph picture?"*
2. *"Fourier transform — name recognition?"*

**What's solid:**
- ✅ Knows linalg shape constraint exists (inner dims must match).
- ✅ **Geometric** sin/cos: SOH-CAH-TOA — sides of a triangle, ratios with the angle. (Hebrew "צלע" = side ✅.)
- ✅ Fourier name recognition via MPEG/compression context. (Bonus: MPEG-2 actually uses DCT, a Fourier-family transform.)

**Gaps (this tier dominates the design recommendation):**
- **Matrix × vector compute**: tried to flatten all multiplications into one scalar (`A (3×4) @ x (4)` returned "12, the shape is 12"). Correct answer: output is a vector of shape 3, where each entry is `(row_i · x)` — one dot product per row.
- **Output shape rule**: didn't recall that matrix×vector → vector.
- **Wave intuition for cos/sin**: missing entirely. No "wave that goes 1 → 0 → -1 → 0 → 1 over 0 to 2π."
- **Periodicity / frequency** intuition: not present.
- **Unit circle** view of trig: not mentioned.
- **Fourier transform** as concept (decompose a signal into a sum of waves): blank — name only.
- Self-described: "bad linear algebra! bad!"

**Recap items (these are the heaviest lift in the calibration):**
- **Matrix × vector** as "each row dot-products with the vector." Visual: a 3×4 matrix is 3 rows, each row is a 4-vector; output has 3 entries because we did 3 dot products. *This is load-bearing from Level 2 onward — every attention computation and every MLP layer is matrix×vector.*
- **Dot product** as "alignment between two vectors." Visual.
- **cos(θ)** and **sin(θ)** as **waves** — graph from 0 to 2π, both periodic, both bounded in [−1, 1].
- **Unit circle**: cos = x-coord, sin = y-coord as you walk around.
- **Frequency** as "how fast the wave oscillates."
- **Fourier transform** as "any periodic-ish signal can be written as a sum of sines and cosines at different frequencies."

---

## T5 — Mechinterp sensibility — 2 / 4

**Probes used:**
1. *"What does 'reverse-engineer a neural network' mean to you, in your own words?"*
2. *"Circuit / ablation / activation patching — name recognition / vague vibe / complete blank?"*

**What's solid (and surprisingly so):**
- ✅ **Conceptual sensibility ~3/4 — better than expected.** User produced an excellent operational shape:
  > *"Specific debugging, similarly to using GDB poking specific RAM cells: getting input into the model, analyzing the answers, hypothesizing at which node/neuron(s) in the NN decision points are located, probe hypothesis, check if true, rinse and repeat till places are found. You can also attack those points seeing whether hypothesis is true according to changes in outputs."*
- 💡 The "NN debugger / GDB poking RAM cells" analogy is **exactly right** — TransformerLens is literally marketed as a neural network debugger.
- ✅ The shape — input/output observation → hypothesis about where computation lives → probe → intervention to confirm — *is* mechinterp. The vocabulary is missing, but the activity shape is correct.
- ✅ **Activation patching**: described it almost correctly — "freezing the model with new activations patched." Only error: said "weights" instead of "activations."

**Gaps (vocabulary, not concept):**
- **Circuit** (mechinterp sense): conflated with single node/neuron. Truth: a circuit is a *subgraph* — multiple components (heads, neurons, residual paths) together implementing one computation. Closer to "a small specialized program inside the network" than "a single node."
- **Ablation**: complete blank. Didn't know the English word. *"Ablate" = remove by surgery (medical roots). In mechinterp: zero out a component and watch output change.*
- **Activation patching**: vague-vibe close to correct. **Critical correction**: activations, not weights. Activations are intermediate values during a forward pass; weights are learned parameters.

**Recap items (vocabulary primer, JIT in Level 6):**
- "Circuit" = a subgraph, a tiny program built from a few attention heads + neurons + residual paths.
- "Ablation" = surgical removal — zero out a component, see what breaks.
- "Activation patching" = paste intermediate values from one forward pass into another, see if the output flips. The cleanest causal probe.
- "Residual stream" (already on the user's missing-list) = the running scratchpad vector that flows through every layer; components read from it and write to it.

**Implication:** Level 6 (Fourier Wing) doesn't need a heavy conceptual ramp — just a vocabulary onboarding. The user already has the *posture* of a mechinterp investigator.

---

## Cross-cutting observations (final)

1. **Pattern across all tiers:** AWS ML Spec → terminology exposure without operational understanding. The calibration confirms this exactly. Game's job is precisely to convert exposure → operational mastery via embodied interaction.

2. **The single biggest gap is T4** (math). Matrix×vector and wave-intuition for sin/cos are **load-bearing for the entire game** (matrix×vector from Level 2; waves for Level 6). Without these, the rest of the explainers won't land.

3. **T2 gaps cluster** around Grokking Bell (Level 5): learning rate effects, optimizers, weight decay. All can be handled inside that room as primer scenes.

4. **T3 gaps split**: input-side intuition strong, output-side terminology blank. The output-side gaps cluster at Unembedding Tower (Level 4).

5. **T1 gaps are minor** and can be folded into Level 0 / first-room primer.

6. **T5 surprise (final addition):** Conceptual sensibility for mechinterp is *much stronger than expected*. The user's "NN debugger / GDB poking RAM cells" analogy lands the operational shape of mechinterp without effort. Vocabulary is the only gap. Level 6 can therefore be **vocabulary-onboarding-light** rather than concept-heavy. The mechinterp posture is already there.

7. **Conceptual vs vocabulary asymmetry across the whole calibration:**
   - Strong intuitions, weak vocabulary: T1 (layer math), T3 (embeddings), T5 (mechinterp).
   - Both intuition and vocabulary thin: T2 (training mechanics), T4 (math).
   - This asymmetry shapes the on-ramp: where intuition is strong, primers are short (just "here's the name for what you already know"). Where both are thin, primers must teach actual concepts.

---

## Final recommendation

**Two-pronged scaffolding:**

### Recommendation A: Add a **Level 0 — Math Antechamber** *before* Embedding Garden.

Standalone short room (~10–15 min play) covering ONLY linalg + trig primitives that the game can't function without. Specifically:
1. **Vectors as arrows / lists of numbers.**
2. **Matrix × vector** with one interactive: drag a vector, watch each row dot-product produce one output entry. (This unlocks Level 2 onward.)
3. **Dot product geometric meaning.**
4. **cos and sin as waves** with one interactive: rotate a point around a unit circle, watch its x-coordinate trace `cos`, its y-coordinate trace `sin`. (This unlocks Level 6.)

No DNN content here — pure math. Why standalone: linalg + waves are foundational across multiple later rooms; teaching them in-context inside (say) Embedding Garden would distract from that room's pedagogy. *This is the single highest-leverage change to the slate based on calibration.*

### Recommendation B: Per-room **just-in-time primer scenes** for everything else.

Short prepended scenes (~2–3 min) at each room covering the prereqs that room needs:
- **Embedding Garden primer:** embedding-as-lookup-table, what a vocabulary is.
- **Attention Hall primer:** dot product as "how aligned are these vectors."
- **MLP Forge primer:** ReLU role, why non-linearity, bias purpose.
- **Unembedding Tower primer:** logits → softmax → probabilities; cross-entropy loss visualized.
- **Grokking Bell primer:** optimizer = "recipe for using gradients"; SGD vs Adam(W) at vibes; learning rate effects (corrected); weight decay = "shrink weights toward zero each step"; *why weight decay matters for grokking*.
- **Fourier Wing primer:** Fourier as "any wave is a sum of sines and cosines"; frequency = oscillation speed; the 5 key frequencies will be revealed as colors / motifs.

### Updated slate (preliminary, post-calibration)

| # | Room | Notes |
|---|---|---|
| **0** | 🧮 **Math Antechamber** *(NEW from calibration)* | linalg + waves only |
| 1 | 🌱 Embedding Garden | + JIT primer |
| 1.5 | 🕯 Hall of Memory | thin, unchanged |
| 2 | 👁 Attention Hall | + JIT primer |
| 3 | 🔥 MLP Forge | + JIT primer |
| 4 | 🗼 Unembedding Tower | + JIT primer |
| 5 | 🔔 Grokking Bell | + JIT primer (heaviest — covers all of T2's gaps) |
| 6 | 🌀 Fourier Wing | + JIT primer (waves recap from Antechamber + Fourier intro) |

**Cost of recommendation:** ~+1 week of solo build time for the Math Antechamber, and primer scenes add ~2–3 days total across all rooms (most are short text + one interactive). Total: ~+1.5 weeks on the original 5-week MVP estimate → **MVP becomes ~6.5 weeks of focused work**.

**Alternative if scope is tight:** skip the Math Antechamber, fold its content into Embedding Garden's primer (matrix×vector before vectors do anything) and Fourier Wing's primer (waves before Fourier). Cost saved: ~1 week. Risk: those two rooms each become double-duty, and the math content gets less time/space than it deserves.

**Level 6 adjustment after T5:** Fourier Wing's primer becomes lighter than originally feared. The user already has mechinterp posture — Level 6 only needs to **introduce vocabulary** ("now we call this thing a circuit; this surgical-removal experiment is called ablation; this paste-this-here move is activation patching") layered on top of activities the user can intuit from the GDB-debugger analogy. Conceptual scaffolding for "what *is* mechinterp doing" is *not* needed — the user has it.

---

## TODO

- [x] Run T5 probe → fill in T5 section.
- [x] Finalize "Preliminary recommendation" → "Final recommendation" once T5 is closed.
- [x] Commit to git.
- [ ] Use as input to Step C (acceptance criteria) and `/to-prd`.

---

*Generated via /grill-me knowledge-calibration round on 2026-05-02; T5 closed and recommendation finalized 2026-05-03.*
