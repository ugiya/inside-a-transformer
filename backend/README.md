# Transformer Rooms — backend

FastAPI + PyTorch + TransformerLens. Loads the grokked Nanda checkpoint
(step 39999) and serves forward passes for the frontend rooms.

## Run the dev server

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --port 8000
```

The API listens on `http://localhost:8000`. CORS is permissive in dev for
the SvelteKit dev server on port 5173.

## Smoke test

```bash
curl -s -X POST http://localhost:8000/forward \
  -H 'Content-Type: application/json' \
  -d '{"tokens": [5, 17, 113], "cache_keys": []}' | python3 -m json.tool | head -30
```

The `argmax` over the first 113 logits should be `22` (since `5 + 17 ≡ 22 mod 113`)
because the loaded checkpoint has grokked.

## Run the tests

```bash
uv run pytest
```

12 tests, < 2 seconds. The tracer test loads `step_39999.pt` and asserts
end-to-end correctness against the grokked model.

## Modules

- `transformer_rooms/checkpoint_registry.py` — step → file resolution
- `transformer_rooms/model_loader.py` — `HookedTransformer` at the locked Nanda config
- `transformer_rooms/forward_executor.py` — forward pass + cache extraction
- `transformer_rooms/api.py` — FastAPI surface

## Locked model spec (verified in `research.md` §1)

1-layer attn+MLP, `d_model=128`, `n_heads=4`, `d_head=32`, `d_mlp=512`,
`d_vocab=114` (113 numbers + `=`), `n_ctx=3`, no LayerNorm, learned
positional encoding. Trained with AdamW (lr=1e-3, wd=1.0, full-batch,
40k epochs, train-frac 30%).
