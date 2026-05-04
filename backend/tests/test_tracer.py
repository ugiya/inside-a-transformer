"""Tracer test: prove the entire backend stack works end-to-end.

Loads the final grokked checkpoint (step 39999, test_acc=0.9999) and asserts
that forwarding the input (5, 17, =) returns the correct modular sum (22) as
the argmax. If this passes, the model + checkpoint registry + forward
executor are all wired correctly against a real grokked artifact.
"""
from __future__ import annotations
from pathlib import Path

from transformer_rooms.checkpoint_registry import CheckpointRegistry
from transformer_rooms.model_loader import ModelLoader
from transformer_rooms.forward_executor import ForwardExecutor

CKPT_DIR = Path(__file__).parent.parent / "checkpoints"
P = 113
EQUALS_TOKEN = P  # vocab id 113 reserved for "="


def test_tracer_grokked_checkpoint_predicts_modular_sum():
    a, b = 5, 17
    expected = (a + b) % P  # 22

    registry = CheckpointRegistry(CKPT_DIR)
    loader = ModelLoader(registry, device="cpu")
    model = loader.load(39999)
    executor = ForwardExecutor(model)

    result = executor.forward(tokens=[a, b, EQUALS_TOKEN], cache_keys=[])

    # logits is the per-vocab vector at the final position
    assert len(result.logits) == P + 1, f"expected logits for {P+1} tokens, got {len(result.logits)}"
    # argmax over the first P positions (the answer must be a number 0..112)
    argmax = max(range(P), key=lambda i: result.logits[i])
    assert argmax == expected, (
        f"grokked model on (5, 17, =) should predict 22; got argmax={argmax}. "
        f"Top-3: {sorted(range(P), key=lambda i: result.logits[i], reverse=True)[:3]}"
    )
