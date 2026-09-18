from unittest.mock import patch
import httpx
from fastapi.testclient import TestClient
from app.main import app, settings


def test_demo_is_labeled(monkeypatch):
    monkeypatch.setattr(settings, "agent_provider", "demo")
    with TestClient(app) as client:
        result = client.post("/v1/respond", json={"message": "Hello"})
        assert result.status_code == 200
        assert result.json()["provider"] == "demo"
        assert "Demo mode" in result.json()["reply"]
        assert client.post("/v1/respond", json={"message": "  "}).status_code == 422


def test_ollama_adapter(monkeypatch):
    monkeypatch.setattr(settings, "agent_provider", "ollama")
    def handler(request):
        assert request.url.path == "/api/chat"
        return httpx.Response(200, json={"message": {"content": "Model reply"}})
    upstream = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    with TestClient(app) as client, patch("app.main.httpx.AsyncClient", return_value=upstream):
        result = client.post("/v1/respond", json={"message": "Hello"})
    assert result.json() == {"reply": "Model reply", "provider": "ollama"}


def test_provider_failure_never_falls_back_to_demo(monkeypatch):
    monkeypatch.setattr(settings, "agent_provider", "ollama")
    upstream = httpx.AsyncClient(transport=httpx.MockTransport(
        lambda request: httpx.Response(500)
    ))
    with TestClient(app) as client, patch("app.main.httpx.AsyncClient", return_value=upstream):
        result = client.post("/v1/respond", json={"message": "Hello"})
    assert result.status_code == 502
