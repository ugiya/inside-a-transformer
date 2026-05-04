"""Loads a HookedTransformer at the locked Nanda config from a checkpoint step."""
from __future__ import annotations

import torch
from transformer_lens import HookedTransformer, HookedTransformerConfig

from .checkpoint_registry import CheckpointRegistry

P = 113


def _config(device: str) -> HookedTransformerConfig:
    return HookedTransformerConfig(
        n_layers=1,
        d_model=128,
        d_head=32,
        n_heads=4,
        d_mlp=512,
        d_vocab=P + 1,
        n_ctx=3,
        act_fn="relu",
        normalization_type=None,
        attn_only=False,
        device=device,
    )


class ModelLoader:
    def __init__(self, registry: CheckpointRegistry, device: str = "cpu"):
        self._registry = registry
        self._device = device

    def load(self, step: int) -> HookedTransformer:
        path = self._registry.path(step)
        cfg = _config(self._device)
        model = HookedTransformer(cfg)
        state = torch.load(path, map_location=self._device, weights_only=True)
        model.load_state_dict(state)
        model.eval()
        return model
