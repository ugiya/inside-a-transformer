# research.md

Cached research from phase 2 of Matt Pocock's AI-driven development workflow. Verified against live sources on 2026-05-02. This file is the canonical reference for any decision that depends on (a) Nanda's grokking paper, (b) the TransformerLens API, (c) Svelte 5 / SvelteKit 2 / Motion One, or (d) reference works for visual / pedagogical inspiration.

When this file disagrees with my training-data memory, this file is right.

---

## 1. Nanda et al. — "Progress Measures for Grokking via Mechanistic Interpretability" (ICLR 2023)

Sources fetched:
- arXiv: <https://arxiv.org/abs/2301.05217>, <https://arxiv.org/html/2301.05217>
- Companion site: <https://www.neelnanda.io/grokking-paper>
- Walkthrough: <https://www.neelnanda.io/mechanistic-interpretability/modular-addition-walkthrough>
- Reference impl: <https://github.com/mechanistic-interpretability-grokking/progress-measures-paper>
- TransformerLens grokking demo: <https://transformerlensorg.github.io/TransformerLens/content/tutorials.html>

### 1.1 Exact training config

| Parameter | Value |
|---|---|
| Task | `(a + b) mod p` |
| Prime `p` | **113** |
| `n_layers` | **1** |
| Components | **Attention + MLP (ReLU)** — *not* attention-only |
| `n_heads` | **4** |
| `d_model` | **128** |
| `d_head` | **32** |
| `d_mlp` | **512** |
| LayerNorm | **None** |
| `d_vocab` | **114** (113 numbers + `=` token) |
| `n_ctx` | **3** (`a`, `b`, `=`) |
| Positional encoding | **Learned** |
| Optimizer | **AdamW** |
| Learning rate | **1e-3** |
| Weight decay | **1.0** |
| Batch | **Full-batch GD** |
| Train fraction | **30%** of all `(a, b)` pairs |
| Total epochs | **40,000** |

### 1.2 Phases (and when grokking happens)

- **Memorization**: epochs ~0–1,400 (train acc ~100%, test acc ~0).
- **Circuit formation**: epochs ~1,400–9,400.
- **Cleanup / grokking**: epochs ~9,400–14,000 — test accuracy rises to ~100%.

> "After around 10,000 epochs, the network generalizes and test accuracy increases to near 100%." — paper.

### 1.3 The Fourier circuit

The trained model embeds tokens onto rotations in R² and uses trig identities to compute `a + b mod p`.

- **Key frequencies** for p=113: **`k ∈ {14, 35, 41, 42, 52}`** with `wₖ = 2kπ/p`.
- **Implemented identity**: `cos(wₖ(a+b−c)) = cos(wₖ(a+b))cos(wₖc) + sin(wₖ(a+b))sin(wₖc)` — the logit for candidate `c` peaks when `c ≡ a+b (mod p)`.
- The MLP computes `cos(wₖ(a+b))` and `sin(wₖ(a+b))` from `a`'s and `b`'s embeddings.
- The unembedding does the inner product with `cos(wₖc), sin(wₖc)` to score each `c`.

### 1.4 Progress measures

- **Restricted loss**: zero out all logit components except the constant + the 20 terms `cos(wₖ(a+b)), sin(wₖ(a+b))` for the 5 key frequencies. Compute loss. Decreases throughout training even before test accuracy moves — *evidence the Fourier circuit is forming during memorization*.
- **Excluded loss**: zero out *only* the key-frequency components, evaluate on **training** data. Rises during cleanup as memorization is removed — *evidence memorization is being unlearned*.

### 1.5 Implications for the game

- **Level 6 (Fourier Wing) targets a known answer.** Re-deriving "5 key frequencies + trig identity" is the explicit goal.
- **Level 5 (Grokking Bell) replay must run for ~14k epochs.** Pre-record at epoch resolution; player scrubs.
- **5 key frequencies = 5 distinct visual motifs.** Plant exactly five recurring wallpaper / wheel / beam patterns across rooms 1–4, each at one of the canonical frequencies. The Fourier reveal shows them resolving into the model's actual learned frequencies.
- **README amendment**: spec was ambiguous about "attention-only ok"; the canonical config is **attention + MLP**. Lock the MLP version.

---

## 2. TransformerLens — current API (v3.1.0, Apr 30 2026)

