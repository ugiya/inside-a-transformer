"""HTTP-level tests for /probe."""
from __future__ import annotations
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from transformer_rooms.api import create_app

CKPT_DIR = Path(__file__).parent.parent / "checkpoints"
P = 113
EQUALS = P


@pytest.fixture(scope="module")
def client():
    app = create_app(ckpt_dir=CKPT_DIR, step=39999)
    return TestClient(app)


def test_post_probe_ablate_head_happy_path(client):
    r = client.post(
        "/probe",
        json={
            "tokens": [5, 17, EQUALS],
            "cache_keys": [],
            "intervention": {"kind": "ablate_head", "head": 0},
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert "logits" in body
    assert "cached" in body
    assert len(body["logits"]) == P + 1


def test_post_probe_zero_neuron_happy_path(client):
    r = client.post(
        "/probe",
        json={
            "tokens": [5, 17, EQUALS],
            "cache_keys": [],
            "intervention": {"kind": "zero_neuron", "layer": 0, "neuron": 0},
        },
    )
    assert r.status_code == 200
    assert len(r.json()["logits"]) == P + 1


def test_post_probe_patch_residual_happy_path(client):
    r = client.post(
        "/probe",
        json={
            "tokens": [5, 17, EQUALS],
            "cache_keys": [],
            "intervention": {
                "kind": "patch_residual",
                "position": 0,
                "source_tokens": [3, 8, EQUALS],
            },
        },
    )
    assert r.status_code == 200
    assert len(r.json()["logits"]) == P + 1


def test_post_probe_missing_kind_returns_422(client):
    r = client.post(
        "/probe",
        json={
            "tokens": [5, 17, EQUALS],
            "cache_keys": [],
            "intervention": {"head": 0},  # no 'kind'
        },
    )
    assert r.status_code == 422


def test_post_probe_unknown_kind_returns_422(client):
    r = client.post(
        "/probe",
        json={
            "tokens": [5, 17, EQUALS],
            "cache_keys": [],
            "intervention": {"kind": "no_such_kind", "head": 0},
        },
    )
    assert r.status_code == 422


def test_post_probe_head_out_of_range_returns_4xx(client):
    """Out-of-range head must surface as a 4xx (we return 422 — invalid input)."""
    r = client.post(
        "/probe",
        json={
            "tokens": [5, 17, EQUALS],
            "cache_keys": [],
            "intervention": {"kind": "ablate_head", "head": 99},
        },
    )
    assert 400 <= r.status_code < 500
    # Be generous about exact code — contract is "typed 4xx"; document choice in code.
    assert r.status_code == 422
