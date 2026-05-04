"""HTTP-level tests for /forward."""
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


def test_post_forward_malformed_body_returns_422(client):
    # tokens missing entirely
    r = client.post("/forward", json={"cache_keys": []})
    assert r.status_code == 422


def test_post_forward_422_detail_identifies_missing_field(client):
    r = client.post("/forward", json={"cache_keys": []})
    assert r.status_code == 422
    detail = r.json()["detail"]
    assert isinstance(detail, list)
    assert len(detail) >= 1
    locations = [tuple(item.get("loc", ())) for item in detail]
    assert any("tokens" in loc for loc in locations)


def test_post_forward_happy_path_returns_grokked_prediction(client):
    r = client.post(
        "/forward",
        json={"tokens": [5, 17, EQUALS], "cache_keys": []},
    )
    assert r.status_code == 200
    body = r.json()
    assert "logits" in body
    assert "cached" in body
    assert len(body["logits"]) == P + 1
    argmax = max(range(P), key=lambda i: body["logits"][i])
    assert argmax == 22
