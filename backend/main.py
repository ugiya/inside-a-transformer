"""Uvicorn entry point.

Run:
    uv run uvicorn main:app --reload --port 8000
"""
from transformer_rooms.api import app

__all__ = ["app"]
