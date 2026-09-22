from typing import Literal
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    agent_provider: Literal["demo", "ollama", "gemini"] = "demo"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.6-flash"


class AgentRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    message: str = Field(min_length=1, max_length=4000)


class AgentResponse(BaseModel):
    reply: str = Field(min_length=1, max_length=32000)
    provider: str = Field(min_length=1, max_length=50)


settings = Settings()
app = FastAPI(title="Aitrainer Agent", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "agent", "provider": settings.agent_provider}


@app.post("/v1/respond", response_model=AgentResponse)
async def respond(payload: AgentRequest):
    if settings.agent_provider == "demo":
        return AgentResponse(
            reply=(
                "Demo mode: your message reached the Aitrainer agent. "
                "Connect an AI provider to generate real responses. "
                f"You said: {payload.message}"
            ),
            provider="demo",
        )

    if settings.agent_provider == "gemini":
        if not settings.gemini_api_key:
            raise HTTPException(500, "GEMINI_API_KEY is not configured")
        try:
            async with httpx.AsyncClient(timeout=80.0) as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent",
                    params={"key": settings.gemini_api_key},
                    json={
                        "system_instruction": {"parts": [{"text": "You are Aitrainer, a helpful fitness and nutrition coaching assistant. Be clear and concise."}]},
                        "contents": [{"role": "user", "parts": [{"text": payload.message}]}],
                    },
                )
                response.raise_for_status()
                text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
                return AgentResponse(reply=text, provider="gemini")
        except httpx.TimeoutException as exc:
            raise HTTPException(504, "AI provider timed out") from exc
        except (httpx.HTTPError, ValueError, KeyError, TypeError, IndexError) as exc:
            raise HTTPException(502, "AI provider returned an invalid response or is unavailable") from exc

    try:
        async with httpx.AsyncClient(timeout=80.0) as client:
            response = await client.post(
                f"{settings.ollama_base_url.rstrip('/')}/api/chat",
                json={
                    "model": settings.ollama_model, "stream": False,
                    "messages": [
                        {"role": "system", "content": "You are Aitrainer, a helpful assistant. Be clear and concise."},
                        {"role": "user", "content": payload.message},
                    ],
                },
            )
            response.raise_for_status()
            return AgentResponse(
                reply=response.json()["message"]["content"], provider="ollama"
            )
    except httpx.TimeoutException as exc:
        raise HTTPException(504, "AI provider timed out") from exc
    except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
        raise HTTPException(502, "AI provider returned an invalid response or is unavailable") from exc
