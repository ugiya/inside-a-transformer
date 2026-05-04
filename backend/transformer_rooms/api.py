"""FastAPI surface translating HTTP to module calls."""
from __future__ import annotations
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel

from .checkpoint_registry import CheckpointRegistry
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


def create_app(ckpt_dir: Path = DEFAULT_CKPT_DIR, step: int = DEFAULT_STEP) -> FastAPI:
    app = FastAPI(title="Transformer Rooms API")
    registry = CheckpointRegistry(ckpt_dir)
    loader = ModelLoader(registry, device="cpu")
    executor = ForwardExecutor(loader.load(step))

    @app.post("/forward", response_model=ForwardResponse)
    def forward(req: ForwardRequest) -> ForwardResponse:
        result = executor.forward(req.tokens, req.cache_keys)
        return ForwardResponse(logits=result.logits, cached=result.cached)

    return app


app = create_app()
