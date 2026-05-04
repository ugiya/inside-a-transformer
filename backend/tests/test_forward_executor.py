"""ForwardExecutor unit tests."""
from __future__ import annotations
from pathlib import Path

import pytest

from transformer_rooms.checkpoint_registry import CheckpointRegistry
from transformer_rooms.model_loader import ModelLoader
from transformer_rooms.forward_executor import ForwardExecutor

CKPT_DIR = Path(__file__).parent.parent / "checkpoints"
P = 113
EQUALS = P


@pytest.fixture(scope="module")
def executor():
    registry = CheckpointRegistry(CKPT_DIR)
    loader = ModelLoader(registry, device="cpu")
    return ForwardExecutor(loader.load(0))


def test_forward_returns_logits_with_shape_d_vocab(executor):
    result = executor.forward(tokens=[5, 17, EQUALS], cache_keys=[])

    assert isinstance(result.logits, list)
    assert len(result.logits) == P + 1
    assert all(isinstance(v, float) for v in result.logits)
    assert result.cached == {}


def test_forward_with_empty_tokens_raises_value_error(executor):
    with pytest.raises(ValueError, match="empty"):
        executor.forward(tokens=[], cache_keys=[])


def test_forward_with_unknown_cache_key_raises_key_error(executor):
    with pytest.raises(KeyError, match="not_a_real_cache_key"):
        executor.forward(tokens=[5, 17, EQUALS], cache_keys=["not_a_real_cache_key"])


def test_forward_returns_only_requested_cache_keys(executor):
    requested = ["blocks.0.attn.hook_pattern"]
    result = executor.forward(tokens=[5, 17, EQUALS], cache_keys=requested)

    assert set(result.cached.keys()) == set(requested)
    pattern = result.cached["blocks.0.attn.hook_pattern"]
    # n_heads × n_ctx × n_ctx for our config: 4 × 3 × 3
    assert len(pattern) == 4
    assert len(pattern[0]) == 3
    assert len(pattern[0][0]) == 3
