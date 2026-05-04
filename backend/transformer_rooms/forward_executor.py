"""Runs a forward pass and returns logits + selected cached activations."""
from __future__ import annotations
from dataclasses import dataclass

import torch
from transformer_lens import HookedTransformer


@dataclass
class ForwardResult:
    logits: list[float]
    cached: dict[str, list]


class ForwardExecutor:
    def __init__(self, model: HookedTransformer):
        self._model = model

    def forward(self, tokens: list[int], cache_keys: list[str]) -> ForwardResult:
        if not tokens:
            raise ValueError("tokens list is empty")
        x = torch.tensor([tokens], device=self._model.cfg.device)
        with torch.no_grad():
            if cache_keys:
                logits_t, cache = self._model.run_with_cache(x)
                cached = {}
                for k in cache_keys:
                    if k not in cache:
                        raise KeyError(k)
                    cached[k] = cache[k][0].tolist()
            else:
                logits_t = self._model(x)
                cached = {}
        last_pos_logits = logits_t[0, -1].tolist()
        return ForwardResult(logits=last_pos_logits, cached=cached)
