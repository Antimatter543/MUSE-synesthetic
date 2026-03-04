"""Tests for MUSE FastAPI endpoints."""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "adk_available" in data


async def test_gallery_empty(client):
    resp = await client.get("/api/gallery/test-session-123")
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] == 0
    assert data["entries"] == []
