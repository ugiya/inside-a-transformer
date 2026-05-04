"""FastAPI surface translating HTTP to module calls."""
from __future__ import annotations
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .checkpoint_registry import CheckpointRegistry, CheckpointNotFoundError
from .model_loader import ModelLoader
from .forward_executor import ForwardExecutor

DEFAULT_CKPT_DIR = Path(__file__).parent.parent / "checkpoints"
DEFAULT_STEP = 39999


class ForwardRequest(BaseModel):
    tokens: list[int]
    cache_keys: list[str] = []


class ForwardResponse(BaseModel):
    logits: list[float]
    cached: dict[str, list]


class StepsResponse(BaseModel):
    steps: list[int]


class CheckpointSwitchResponse(BaseModel):
    ok: bool
    step: int


def create_app(ckpt_dir: Path = DEFAULT_CKPT_DIR, step: int = DEFAULT_STEP) -> FastAPI:
    app = FastAPI(title="Transformer Rooms API")
    registry = CheckpointRegistry(ckpt_dir)
    loader = ModelLoader(registry, device="cpu")

    # The executor's underlying model is mutable via /checkpoint/{step}.
    # We hold a single ForwardExecutor whose _model attribute we swap.
    executor = ForwardExecutor(loader.load(step))

    @app.post("/forward", response_model=ForwardResponse)
    def forward(req: ForwardRequest) -> ForwardResponse:
        result = executor.forward(req.tokens, req.cache_keys)
        return ForwardResponse(logits=result.logits, cached=result.cached)

    @app.get("/steps", response_model=StepsResponse)
    def steps() -> StepsResponse:
        return StepsResponse(steps=registry.available_steps())

    @app.get("/checkpoint/{step}", response_model=CheckpointSwitchResponse)
    def checkpoint(step: int) -> CheckpointSwitchResponse:
        try:
            new_model = loader.load(step)
        except CheckpointNotFoundError:
            raise HTTPException(
                status_code=404,
                detail=f"No checkpoint at step {step}",
            )
        # Swap weights on the live executor.
        executor._model = new_model  # noqa: SLF001 — intentional, single-process state.
        return CheckpointSwitchResponse(ok=True, step=step)

    return app


app = create_app()
