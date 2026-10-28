import json
from unittest.mock import patch
import httpx
import pytest


def sse(*events):
    return "".join(f"data: {json.dumps(event)}\n\n" for event in events)


def mock_agent(handler):
    return patch("app.main.httpx.AsyncClient",
                 return_value=httpx.AsyncClient(transport=httpx.MockTransport(handler)))


def stream(result):
    assert result.status_code == 200
    assert result.headers["content-type"].startswith("text/event-stream")
    return [json.loads(line[6:]) for line in result.text.splitlines() if line.startswith("data: ")]


def test_chat_streams_persists_and_history_returns_it(client):
    def agent(request):
        assert request.url.path == "/v1/respond"
        assert json.loads(request.content) == {"message": "Hi"}
        return httpx.Response(200, content=sse(
            {"type": "delta", "text": "Hel"}, {"type": "delta", "text": "lo"},
            {"type": "done", "provider": "demo"},
        ))
    with mock_agent(agent):
        events = stream(client.post("/api/v1/chat", json={"message": " Hi "}))
    assert events[:2] == [{"type": "delta", "text": "Hel"}, {"type": "delta", "text": "lo"}]
    done = events[-1]
    assert done["type"] == "done"
    assert done["exchange"]["prompt"] == "Hi"
    assert done["exchange"]["reply"] == "Hello"
    assert done["exchange"]["provider"] == "demo"
    assert client.get("/api/v1/chat").json()[0]["id"] == done["exchange"]["id"]
    assert client.get("/health").status_code == 200


@pytest.mark.parametrize("message", ["", "  ", "x" * 4001])
def test_invalid_messages(client, message):
    assert client.post("/api/v1/chat", json={"message": message}).status_code == 422


@pytest.mark.parametrize("failure,message", [
    (httpx.ReadTimeout("slow"), "Agent timed out. Please try again."),
    (httpx.ConnectError("offline"), "Agent unavailable. Please try again."),
])
def test_agent_errors_do_not_save(client, failure, message):
    def agent(request):
        raise failure
    with mock_agent(agent):
        events = stream(client.post("/api/v1/chat", json={"message": "Hello"}))
    assert events == [{"type": "error", "message": message}]
    assert client.get("/api/v1/chat").json() == []


def test_agent_http_error_is_reported(client):
    with mock_agent(lambda request: httpx.Response(500)):
        events = stream(client.post("/api/v1/chat", json={"message": "Hello"}))
    assert events == [{"type": "error", "message": "Agent unavailable. Please try again."}]


def test_mid_stream_error_keeps_partial_text_and_does_not_save(client):
    body = sse({"type": "delta", "text": "Part"}, {"type": "error", "message": "AI provider timed out"})
    with mock_agent(lambda request: httpx.Response(200, content=body)):
        events = stream(client.post("/api/v1/chat", json={"message": "Hello"}))
    assert events == [
        {"type": "delta", "text": "Part"},
        {"type": "error", "message": "AI provider timed out. Please try again."},
    ]
    assert client.get("/api/v1/chat").json() == []


def test_truncated_agent_stream_is_rejected(client):
    body = sse({"type": "delta", "text": "Part"})
    with mock_agent(lambda request: httpx.Response(200, content=body)):
        events = stream(client.post("/api/v1/chat", json={"message": "Hello"}))
    assert events[-1] == {"type": "error", "message": "Agent unavailable. Please try again."}
    assert client.get("/api/v1/chat").json() == []