Sources fetched:
- PyPI: <https://pypi.org/project/transformer-lens/>
- Docs: <https://transformerlensorg.github.io/TransformerLens/>
- API: <https://transformerlensorg.github.io/TransformerLens/generated/code/transformer_lens.HookedTransformerConfig.html>
- Source: <https://github.com/TransformerLensOrg/TransformerLens/blob/main/transformer_lens/HookedTransformer.py>
- Quick ref: <https://www.boristhebrave.com/2025/03/29/transformerlens-quick-reference/>

### 2.1 Custom 1-layer config (verbatim, drop-in for backend)

```python
from transformer_lens import HookedTransformer, HookedTransformerConfig

cfg = HookedTransformerConfig(
    n_layers=1,
    d_model=128,
    d_head=32,
    n_heads=4,
    d_mlp=512,
    d_vocab=114,
    n_ctx=3,
    act_fn="relu",
    normalization_type=None,
    attn_only=False,
    seed=0,
)
model = HookedTransformer(cfg)
```

### 2.2 `run_with_cache`

```python
logits, cache = model.run_with_cache(tokens)
q              = cache["blocks.0.attn.hook_q"]         # [batch, pos, head, d_head]
attn_pattern   = cache["blocks.0.attn.hook_pattern"]   # [batch, head, pos_q, pos_k]
mlp_post       = cache["blocks.0.mlp.hook_post"]       # [batch, pos, d_mlp]
resid_post     = cache["blocks.0.hook_resid_post"]     # [batch, pos, d_model]
```

### 2.3 `run_with_hooks` — ablation / patching

```python
def head_ablation_hook(value, hook):
    value[:, :, head_idx, :] = 0.0
    return value

logits = model.run_with_hooks(
    tokens,
    fwd_hooks=[("blocks.0.attn.hook_v", head_ablation_hook)],
)
```

For residual-stream patching, hook `blocks.0.hook_resid_pre` / `_mid` / `_post` and overwrite the position you want to patch with a clean activation.

### 2.4 Hook naming convention (verified)

Per-block (block index `i`):
- `blocks.{i}.hook_resid_pre`, `_mid`, `_post`
- `blocks.{i}.attn.hook_q`, `_k`, `_v`, `_z`, `_pattern`, `_attn_scores`
- `blocks.{i}.hook_attn_out`, `blocks.{i}.hook_mlp_out`
- `blocks.{i}.mlp.hook_pre`, `_post`

Top-level: `hook_embed`, `hook_pos_embed`, `ln_final.hook_normalized` (only with normalization).

Construct names safely with `transformer_lens.utils.get_act_name(name, layer)`.

### 2.5 Loading externally-trained weights (our pipeline)

We train in plain PyTorch (transparent code; small enough to write by hand), then probe with TransformerLens. The supported path:

```python
model = HookedTransformer(cfg)
model.load_and_process_state_dict(
    state_dict,
    fold_ln=False,
    center_writing_weights=False,
    center_unembed=False,
    fold_value_biases=False,
)
```

State-dict keys must match TL conventions: `embed.W_E`, `pos_embed.W_pos`, `blocks.0.attn.W_Q`, `W_K`, `W_V`, `W_O`, `blocks.0.mlp.W_in`, `W_out`, `unembed.W_U`. Either name our PyTorch params identically or write a small remap function.

### 2.6 Gotchas

- v3.0+ steers HuggingFace models to `TransformerBridge`, but `HookedTransformer` is still the path for **custom** configs (us).
- v2.0 removed `HookedSAETransformer`; SAE features moved to **SAELens**.
- All `fold_*` and `center_*` defaults assume LayerNorm — set them all to `False` for our LN-less model (above).
- Python ≥3.10 required on v3.x.

---

## 3. Svelte 5 + SvelteKit 2 (v5.55.5 / v2.59.0, May 2026)

Sources fetched:
- <https://svelte.dev/docs/svelte/overview>, [`$state`](https://svelte.dev/docs/svelte/$state), [`$derived`](https://svelte.dev/docs/svelte/$derived), [`$effect`](https://svelte.dev/docs/svelte/$effect), [`$props`](https://svelte.dev/docs/svelte/$props), [v5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide)
- <https://svelte.dev/docs/kit/routing>, <https://svelte.dev/docs/kit/load>, <https://svelte.dev/docs/kit/page-options>
- <https://svelte.dev/blog/view-transitions>
- <https://svelte.dev/docs/svelte/svelte-motion>

