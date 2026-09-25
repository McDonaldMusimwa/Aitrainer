from unittest.mock import patch
import httpx
import pytest


def test_chat_persists_and_history_returns_it(client):
    response = httpx.Response(200, json={"reply": "Hello", "provider": "demo"},
                              request=httpx.Request("POST", "http://agent/v1/respond"))
    with patch("app.main.httpx.Client") as agent:
        agent.return_value.__enter__.return_value.post.return_value = response
        result = client.post("/api/v1/chat", json={"message": " Hi "})
    assert result.status_code == 201
    assert result.json()["prompt"] == "Hi"
    assert client.get("/api/v1/chat").json()[0]["id"] == result.json()["id"]
    assert client.get("/health").status_code == 200


@pytest.mark.parametrize("message", ["", "  ", "x" * 4001])
def test_invalid_messages(client, message):
    assert client.post("/api/v1/chat", json={"message": message}).status_code == 422


@pytest.mark.parametrize("failure,status", [
    (httpx.ReadTimeout("slow"), 504),
    (httpx.ConnectError("offline"), 502),
])
def test_agent_errors_do_not_save(client, failure, status):
    with patch("app.main.httpx.Client") as agent:
        agent.return_value.__enter__.return_value.post.side_effect = failure
        result = client.post("/api/v1/chat", json={"message": "Hello"})
    assert result.status_code == status
    assert client.get("/api/v1/chat").json() == []


def test_invalid_agent_payload_is_rejected(client):
    response = httpx.Response(200, json={"reply": ""},
                              request=httpx.Request("POST", "http://agent/v1/respond"))
    with patch("app.main.httpx.Client") as agent:
        agent.return_value.__enter__.return_value.post.return_value = response
        result = client.post("/api/v1/chat", json={"message": "Hello"})
    assert result.status_code == 502
    assert client.get("/api/v1/chat").json() == []
