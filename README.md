# Transformer Rooms

A 2D point-and-click interactive lab game that teaches transformer architecture and mechanistic interpretability through six painted rooms — culminating in re-deriving Nanda et al.'s "Progress measures for grokking via mechanistic interpretability."

**Status:** pre-PRD. Design locked via the design grill on 2026-05-02. PRD pending via the PRD generation step.

## Premise

You arrive in a glass conservatory at dawn. There are 113 small empty vessels arranged in a ring. By the end of the game, you will have built a transformer, watched it grok, and re-discovered the Fourier circuits hidden in the walls of every room you walked through.

## Locked design (eight decisions from the grill)

1. **Arc:** hybrid, build-leaning — construct each component, then briefly observe what it does on the running model. No mechinterp until Level 6.
2. **World:** one task, one world — modular addition `(a + b) mod p` with `p=113`, Nanda's exact config.
3. **Platform:** local web — frontend + Python backend, audience = single user (you), no public deployment in v1.
4. **Level unit:** spatial rooms that are also build-then-probe labs.
5. **Slate (7 rooms):**
   1. 🌱 Embedding Garden
   1.5. 🕯 Hall of Memory *(RNN/LSTM prologue, thin scene)*
   2. 👁 Attention Hall
   3. 🔥 MLP Forge
   4. 🗼 Unembedding Tower *(thin scene in v1)*
   5. 🔔 Grokking Bell *(replay in v1, live training in v2)*
   6. 🌀 Fourier Wing *(mechinterp finale)*
6. **Visual language:** clockpunk core + sacred-geometry tilework wallpaper + ink-and-color-wash medium. Recurring motifs (number ring, nested wheels, light beams, tilework) are planted early and retroactively become Fourier circuits in Level 6.
7. **Stack:** SvelteKit (Svelte 5) + TypeScript + SVG/Framer-equivalent (svelte/transition + Motion One) + Canvas-where-needed | FastAPI + PyTorch + TransformerLens (`HookedTransformer`) | REST + 1 WebSocket (stretch) | static-served generated art with pinned style prefix | localStorage state.
8. **Scope:** see `MVP / Stretch / Out-of-scope` below.

## Model spec (locked, exact Nanda config)

- 1-layer transformer (attention-only ok, MLP version preferred for the MLP Forge room).
- `d_model=128`, `n_heads=4`, `d_head=32`, `d_mlp=512`, `vocab=p+1=114`.
- ReLU MLP. Train fraction: 30%.
- Reaching grokking on this config reproduces Nanda et al. "Progress measures for grokking via mechanistic interpretability."

## Genre

Not a platformer. Closest references:
- **Machinarium** (point-and-click adventure, painted scenes, no avatar).
- **The Witness** (puzzles ARE the learning).
- **Bret Victor / Distill.pub** (manipulable mathematics).

Cursor-only. No keyboard. No twitch. ~10–15 minutes per room.

## Visual style prefix (use for all `/art` generations)

> *painted ink and color wash illustration, deep teal and warm brass palette with ivory off-white, slightly hand-drawn imperfection, slightly elevated 3/4 view of an architectural interior, no text, no logos, painterly brushwork*

## MVP / Stretch / Out-of-scope

### MVP (v1 ships with)
- All 7 rooms exist as scenes.
- 5 rooms fully interactive: Embedding Garden, Attention Hall, MLP Forge, Grokking Bell, Fourier Wing.
- 2 rooms thin: Hall of Memory (prologue, click-through), Unembedding Tower (one slider, 2-min scene).
- Trained model + multiple checkpoints shipped.
- Backend: `/forward`, `/probe`, `/checkpoint/{step}`. No WebSocket in v1.
- Discovery challenges accept-on-attempt, not gated by correctness.
- Training replayed (3 pre-recorded trajectories), not live.
- Audio: ambient room loops. No voiced narration.
- Save state: localStorage.
- Desktop, mouse-only, modern browsers.

### Stretch (priority order)
1. Live training in Grokking Bell with hyperparameter knobs (WebSocket).
2. Hall of Memory becomes interactive (drag a memory packet along the chain).
3. Unembedding Tower as a full room.
4. Voiced narration (ElevenLabs).
5. Multi-layer model option (induction heads, copying tasks).
6. Replay sharing (export trajectory as URL).
7. Mobile/touch.

### Out-of-scope (by design)
- Multiplayer / social.
- Score / leaderboards / XP.
- Procedural levels.
- A second task or world.
- 3D rendering.
- Native apps.
- Runtime AI generation.
- Monetization.

## Repo layout (planned)

```
transformer-rooms/
├── README.md
├── .gitignore
├── PRD.md                  # to be filled by the PRD generation step
├── frontend/               # SvelteKit + TS
│   ├── src/routes/         # one route per room
│   ├── src/lib/            # SVG components, motion utils, API client
│   └── static/art/         # /art outputs by room
└── backend/                # FastAPI + PyTorch + TransformerLens
    ├── main.py             # endpoints
    ├── model.py            # HookedTransformer config
    ├── train.py            # offline training + checkpoint dump
    └── checkpoints/        # gitignored; downloaded or regenerated
```

## License

TBD.