### 3.1 Runes quick reference

```js
let count       = $state(0);                                  // deeply reactive (Proxy)
let snapshot    = $state.raw({ big: data });                  // not deep-reactive; reassign whole value
let doubled     = $derived(count * 2);                        // computed
let total       = $derived.by(() => arr.reduce((a,b)=>a+b,0)); // multi-statement derived
$effect(() => { /* DOM read/write, cleanup via return */ });
$effect.pre(() => { /* before DOM updates, e.g. autoscroll */ });
let { label = 'OK', ...rest } = $props();                     // props with defaults
let { value = $bindable(0) } = $props();                      // two-way bindable
$inspect(count);                                              // dev-only logger
```

### 3.2 Idiomatic component (slider → SVG)

```svelte
<script lang="ts">
  let radius = $state(40);
  let circumference = $derived(2 * Math.PI * radius);
</script>

<input type="range" min="10" max="100" bind:value={radius} />
<svg width="220" height="220" viewBox="0 0 220 220">
  <circle cx="110" cy="110" r={radius} fill="none"
          stroke="hotpink" stroke-width="4"
          stroke-dasharray={circumference}
          style="transition: r 200ms ease, stroke-dasharray 200ms ease;" />
</svg>
```

### 3.3 Mental model vs Svelte 4

Svelte 4 had two reactivity systems (top-level `let` + `$:`, plus stores). Svelte 5 unifies both — `$state` works the same inside or outside components, replacing both stores and `$:`. Reactivity is explicit (you opt in with a rune), Proxy-backed for deep tracking, and lazy: deriveds recompute only when dependencies change *and* are read.

### 3.4 Anti-patterns

- Syncing state in `$effect` (`$effect(() => { doubled = count * 2 })`) → use `$derived`.
- Side-effects inside `$derived(...)` (forbidden — must be pure).
- Mutating `$state.raw` values (no-op; reassign whole object).
- Reaching for stores by reflex in Svelte 5 — instead, export `$state` from a `.svelte.ts` module.

### 3.5 Routing — one route per room

```
src/routes/
├── +layout.svelte
├── +page.svelte                      # /  (lobby / main menu)
├── embedding-garden/+page.svelte     # /embedding-garden
├── hall-of-memory/+page.svelte
├── attention-hall/+page.svelte
├── mlp-forge/+page.svelte
├── unembedding-tower/+page.svelte
├── grokking-bell/+page.svelte
└── fourier-wing/+page.svelte
```

### 3.6 Load functions

- `+page.ts` (universal) — runs on server then client; can return non-serializable; use for public APIs via injected `fetch`. **This is what we want for room data.**
- `+page.server.ts` (server-only) — DB calls, secrets. Not needed for v1.

### 3.7 FastAPI dev proxy

`vite.config.ts`:
```ts
export default defineConfig({
  plugins: [sveltekit()],
  server: { proxy: { '/api': 'http://localhost:8000' } }
});
```

Then `fetch('/api/forward', ...)` in `+page.ts` — no CORS dance.

### 3.8 Page transitions

Use the **View Transitions API via `onNavigate`** in `+layout.svelte` (modern, Chromium-default; degrade gracefully):

```ts
import { onNavigate } from '$app/navigation';
onNavigate((nav) => {
  if (!document.startViewTransition) return;
  return new Promise((resolve) => {
    document.startViewTransition(async () => { resolve(); await nav.complete; });
  });
});
```

Universal fallback: `{#key url}` + `svelte/transition` (`fade`, `fly`).

### 3.9 Static assets

- `static/` — served as-is at `/`. For `favicon`, OG images, large untouched files.
- `src/lib/assets/` — Vite-processed (hashed, optimized). Preferred for room art so Vite can fingerprint.

### 3.10 Decisions ratified

- **SvelteKit 2 + Svelte 5 with runes is current, stable, viable.** Lock it.
- **Use `$lib/assets/art/<room>/<scene>.webp` for /art outputs**, not `static/`.
- **View Transitions API is the room-to-room transition.** Free architectural-feel morph between scenes; falls back to instant nav on Firefox without breaking anything.

