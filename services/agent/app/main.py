import asyncio
import json
from collections.abc import AsyncIterator
from typing import Literal
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    agent_provider: Literal["demo", "ollama", "gemini"] = "demo"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    ollama_keep_alive: str = "30m"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.6-flash"


class AgentRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    message: str = Field(min_length=1, max_length=4000)


settings = Settings()
app = FastAPI(title="Aitrainer Agent", version="0.1.0")

# The read timeout applies per chunk, so it only fires when the model stalls,
# not when a long reply is still being written.
UPSTREAM_TIMEOUT = httpx.Timeout(60.0, connect=10.0)
SYSTEM_PROMPT = "You are Aitrainer, a helpful fitness and nutrition coaching assistant. Be clear and concise."


@app.get("/health")
def health():
    return {"status": "ok", "service": "agent", "provider": settings.agent_provider}


def sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


async def demo_stream(message: str) -> AsyncIterator[str]:
    reply = (
        "Demo mode: your message reached the Aitrainer agent. "
        "Connect an AI provider to generate real responses. "
        f"You said: {message}"
    )
    for i, word in enumerate(reply.split(" ")):
        yield (" " if i else "") + word
        await asyncio.sleep(0.02)


async def ollama_stream(message: str) -> AsyncIterator[str]:
    async with httpx.AsyncClient(timeout=UPSTREAM_TIMEOUT) as client:
        async with client.stream(
            "POST",
            f"{settings.ollama_base_url.rstrip('/')}/api/chat",
            json={
                "model": settings.ollama_model, "stream": True,
                "keep_alive": settings.ollama_keep_alive,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": message},
                ],
            },
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.strip():
                    continue
                chunk = json.loads(line)
                if "error" in chunk:
                    raise ValueError(chunk["error"])
                yield chunk["message"]["content"]


async def gemini_stream(message: str) -> AsyncIterator[str]:
    async with httpx.AsyncClient(timeout=UPSTREAM_TIMEOUT) as client:
        async with client.stream(
            "POST",
            f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:streamGenerateContent",
            params={"alt": "sse"},
            headers={"x-goog-api-key": settings.gemini_api_key},
            json={
                "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                "contents": [{"role": "user", "parts": [{"text": message}]}],
            },
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.startswith("data:"):
                    continue
                chunk = json.loads(line[5:])
                # The final chunk may carry only a finishReason and no parts.
                for part in chunk["candidates"][0].get("content", {}).get("parts", []):
                    yield part.get("text", "")


PROVIDERS = {"demo": demo_stream, "ollama": ollama_stream, "gemini": gemini_stream}


async def events(message: str) -> AsyncIterator[str]:
    """Streams `delta` events, then exactly one `done` or `error` event.

    Once the stream has started the HTTP status is already 200, so provider
    failures are reported as an in-stream error event instead."""
    provider = settings.agent_provider
    produced = False
    try:
        async for text in PROVIDERS[provider](message):
            if text:
                produced = True
                yield sse({"type": "delta", "text": text})
    except httpx.TimeoutException:
        yield sse({"type": "error", "message": "AI provider timed out"})
        return
    except (httpx.HTTPError, ValueError, KeyError, TypeError, IndexError):
        yield sse({"type": "error", "message": "AI provider returned an invalid response or is unavailable"})
        return
    if not produced:
        yield sse({"type": "error", "message": "AI provider returned an empty response"})
        return
    yield sse({"type": "done", "provider": provider})


@app.post("/v1/respond")
async def respond(payload: AgentRequest):
    if settings.agent_provider == "gemini" and not settings.gemini_api_key:
        raise HTTPException(500, "GEMINI_API_KEY is not configured")
    return StreamingResponse(
        events(payload.message), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
