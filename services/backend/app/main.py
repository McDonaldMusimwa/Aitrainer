import asyncio
import json
import logging
import uuid
from contextlib import asynccontextmanager
import bcrypt
import httpx
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from .config import settings
from .database import engine, get_db, get_session_factory
from .models import (
    AvailableEquipment, Assessment, ChatExchange, HealthConstraint,
    NutritionPreference, ProgressPhoto, TrainingPreference, User, UserGoal, UserProfile,
)
from .schemas import (
    AgentReply, AssessmentCreate, AssessmentDetailResponse, AssessmentResponse,
    ChatRequest, ChatResponse, ProgressPhotoCreate, ProgressPhotoResponse,
    UserCreate, UserProfileResponse, UserProfileUpsert, UserResponse,
)

logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def get_user_or_404(user_id: uuid.UUID, db: Session) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found.")
    return user


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    engine.dispose()


app = FastAPI(title="Aitrainer API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "PUT"], allow_headers=["Content-Type"],
)


@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(503, "Database unavailable") from exc
    return {"status": "ok", "service": "backend"}


def sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


class AgentStreamError(Exception):
    pass


def save_exchange(session_factory, prompt: str, answer: AgentReply) -> dict:
    with session_factory() as db:
        exchange = ChatExchange(prompt=prompt, reply=answer.reply, provider=answer.provider)
        db.add(exchange)
        try:
            db.commit()
            db.refresh(exchange)
        except SQLAlchemyError:
            db.rollback()
            raise
        return ChatResponse.model_validate(exchange).model_dump(mode="json", by_alias=True)


async def relay_agent(prompt: str, queue: asyncio.Queue, session_factory) -> None:
    """Forwards agent deltas to `queue`, then saves the full reply.

    Runs as its own task so a client that disconnects partway (a dropped mobile
    connection) does not stop the reply from being finished and saved. The
    queue always ends with one `done` or `error` event followed by None."""
    parts: list[str] = []
    try:
        provider = None
        # The read timeout applies per chunk: it fires only when the agent stalls.
        async with httpx.AsyncClient(timeout=httpx.Timeout(70.0, connect=10.0)) as client:
            async with client.stream(
                "POST", f"{settings.agent_url}/v1/respond", json={"message": prompt}
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    event = json.loads(line[6:])
                    if event["type"] == "delta":
                        parts.append(event["text"])
                        await queue.put({"type": "delta", "text": event["text"]})
                    elif event["type"] == "error":
                        raise AgentStreamError(event["message"])
                    elif event["type"] == "done":
                        provider = event["provider"]
                        break
        if provider is None:
            raise ValueError("Agent stream ended without a done event")
        answer = AgentReply(reply="".join(parts), provider=provider)
        exchange = await run_in_threadpool(save_exchange, session_factory, prompt, answer)
        await queue.put({"type": "done", "exchange": exchange})
    except httpx.TimeoutException:
        await queue.put({"type": "error", "message": "Agent timed out. Please try again."})
    except AgentStreamError as exc:
        logger.warning("Agent reported an error: %s", exc)
        await queue.put({"type": "error", "message": f"{exc}. Please try again."})
    except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
        logger.warning("Agent request failed: %s", type(exc).__name__)
        await queue.put({"type": "error", "message": "Agent unavailable. Please try again."})
    except SQLAlchemyError:
        logger.exception("Could not save chat exchange")
        await queue.put({"type": "error", "message": "Could not save the response."})
    finally:
        await queue.put(None)


# Strong references so in-flight relays are not garbage collected mid-stream.
_relays: set[asyncio.Task] = set()


@app.post("/api/v1/chat")
async def chat(payload: ChatRequest, session_factory=Depends(get_session_factory)):
    """Streams the reply as server-sent events: `delta` events with text as it
    is written, then one `done` event with the saved exchange, or one `error`."""
    queue: asyncio.Queue = asyncio.Queue()
    task = asyncio.create_task(relay_agent(payload.message, queue, session_factory))
    _relays.add(task)
    task.add_done_callback(_relays.discard)

    async def events():
        while (event := await queue.get()) is not None:
            yield sse(event)

    return StreamingResponse(
        events(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


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


# --- Account -----------------------------------------------------------

@app.post("/api/v1/users", response_model=UserResponse, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == payload.email)):
        raise HTTPException(409, "An account with this email already exists.")
    user = User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(503, "Could not create the account.") from exc
    return user


@app.get("/api/v1/users/{user_id}", response_model=UserResponse)
def get_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    return get_user_or_404(user_id, db)


@app.get("/api/v1/users/{user_id}/profile", response_model=UserProfileResponse)
def get_profile(user_id: uuid.UUID, db: Session = Depends(get_db)):
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))
    if not profile:
        raise HTTPException(404, "Profile not found.")
    return profile