---

## 4. Animation strategy — Motion One + Svelte built-ins

Sources fetched:
- <https://motion.dev/docs/quick-start>
- <https://www.npmjs.com/package/motion>
- <https://www.npmjs.com/package/@motionone/svelte> (legacy)
- <https://github.com/rootEnginear/svelte-action-motionone>

### 4.1 Package status (important — avoid abandoned binding)

- **`motion`** (npm, v12.37.0): actively maintained, framework-agnostic. **Use this.**
- ~~`@motionone/svelte` (npm, v10.16.4, Sept 2023)~~: unmaintained. **Do not use.**
- No current first-party Svelte binding. Drive Motion from `$effect` with `bind:this` refs.

### 4.2 Driving Motion from runes

```svelte
<script lang="ts">
  import { animate } from 'motion';
  let svg: SVGSVGElement;
  let active = $state(false);

  $effect(() => {
    if (!svg) return;
    animate(svg,
      { scale: active ? 1.2 : 1, rotate: active ? 15 : 0 },
      { type: 'spring', stiffness: 200, damping: 18 });
  });
</script>

<svg bind:this={svg} on:click={() => active = !active}>…</svg>
```

Motion can't reactively read `$state`; `$effect` is the bridge.

### 4.3 Rule of thumb (when to reach for which)

| Need | Tool |
|---|---|
| Room enter/leave fade or fly | `svelte/transition` (`fade`, `fly`, `slide`, `crossfade`) |
| State-driven SVG attribute (slider → cx/r/opacity) | `Tween` / `Spring` from `svelte/motion` |
| Orchestrated multi-element timeline (lab intro choreography, Fourier Wing reveal) | `motion` (`animate` + `at:`, `stagger`, `inView`) |
| Scrubable training trajectory (Grokking Bell) | custom: drive `$state` from a rAF loop, let `Tween` smooth values |

### 4.4 Decisions ratified

