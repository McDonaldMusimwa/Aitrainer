import json
from unittest.mock import patch
import httpx
from fastapi.testclient import TestClient
from app.main import app, settings


def events(result):
    assert result.headers["content-type"].startswith("text/event-stream")
    return [json.loads(line[6:]) for line in result.text.splitlines() if line.startswith("data: ")]


def reply(stream):
    return "".join(event["text"] for event in stream if event["type"] == "delta")


def mock_upstream(handler):
    return patch("app.main.httpx.AsyncClient",
                 return_value=httpx.AsyncClient(transport=httpx.MockTransport(handler)))


def test_demo_is_labeled(monkeypatch):
    monkeypatch.setattr(settings, "agent_provider", "demo")
    with TestClient(app) as client:
        result = client.post("/v1/respond", json={"message": "Hello"})
        assert result.status_code == 200
        stream = events(result)
        assert len([e for e in stream if e["type"] == "delta"]) > 1
        assert "Demo mode" in reply(stream)
        assert stream[-1] == {"type": "done", "provider": "demo"}
        assert client.post("/v1/respond", json={"message": "  "}).status_code == 422


def test_ollama_adapter(monkeypatch):
    monkeypatch.setattr(settings, "agent_provider", "ollama")
    def handler(request):
        assert request.url.path == "/api/chat"
        body = json.loads(request.content)
        assert body["stream"] is True and body["keep_alive"]
        lines = [{"message": {"content": "Model "}, "done": False},
                 {"message": {"content": "reply"}, "done": False},
                 {"message": {"content": ""}, "done": True}]
        return httpx.Response(200, content="\n".join(json.dumps(line) for line in lines))
    with TestClient(app) as client, mock_upstream(handler):
        stream = events(client.post("/v1/respond", json={"message": "Hello"}))
    assert reply(stream) == "Model reply"
    assert stream[-1] == {"type": "done", "provider": "ollama"}


def test_ollama_mid_stream_error_is_reported(monkeypatch):
    monkeypatch.setattr(settings, "agent_provider", "ollama")
    content = json.dumps({"message": {"content": "Part"}}) + "\n" + json.dumps({"error": "model crashed"})
    with TestClient(app) as client, mock_upstream(lambda request: httpx.Response(200, content=content)):
        stream = events(client.post("/v1/respond", json={"message": "Hello"}))
    assert reply(stream) == "Part"
    assert stream[-1]["type"] == "error"


def test_provider_failure_never_falls_back_to_demo(monkeypatch):
    monkeypatch.setattr(settings, "agent_provider", "ollama")
    with TestClient(app) as client, mock_upstream(lambda request: httpx.Response(500)):
        stream = events(client.post("/v1/respond", json={"message": "Hello"}))
    assert stream == [{"type": "error", "message": "AI provider returned an invalid response or is unavailable"}]


def test_provider_timeout_is_reported(monkeypatch):
    monkeypatch.setattr(settings, "agent_provider", "ollama")
    def handler(request):
        raise httpx.ReadTimeout("slow", request=request)
    with TestClient(app) as client, mock_upstream(handler):
        stream = events(client.post("/v1/respond", json={"message": "Hello"}))
    assert stream == [{"type": "error", "message": "AI provider timed out"}]


def test_gemini_adapter(monkeypatch):
    monkeypatch.setattr(settings, "agent_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    def handler(request):
        assert request.url.path.endswith(":streamGenerateContent")
        assert request.url.params["alt"] == "sse"
        assert request.headers["x-goog-api-key"] == "test-key"
        assert "key" not in request.url.params
        chunks = [{"candidates": [{"content": {"parts": [{"text": "Model "}]}}]},
                  {"candidates": [{"content": {"parts": [{"text": "reply"}]}}]},
                  {"candidates": [{"finishReason": "STOP"}]}]
        return httpx.Response(200, content="".join(f"data: {json.dumps(c)}\r\n\r\n" for c in chunks))
    with TestClient(app) as client, mock_upstream(handler):
        stream = events(client.post("/v1/respond", json={"message": "Hello"}))
    assert reply(stream) == "Model reply"
    assert stream[-1] == {"type": "done", "provider": "gemini"}


def test_gemini_requires_api_key(monkeypatch):
    monkeypatch.setattr(settings, "agent_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "")
    with TestClient(app) as client:
        result = client.post("/v1/respond", json={"message": "Hello"})
    assert result.status_code == 500


def test_gemini_failure_never_falls_back_to_demo(monkeypatch):
    monkeypatch.setattr(settings, "agent_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    with TestClient(app) as client, mock_upstream(lambda request: httpx.Response(500)):
        stream = events(client.post("/v1/respond", json={"message": "Hello"}))
    assert [e["type"] for e in stream] == ["error"]


def test_empty_reply_is_an_error(monkeypatch):
    monkeypatch.setattr(settings, "agent_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    content = f"data: {json.dumps({'candidates': [{'finishReason': 'SAFETY'}]})}\n\n"
    with TestClient(app) as client, mock_upstream(lambda request: httpx.Response(200, content=content)):
        stream = events(client.post("/v1/respond", json={"message": "Hello"}))
    assert [e["type"] for e in stream] == ["error"]
