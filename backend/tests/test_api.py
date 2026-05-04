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


def test_get_steps_returns_sorted_int_list(client):
    r = client.get("/steps")
    assert r.status_code == 200
    body = r.json()
    assert "steps" in body
    steps = body["steps"]
    assert isinstance(steps, list)
    assert all(isinstance(s, int) for s in steps)
    assert steps == sorted(steps)
    # The grokked checkpoint should be available.
    assert 39999 in steps
    assert 0 in steps


def test_get_checkpoint_valid_step_returns_ok(client):
    r = client.get("/checkpoint/39999")
    assert r.status_code == 200
    body = r.json()
    assert body == {"ok": True, "step": 39999}


def test_get_checkpoint_missing_step_returns_404_with_typed_message():
    # Use a fresh client for isolation.
    app = create_app(ckpt_dir=CKPT_DIR, step=39999)
    fresh = TestClient(app)
    r = fresh.get("/checkpoint/123456")
    assert r.status_code == 404
    body = r.json()
    detail = body.get("detail", "")
    assert "123456" in str(detail)


def test_checkpoint_switch_changes_forward_predictions():
    """Switching to step 0 vs step 39999 should yield different argmax for (5,17,=)."""
    app = create_app(ckpt_dir=CKPT_DIR, step=39999)
    c = TestClient(app)

    # Grokked prediction.
    r = c.post("/forward", json={"tokens": [5, 17, EQUALS], "cache_keys": []})
    assert r.status_code == 200
    grokked_argmax = max(range(P), key=lambda i: r.json()["logits"][i])
    assert grokked_argmax == 22

    # Switch to step 0 (untrained).
    r = c.get("/checkpoint/0")
    assert r.status_code == 200
    assert r.json() == {"ok": True, "step": 0}

    # Now forward should reflect step 0 weights.
    r = c.post("/forward", json={"tokens": [5, 17, EQUALS], "cache_keys": []})
    assert r.status_code == 200
    untrained_argmax = max(range(P), key=lambda i: r.json()["logits"][i])
    # Untrained model is highly unlikely to predict 22; assert weights actually changed.
    assert untrained_argmax != 22