- **Install `motion`, not `@motionone/svelte`**. Update `package.json` accordingly.
- **Default to built-ins** (`svelte/transition`, `Tween`, `Spring`); reach for Motion only for orchestrated reveals (notably Level 6's Fourier Wing).

---

## 5. Reference works — the study list

Top 5 in priority order (study before writing code):

1. **bbycroft.net/llm** — <https://bbycroft.net/llm>
   The closest existing thing to our game. 3D nano-GPT walkthrough; tensors are literal boxes; camera flies through layers. Steal: spatializing data flow, layers-as-floors, residual-stream-as-river.

2. **Bret Victor — Up and Down the Ladder of Abstraction** — <https://worrydream.com/LadderOfAbstraction/>
   The thesis our entire navigation depends on: fluent vertical movement between concrete tokens → activations → circuits. Steal: the "drop down to a single moment, climb up to a parameter sweep" pattern; this is the staircase from "this attention head" to "induction circuit."

3. **The Witness** — Jonathan Blow's didactic philosophy.
   Zero text. Each level teaches one rule via puzzles whose solution *is* the realization of the rule. Steal: "modeling epiphany" — never tutorialize what the player can discover.

4. **Gorogoa** — Jason Roberts.
   Four panels you slide, zoom, and overlay so drawings in different cells become parts of one larger drawing. Steal: panel-as-manipulable-truth — directly applicable to circuit decomposition (4 panels = 4 component views; player composes them to see the whole circuit).

5. **Distill — Building Blocks of Interpretability + Activation Atlas** — <https://distill.pub/2018/building-blocks/>, <https://distill.pub/2019/activation-atlas/>
   Hover-to-attribute, click-to-drill, semantic dictionaries pairing feature visualizations with magnitudes, zoom-dependent detail. Steal: progressive disclosure via zoom for the "circuit → head → neuron" view in the Fourier Wing.

### 5.1 Other references worth a single visit

- **Polo Club Transformer Explainer** (<https://poloclub.github.io/transformer-explainer/>) — live GPT-2 in browser; copy "every parameter the player touches has a visible consequence on a real artifact."
- **Jay Alammar — Illustrated Transformer** (<https://jalammar.github.io/illustrated-transformer/>) — order of reveal: black box → encoder/decoder → tensors → attention → multi-head.
- **3Blue1Brown — Attention** (<https://www.3blue1brown.com/lessons/attention>) — bind one math operation to one persistent visual primitive.
- **Distill — Momentum** (<https://distill.pub/2017/momentum/>) — equation-as-UI; drag a learning rate, watch descent change. Useful for the Grokking Bell.
- **Nicky Case — Evolution of Trust / Polygons** — <https://ncase.me/trust/>, <https://ncase.me/polygons/> — pacing template: lesson → playground → stinger. Steal wholesale for ~10–15 min rooms.
- **Amanita Design — Machinarium / Samorost / Botanicula** (<https://amanita-design.net/games.html>) — wordless hover-discovery, ambient soundscapes, no HUD.
- **Baba Is You** — rules-as-objects; "ATTENTION IS COPY" tiles you can rearrange to reconfigure a head's behavior. *Possible Level 6 mechanic worth prototyping.*
- **Patrick's Parabox** — recursive nesting; analog for token → attention pattern → head → layer navigation.

### 5.2 Existing pedagogy to differentiate from

- **ARENA** (<https://www.arena.education/curriculum>, <https://github.com/callummcdougall/ARENA_3.0>) — Jupyter curriculum; assumes PyTorch fluency + 30+ hrs/wk. **Our game is the on-ramp that makes someone *want* to do ARENA.**
- **Karpathy "Let's build GPT" / nanoGPT** (<https://www.youtube.com/watch?v=kCc8FmEb1nY>) — teaches *building*; ours teaches *seeing*. Our differentiator is the interpretability lens.
- **Anthropic Transformer Circuits Thread** (<https://transformer-circuits.pub>) — canonical content with no canonical interactive companion. **Be the explorable explanation the Thread never produced.**
- **Neuronpedia / Gemma Scope** — microscope, not textbook. Ours produces the eyes that make Neuronpedia legible.
- **BertViz / AttentionViz** — research tools, not curricula. We add narrative arc and puzzle-as-comprehension.

---

## 6. Decisions ratified after research

What survives, what changes, what's new.

### Survives unchanged
- Hybrid arc (build then probe), one task = modular addition, p=113.
- Six rooms + Hall of Memory prologue.
- 2D point-and-click, no avatar, mouse-only, ~10–15 min/room.
- Visual language: clockpunk core + sacred-geometry tilework + ink-and-color-wash medium.
- SvelteKit 2 + Svelte 5, FastAPI + PyTorch + TransformerLens.

### Changes / sharper specs
- **Model is 1-layer attention + MLP** (not attention-only — paper uses MLP, the canonical Fourier circuit lives there). README amended.
- **`d_vocab = 114`**, **`n_ctx = 3`** — lock these.
- **Training: AdamW, lr=1e-3, wd=1.0, full-batch, 40k epochs.** Lock these.
- **Five key frequencies → five recurring visual motifs** planted across rooms 1–4. The Fourier Wing reveals each motif's frequency. *Art-direction constraint:* every recurring shape should be drawable at one of the canonical wₖ for k ∈ {14, 35, 41, 42, 52}. (That's a real constraint, not a flourish.)
- **Animation lib: `motion`, NOT `@motionone/svelte`.** Update package list.
- **Asset path: `$lib/assets/art/<room>/<scene>.webp`** (not `static/`).
- **Room transitions: View Transitions API in `+layout.svelte`** with svelte/transition fallback.
- **Backend pipeline: train in plain PyTorch (transparent code), load into TransformerLens for probing via `load_and_process_state_dict(fold_ln=False, ...)`.**

### New (not in the grill)
- **Study list before PRD/code:** bbycroft.net/llm, Ladder of Abstraction, The Witness (writeups), Gorogoa (gameplay videos), Building Blocks of Interpretability. ~2 hours total. Required reading.
- **Possible Baba-Is-You mechanic for Level 6:** rearrangeable rule tiles (e.g., "HEAD-0 IS COPY" → swap to "HEAD-0 IS INDUCTION") that physically reconfigure a circuit. Worth a 1-hour prototype before committing.
- **Acceptance criteria pass needed before `/to-prd`** — the grill defined "discovery challenges" but didn't lock per-room acceptance criteria as PRD/TDD inputs. Defer to Step C.

### Confirmed not blocked
- Nothing in the research reveals a blocker. The plan survives contact with reality.
