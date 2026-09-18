import logging
from contextlib import asynccontextmanager
import httpx
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from .config import settings
from .database import engine, get_db
from .models import ChatExchange
from .schemas import AgentReply, ChatRequest, ChatResponse

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    engine.dispose()


app = FastAPI(title="Aitrainer API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"], allow_headers=["Content-Type"],
)


@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(503, "Database unavailable") from exc
    return {"status": "ok", "service": "backend"}


@app.post("/api/v1/chat", response_model=ChatResponse, status_code=201)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    try:
        with httpx.Client(timeout=90.0) as client:
            response = client.post(
                f"{settings.agent_url}/v1/respond",
                json={"message": payload.message},
            )
            response.raise_for_status()
            answer = AgentReply.model_validate(response.json())
    except httpx.TimeoutException as exc:
        raise HTTPException(504, "Agent timed out. Please try again.") from exc
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("Agent request failed: %s", type(exc).__name__)
        raise HTTPException(502, "Agent unavailable. Please try again.") from exc

    exchange = ChatExchange(
        prompt=payload.message, reply=answer.reply, provider=answer.provider
    )
    db.add(exchange)
    try:
        db.commit()
        db.refresh(exchange)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(503, "Could not save the response.") from exc
    return exchange


@app.get("/api/v1/chat", response_model=list[ChatResponse])
def history(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(ChatExchange).order_by(
            ChatExchange.created_at.desc(), ChatExchange.id.desc()
        ).limit(limit)
    ).all()
