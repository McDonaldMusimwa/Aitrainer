import logging
import uuid
from contextlib import asynccontextmanager
import bcrypt
import httpx
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from .config import settings
from .database import engine, get_db
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
