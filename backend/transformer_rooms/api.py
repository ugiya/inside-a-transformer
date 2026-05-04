"""FastAPI surface translating HTTP to module calls."""
from __future__ import annotations
from pathlib import Path
from typing import Annotated, Literal, Union

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .checkpoint_registry import CheckpointRegistry, CheckpointNotFoundError
from .model_loader import ModelLoader
from .forward_executor import ForwardExecutor
from .probe_executor import (
    ProbeExecutor,
    AblateHead,
    ZeroNeuron,
    PatchResidual,
    InvalidInterventionError,
)

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


class AblateHeadSpec(BaseModel):
    kind: Literal["ablate_head"]
    head: int


class ZeroNeuronSpec(BaseModel):
    kind: Literal["zero_neuron"]
    layer: int
    neuron: int


class PatchResidualSpec(BaseModel):
    kind: Literal["patch_residual"]
    position: int
    source_tokens: list[int]


InterventionSpec = Annotated[
    Union[AblateHeadSpec, ZeroNeuronSpec, PatchResidualSpec],
    Field(discriminator="kind"),
]


class ProbeRequest(BaseModel):
    tokens: list[int]
    cache_keys: list[str] = []
    intervention: InterventionSpec


def create_app(ckpt_dir: Path = DEFAULT_CKPT_DIR, step: int = DEFAULT_STEP) -> FastAPI:
    app = FastAPI(title="Transformer Rooms API")
    registry = CheckpointRegistry(ckpt_dir)
    loader = ModelLoader(registry, device="cpu")

    # The executor's underlying model is mutable via /checkpoint/{step}.
    # We hold a single ForwardExecutor whose _model attribute we swap.
    initial_model = loader.load(step)
    executor = ForwardExecutor(initial_model)
    prober = ProbeExecutor(initial_model)

    @app.post("/forward", response_model=ForwardResponse)
    def forward(req: ForwardRequest) -> ForwardResponse:
        result = executor.forward(req.tokens, req.cache_keys)
        return ForwardResponse(logits=result.logits, cached=result.cached)

    @app.post("/probe", response_model=ForwardResponse)
    def probe(req: ProbeRequest) -> ForwardResponse:
        spec = req.intervention
        if isinstance(spec, AblateHeadSpec):
            intervention = AblateHead(head=spec.head)
        elif isinstance(spec, ZeroNeuronSpec):
            intervention = ZeroNeuron(layer=spec.layer, neuron=spec.neuron)
        else:
            intervention = PatchResidual(
                position=spec.position, source_tokens=spec.source_tokens
            )
        try:
            result = prober.probe(req.tokens, intervention, req.cache_keys)
        except InvalidInterventionError as e:
            raise HTTPException(status_code=422, detail=str(e))
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
        # Swap weights on the live executor and prober.
        executor._model = new_model  # noqa: SLF001 — intentional, single-process state.
        prober._model = new_model  # noqa: SLF001
        return CheckpointSwitchResponse(ok=True, step=step)

    return app


app = create_app()
