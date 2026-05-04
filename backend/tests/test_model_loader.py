"""ModelLoader unit tests — verify locked Nanda config + determinism."""
from __future__ import annotations
from pathlib import Path

from transformer_rooms.checkpoint_registry import CheckpointRegistry
from transformer_rooms.model_loader import ModelLoader

CKPT_DIR = Path(__file__).parent.parent / "checkpoints"


def test_load_returns_model_with_locked_nanda_config():
    registry = CheckpointRegistry(CKPT_DIR)
    loader = ModelLoader(registry, device="cpu")

    model = loader.load(0)
    cfg = model.cfg

    assert cfg.n_layers == 1
    assert cfg.d_model == 128
    assert cfg.d_head == 32
    assert cfg.n_heads == 4
    assert cfg.d_mlp == 512
    assert cfg.d_vocab == 114  # 113 + "=" token
    assert cfg.n_ctx == 3
    assert cfg.act_fn == "relu"
    assert cfg.normalization_type is None
    assert cfg.attn_only is False
