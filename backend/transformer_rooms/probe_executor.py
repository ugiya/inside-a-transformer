"""Generic intervention primitive: ablate heads, zero neurons, patch residuals."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Union

import torch
from transformer_lens import HookedTransformer

from .forward_executor import ForwardResult


class InvalidInterventionError(ValueError):
    """Raised when an intervention spec references an out-of-range component."""


@dataclass(frozen=True)
class AblateHead:
    head: int


@dataclass(frozen=True)
class ZeroNeuron:
    layer: int
    neuron: int


@dataclass(frozen=True)
class PatchResidual:
    position: int
    source_tokens: list[int]


Intervention = Union[AblateHead, ZeroNeuron, PatchResidual]


class ProbeExecutor:
    def __init__(self, model: HookedTransformer):
        self._model = model

    def probe(
        self,
        tokens: list[int],
        intervention: Intervention,
        cache_keys: list[str],
    ) -> ForwardResult:
        if not tokens:
            raise ValueError("tokens list is empty")

        cfg = self._model.cfg
        x = torch.tensor([tokens], device=cfg.device)
        hooks = self._build_hooks(intervention)

        with torch.no_grad():
            if cache_keys:
                with self._model.hooks(fwd_hooks=hooks):
                    logits_t, cache = self._model.run_with_cache(x)
                cached: dict[str, list] = {}
                for k in cache_keys:
                    if k not in cache:
                        raise KeyError(k)
                    cached[k] = cache[k][0].tolist()
            else:
                logits_t = self._model.run_with_hooks(x, fwd_hooks=hooks)
                cached = {}

        return ForwardResult(logits=logits_t[0, -1].tolist(), cached=cached)

    def _build_hooks(self, intervention: Intervention) -> list[tuple[str, callable]]:
        cfg = self._model.cfg

        if isinstance(intervention, AblateHead):
            if not (0 <= intervention.head < cfg.n_heads):
                raise InvalidInterventionError(
                    f"head index {intervention.head} out of range [0, {cfg.n_heads})"
                )
            head = intervention.head

            def hook(z, hook):  # z shape: [batch, seq, n_heads, d_head]
                z[:, :, head, :] = 0.0
                return z

            return [("blocks.0.attn.hook_z", hook)]

        if isinstance(intervention, ZeroNeuron):
            if intervention.layer != 0:
                raise InvalidInterventionError(
                    f"layer {intervention.layer} out of range; only layer=0 supported"
                )
            if not (0 <= intervention.neuron < cfg.d_mlp):
                raise InvalidInterventionError(
                    f"neuron index {intervention.neuron} out of range [0, {cfg.d_mlp})"
                )
            neuron = intervention.neuron

            def hook(post, hook):  # post shape: [batch, seq, d_mlp]
                post[:, :, neuron] = 0.0
                return post

            return [(f"blocks.{intervention.layer}.mlp.hook_post", hook)]

        if isinstance(intervention, PatchResidual):
            if not (0 <= intervention.position < cfg.n_ctx):
                raise InvalidInterventionError(
                    f"position {intervention.position} out of range [0, {cfg.n_ctx})"
                )
            position = intervention.position

            src_x = torch.tensor([intervention.source_tokens], device=cfg.device)
            with torch.no_grad():
                _, src_cache = self._model.run_with_cache(
                    src_x, names_filter="blocks.0.hook_resid_post"
                )
            src_resid = src_cache["blocks.0.hook_resid_post"][0, position].clone()

            def hook(resid, hook):  # resid shape: [batch, seq, d_model]
                resid[:, position, :] = src_resid
                return resid

            return [("blocks.0.hook_resid_post", hook)]

        raise InvalidInterventionError(f"Unknown intervention type: {type(intervention)}")
