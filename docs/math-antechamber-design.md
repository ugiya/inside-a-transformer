# Math Antechamber — interaction design (Slice #3)

**Status:** approved by Uri 2026-05-04. Closes Slice #3 (HITL). Drives Slice #9 implementation.

## Why this room exists

Phase 2.5 calibration showed T4 (math: linear algebra + Fourier) was the largest knowledge gap (1/4 comfort). The Fourier Wing finale (Slice #17) is unreachable without grounded intuitions for: vectors, matrix×vector as a stack of dot products, dot products as alignment, and sin/cos as projections of a unit-circle rotation.

The Antechamber teaches these by manipulation. It is the player's first room (Level 0) and is skippable for experienced players.

## Sequence (locked)

```
P1 Vector → P3 Dot product → P2 Matrix × vector → P4 Sin/cos waves → P5 Unit circle
```

Geometric flow: each primitive uses the prior one's vocabulary. P3 before P2 because matrix×vector is built from per-row dot products — teaching P3 first makes P2 land as composition rather than novelty.

P4 and P5 are **two separate scenes** (split, not fused), giving sin/cos waves their own embodied moment before the unit-circle scene re-anchors them geometrically. The Fourier Wing's payoff hinges on this — Uri opted for depth here.

## Skip policy

Skip-button surfaces in **both** the lobby card and inside each Antechamber scene. Persists via `gameState.mathAntechamberSkipped: boolean` (slot already defined in Slice #5's GameState store). Skipping advances the player past the entire Antechamber to the next room (Embedding Garden).

## Primitives

### P1 — Vector (drag-the-tip)

Layout:
```
┌─────────────────────────────────────────────┐
│   2D plane with origin (0,0) marked.        │
│                                             │
│   ●  draggable arrow head                   │
│   │                                          │
│   │                                          │
│   ╱                                          │
│  origin ●                                    │
│                                             │
│   x = 3.4    y = -1.7    |v| = 3.80         │
└─────────────────────────────────────────────┘
```

- One arrow rooted at origin; player drags the head with the cursor.
- Live readouts: components `(x, y)` and magnitude `|v|`.
- Snap-to-grid optional (toggle button).
- Animation: arrow follows cursor with no inertia; instant feedback.

Acceptance for Slice #9:
- Drag updates components live.
- Touch input falls back gracefully (click → key arrows OR pointer down).
- Component values are floats with one decimal.

### P3 — Dot product (two-arrow alignment)

Layout:
```
┌─────────────────────────────────────────────┐
│   Two draggable arrows from a shared origin │
│                                             │
│        a ●                                   │
│         ╲     b ●                            │
│          ╲   ╱                               │
│           ╲ ╱                                │
│         origin                              │
│                                             │
│   a · b = 4.2     θ = 67°                   │
│   sign:  positive (aligned)                 │
└─────────────────────────────────────────────┘
```

- Two arrows; either is draggable.
- Live readouts: `a · b` (number, color-coded: red ≤ 0, neutral 0, brass > 0), and the angle `θ` between them.
- A small text caption below the number changes with the sign:
  - `a · b > 0`: "aligned"
  - `a · b = 0`: "perpendicular"
  - `a · b < 0`: "opposed"
- The number animates as the angle changes; reaching `cos(90°) = 0` is a snap-target the player can feel.

Acceptance for Slice #9:
- Both arrows independently draggable.
- Sign caption updates within 100ms of the dot product crossing zero.

### P2 — Matrix × vector (two-stage drag)

Layout:
```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│   Matrix A (3×4):           Vector x:        Output y = A·x:       │
│   ┌──────┬──────┬──────┬──────┐    ┌──────┐      ┌──────┐         │
│   │  2   │ -1   │  0.5 │  3   │    │  1   │      │  6.5 │ ← row 1 │
│   ├──────┼──────┼──────┼──────┤    ├──────┤      ├──────┤   · x   │
│   │  0   │  4   │ -2   │  1   │    │  2   │      │  6.5 │         │
│   ├──────┼──────┼──────┼──────┤    ├──────┤      ├──────┤         │
│   │  1   │  1   │  1   │  1   │    │  3   │      │ 10.0 │         │
│   └──────┴──────┴──────┴──────┘    └──────┘      └──────┘         │
│      ↑ row 1 highlighted                                          │
│                                                                    │
│   y₁ = 2·1 + (−1)·2 + 0.5·3 + 3·3 = 6.5                           │
│         row 1 of A    ·    x                                       │
└────────────────────────────────────────────────────────────────────┘
```

- Matrix `A` of shape `3×4` (the calibration recap config). Cells display value; cells are not editable in v1 (keep scope tight) — they're pre-set to interesting values.
- Vector `x ∈ ℝ⁴`: each entry is a draggable slider/number-input.
- Output `y ∈ ℝ³`: read-only, updates live as `x` changes.
- Discovery interaction: hovering a row of `A` highlights it AND highlights its corresponding `y_i` AND animates a row-by-row scan that recomputes the dot product (visible math expression scrolls under the matrix).

Acceptance for Slice #9:
- Dragging any `x_i` updates all of `y` live.
- Hovering row `i` highlights both row `i` and `y_i`.
- The text expression below shows the dot product in expanded form for the hovered row.

### P4 — Sin/cos as waves

Layout:
```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  cos(θ) graph                  sin(θ) graph                        │
│  ┌──────────────────┐          ┌──────────────────┐               │
│  │     ___           │          │           ___    │               │
│  │    /   \           │          │     ___  /   \  │               │
│  │___/     \___       │          │    /   \/     \_│               │
│  │           \_      │          │___/             │               │
│  │             \____ │          │                  │               │
│  └──────────────────┘          └──────────────────┘               │
│  0    π/2   π   3π/2  2π        0    π/2   π   3π/2  2π            │
│                                                                    │
│  θ slider: ◉───────────────  θ = 1.2 rad (≈ 69°)                  │
│  cos(θ) = 0.36  sin(θ) = 0.93                                     │
└────────────────────────────────────────────────────────────────────┘
```

- A single slider for `θ ∈ [0, 2π]`.
- Two graphs: `cos(θ)` and `sin(θ)` over the full range.
- Vertical line at the current `θ` marks the value on each graph.
- Live readouts of `cos(θ)` and `sin(θ)`.
- No unit circle yet — that's P5.

Acceptance for Slice #9:
- Slider sweeping `θ` redraws the marker line live.
- Special-case θ values (`0, π/2, π, 3π/2, 2π`) snap and label.

### P5 — Unit circle (the geometric anchor)

Layout:
```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│      Unit circle                Sin/cos coupling                   │
│   ┌──────────────────┐          ┌──────────────────┐               │
│   │       ●           │          │  cos(θ) ─────────│ ●            │
│   │      ╱│           │          │                  │              │
│   │   r=1│ y          │          │  sin(θ) ─────────│ ●            │
│   │    ╱ │            │          │                  │              │
│   │   ╱θ │            │          └──────────────────┘               │
│   │  ╱___│            │                                            │
│   │  x   1            │                                            │
│   └──────────────────┘                                             │
│   draggable point on circle                                        │
│   θ = 1.2 rad, x = cos(θ), y = sin(θ)                             │
└────────────────────────────────────────────────────────────────────┘
```

- Unit circle on the left. A draggable point on the circle's circumference; dragging it sweeps `θ`.
- Right panel: live values of `cos(θ)` and `sin(θ)`, color-coded.
- A faint shadow drops from the point to the x-axis (showing `cos(θ)` as horizontal projection) and to the y-axis (showing `sin(θ)` as vertical projection).
- One key narrator line: *"Sine and cosine are just where the dot lives, projected onto the axes."*

Acceptance for Slice #9:
- Dragging the point on the circle updates `cos`/`sin` live.
- Projection shadows render and follow the dragged point.
- The narrator line appears once after first interaction.

## Acceptance criteria for the Antechamber as a whole (drives Slice #9 issue body)

- Route `/math-antechamber` exists and is the **first** room reachable from the lobby.
- Skip button in lobby card AND in each Antechamber scene; persists `gameState.mathAntechamberSkipped`.
- Five primitives present, in order P1 → P3 → P2 → P4 → P5.
- Each primitive is interactive (no autoplay-only scenes).
- "Next" button advances to the next primitive; final primitive's "Next" advances to `/embedding-garden`.
- Each primitive uses **JIT primer pattern** (Slice #6) for new vocabulary it introduces (e.g., "vector", "dot product", "matrix").
- Frontend tests: each primitive's external behavior tested (input → expected output coordinate / numeric readout / state mutation).

## Out of scope for Slice #9

- 3D visualizations.
- Animation of the matrix-vector multiply as a flowing process (the row-by-row scan is the maximum extent).
- Editable matrix cells (the `3×4` matrix is fixed in v1).
- Real Fourier transforms — those land in the Fourier Wing finale, not the Antechamber.
- Audio narration.

## Visual style

Per the locked art prefix in `README.md`: deep teal + brass + ivory; ink-and-color-wash medium. Use CSS vars (`var(--teal)`, `var(--brass-bright)`, `var(--ivory)`) — palette already declared globally in `+layout.svelte`.

For the geometric primitives (arrows, axes, circles), use SVG with `stroke="currentColor"` so palette themes apply uniformly. Arrows: 2px stroke, brass color. Origin markers: small ivory dots. Active/hover state: stroke-width up to 3px and color shifts to `--brass-bright`.