@app.put("/api/v1/users/{user_id}/profile", response_model=UserProfileResponse)
def upsert_profile(user_id: uuid.UUID, payload: UserProfileUpsert, db: Session = Depends(get_db)):
    get_user_or_404(user_id, db)
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))
    if profile is None:
        profile = UserProfile(user_id=user_id)
        db.add(profile)
    for field, value in payload.model_dump().items():
        setattr(profile, field, value)
    try:
        db.commit()
        db.refresh(profile)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(503, "Could not save the profile.") from exc
    return profile


# --- Assessment ----------------------------------------------------------

@app.post("/api/v1/users/{user_id}/assessments", response_model=AssessmentDetailResponse, status_code=201)
def create_assessment(user_id: uuid.UUID, payload: AssessmentCreate, db: Session = Depends(get_db)):
    get_user_or_404(user_id, db)
    next_version = (db.scalar(
        select(func.max(Assessment.version)).where(Assessment.user_id == user_id)
    ) or 0) + 1

    assessment = Assessment(
        user_id=user_id, version=next_version,
        training_experience=payload.training_experience,
        current_activity_level=payload.current_activity_level,
    )
    db.add(assessment)
    db.flush()

    for goal in payload.goals:
        db.add(UserGoal(assessment_id=assessment.id, **goal.model_dump()))
    db.add(TrainingPreference(assessment_id=assessment.id, **payload.training_preference.model_dump()))
    for item in payload.equipment:
        db.add(AvailableEquipment(assessment_id=assessment.id, **item.model_dump()))
    for constraint in payload.health_constraints:
        db.add(HealthConstraint(assessment_id=assessment.id, reported_by_user=True, **constraint.model_dump()))
    if payload.nutrition_preference:
        db.add(NutritionPreference(assessment_id=assessment.id, **payload.nutrition_preference.model_dump()))

    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(503, "Could not save the assessment.") from exc
    db.refresh(assessment)
    return assessment


@app.get("/api/v1/users/{user_id}/assessments/latest", response_model=AssessmentDetailResponse)
def get_latest_assessment(user_id: uuid.UUID, db: Session = Depends(get_db)):
    assessment = db.scalar(
        select(Assessment).where(Assessment.user_id == user_id)
        .order_by(Assessment.version.desc())
    )
    if not assessment:
        raise HTTPException(404, "No assessment found for this user.")
    return assessment


@app.get("/api/v1/users/{user_id}/assessments", response_model=list[AssessmentResponse])
def list_assessments(user_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.scalars(
        select(Assessment).where(Assessment.user_id == user_id).order_by(Assessment.version.desc())
    ).all()


# --- Progress photos -------------------------------------------------------

@app.post("/api/v1/users/{user_id}/progress-photos", response_model=ProgressPhotoResponse, status_code=201)
def create_progress_photo(user_id: uuid.UUID, payload: ProgressPhotoCreate, db: Session = Depends(get_db)):
    get_user_or_404(user_id, db)
    photo = ProgressPhoto(user_id=user_id, **payload.model_dump())
    db.add(photo)
    try:
        db.commit()
        db.refresh(photo)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(503, "Could not save the photo.") from exc
    return photo


@app.get("/api/v1/users/{user_id}/progress-photos", response_model=list[ProgressPhotoResponse])
def list_progress_photos(user_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.scalars(
        select(ProgressPhoto).where(
            ProgressPhoto.user_id == user_id, ProgressPhoto.deleted_at.is_(None)
        ).order_by(ProgressPhoto.uploaded_at.desc())
    ).all()
