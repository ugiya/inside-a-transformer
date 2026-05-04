"""ProbeExecutor unit tests.

Each intervention type produces a deterministic, measurable logit delta vs the
unintervened forward on (5, 17, =) at the grokked checkpoint (step 39999).
"""
from __future__ import annotations
from pathlib import Path

import pytest

from transformer_rooms.checkpoint_registry import CheckpointRegistry
from transformer_rooms.model_loader import ModelLoader
from transformer_rooms.forward_executor import ForwardExecutor, ForwardResult
from transformer_rooms.probe_executor import (
    ProbeExecutor,
    AblateHead,
    ZeroNeuron,
    PatchResidual,
    InvalidInterventionError,
)

CKPT_DIR = Path(__file__).parent.parent / "checkpoints"
P = 113
EQUALS = P
TOKENS = [5, 17, EQUALS]


def _max_abs_delta(a: list[float], b: list[float]) -> float:
    return max(abs(x - y) for x, y in zip(a, b))


@pytest.fixture(scope="module")
def model():
    registry = CheckpointRegistry(CKPT_DIR)
    loader = ModelLoader(registry, device="cpu")
    return loader.load(39999)


@pytest.fixture(scope="module")
def baseline(model):
    return ForwardExecutor(model).forward(TOKENS, cache_keys=[])


@pytest.fixture(scope="module")
def probe(model):
    return ProbeExecutor(model)


# ---------- AblateHead ----------

def test_ablate_head_produces_stable_nonzero_logit_delta(probe, baseline):
    result = probe.probe(TOKENS, AblateHead(head=0), cache_keys=[])

    assert isinstance(result, ForwardResult)
    assert len(result.logits) == P + 1
    delta = _max_abs_delta(result.logits, baseline.logits)
    # Empirically ~40.7 on the grokked checkpoint
    assert delta > 1.0, f"expected meaningful ablation delta, got {delta}"
    # Reproducibility: rerun and compare
    result2 = probe.probe(TOKENS, AblateHead(head=0), cache_keys=[])
    assert result.logits == result2.logits


def test_ablate_head_invalid_head_index_raises_typed_error(probe):
    with pytest.raises(InvalidInterventionError, match="head"):
        probe.probe(TOKENS, AblateHead(head=99), cache_keys=[])


# ---------- ZeroNeuron ----------

def test_zero_neuron_produces_stable_nonzero_logit_delta(probe, baseline):
    # Neuron 0 is active on (5,17,=) at step 39999; chosen because issue
    # spec's example neuron 100 is dead at this checkpoint (delta 0).
    result = probe.probe(TOKENS, ZeroNeuron(layer=0, neuron=0), cache_keys=[])
    delta = _max_abs_delta(result.logits, baseline.logits)
    assert delta > 0.0, "zeroing an active neuron should change logits"
    # Reproducibility
    result2 = probe.probe(TOKENS, ZeroNeuron(layer=0, neuron=0), cache_keys=[])
    assert result.logits == result2.logits


def test_zero_neuron_delta_differs_from_ablate_head(probe, baseline):
    abl = probe.probe(TOKENS, AblateHead(head=0), cache_keys=[])
    zn = probe.probe(TOKENS, ZeroNeuron(layer=0, neuron=0), cache_keys=[])
    # Same baseline, different interventions => different output logits
    assert abl.logits != zn.logits


def test_zero_neuron_invalid_layer_raises_typed_error(probe):
    with pytest.raises(InvalidInterventionError, match="layer"):
        probe.probe(TOKENS, ZeroNeuron(layer=1, neuron=0), cache_keys=[])


# ---------- PatchResidual ----------

def test_patch_residual_pos0_and_pos2_produce_distinguishable_deltas(probe, baseline):
    src = [3, 8, EQUALS]
    p0 = probe.probe(TOKENS, PatchResidual(position=0, source_tokens=src), cache_keys=[])
    p2 = probe.probe(TOKENS, PatchResidual(position=2, source_tokens=src), cache_keys=[])

    delta_p0 = _max_abs_delta(p0.logits, baseline.logits)
    delta_p2 = _max_abs_delta(p2.logits, baseline.logits)

    # Each produces some logit delta (pos2 may be ~0 in 1-layer w/ resid_pre,
    # pos0 propagates through attention). Issue AC asks they be distinguishable.
    assert p0.logits != p2.logits
    # At least one of the two patches must move logits meaningfully
    assert max(delta_p0, delta_p2) > 1.0


def test_patch_residual_is_reproducible(probe):
    src = [3, 8, EQUALS]
    a = probe.probe(TOKENS, PatchResidual(position=0, source_tokens=src), cache_keys=[])
    b = probe.probe(TOKENS, PatchResidual(position=0, source_tokens=src), cache_keys=[])
    assert a.logits == b.logits


# ---------- cache_keys still flow through ----------

def test_probe_returns_requested_cache_keys(probe):
    result = probe.probe(
        TOKENS,
        AblateHead(head=0),
        cache_keys=["blocks.0.attn.hook_pattern"],
    )
    assert "blocks.0.attn.hook_pattern" in result.cached
