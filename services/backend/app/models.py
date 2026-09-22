import uuid
from datetime import date, datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class ChatExchange(Base):
    __tablename__ = "chat_exchanges"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    prompt: Mapped[str] = mapped_column(Text)
    reply: Mapped[str] = mapped_column(Text)
    provider: Mapped[str] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# --- Enums ---------------------------------------------------------------
# Plain sqlalchemy.Enum (not the postgresql-only ENUM/ARRAY types) so tables
# still create correctly under the SQLite engine the test suite uses.

class UserStatus(PyEnum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DELETED = "DELETED"


class BiologicalSex(PyEnum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"
    NOT_SPECIFIED = "NOT_SPECIFIED"


class WeightUnit(PyEnum):
    KG = "KG"
    LB = "LB"


class DistanceUnit(PyEnum):
    KM = "KM"
    MI = "MI"


class AssessmentStatus(PyEnum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class TrainingExperience(PyEnum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"


class ActivityLevel(PyEnum):
    SEDENTARY = "SEDENTARY"
    LIGHT = "LIGHT"
    MODERATE = "MODERATE"
    HIGH = "HIGH"


class GoalType(PyEnum):
    LOSE_FAT = "LOSE_FAT"
    BUILD_MUSCLE = "BUILD_MUSCLE"
    GAIN_STRENGTH = "GAIN_STRENGTH"
    IMPROVE_FITNESS = "IMPROVE_FITNESS"
    MAINTAIN_WEIGHT = "MAINTAIN_WEIGHT"


class GoalPriority(PyEnum):
    PRIMARY = "PRIMARY"
    SECONDARY = "SECONDARY"


class TrainingLocation(PyEnum):
    COMMERCIAL_GYM = "COMMERCIAL_GYM"
    HOME_GYM = "HOME_GYM"
    HOME = "HOME"
    OUTDOORS = "OUTDOORS"


class EquipmentType(PyEnum):
    BARBELL = "BARBELL"
    DUMBBELL = "DUMBBELL"
    BENCH = "BENCH"
    CABLE_MACHINE = "CABLE_MACHINE"
    RESISTANCE_BAND = "RESISTANCE_BAND"
    CARDIO_MACHINE = "CARDIO_MACHINE"
    BODYWEIGHT = "BODYWEIGHT"
    OTHER = "OTHER"


class HealthConstraintType(PyEnum):
    INJURY = "INJURY"
    PAIN = "PAIN"
    MOVEMENT_LIMITATION = "MOVEMENT_LIMITATION"
    MEDICAL_CONDITION = "MEDICAL_CONDITION"
    EXERCISE_RESTRICTION = "EXERCISE_RESTRICTION"


class Severity(PyEnum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"


class DietaryPattern(PyEnum):
    NO_PREFERENCE = "NO_PREFERENCE"
    VEGETARIAN = "VEGETARIAN"
    VEGAN = "VEGAN"
    PESCATARIAN = "PESCATARIAN"
    HALAL = "HALAL"
    KOSHER = "KOSHER"
    OTHER = "OTHER"


class BudgetLevel(PyEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class PhotoView(PyEnum):
    FRONT = "FRONT"
    SIDE = "SIDE"
    BACK = "BACK"
    OTHER = "OTHER"


class AiAssessmentStatus(PyEnum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# --- Account ---------------------------------------------------------------

class User(Base):
    """Account and authentication only. No profile, health, or plan data here."""
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[UserStatus] = mapped_column(Enum(UserStatus), default=UserStatus.ACTIVE)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    profile: Mapped["UserProfile"] = relationship(back_populates="user", uselist=False)
    assessments: Mapped[list["Assessment"]] = relationship(back_populates="user")
    progress_photos: Mapped[list["ProgressPhoto"]] = relationship(back_populates="user")


class UserProfile(Base):
    """General personal information, independent of any single assessment."""
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True)

    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str | None] = mapped_column(String(100))
    date_of_birth: Mapped[date | None] = mapped_column(Date)

    biological_sex: Mapped[BiologicalSex | None] = mapped_column(Enum(BiologicalSex))

    height_cm: Mapped[float | None] = mapped_column(Float)
    current_weight_kg: Mapped[float | None] = mapped_column(Float)

    preferred_weight_unit: Mapped[WeightUnit] = mapped_column(Enum(WeightUnit), default=WeightUnit.KG)
    preferred_distance_unit: Mapped[DistanceUnit] = mapped_column(Enum(DistanceUnit), default=DistanceUnit.KM)

    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    profile_image_url: Mapped[str | None] = mapped_column(String)

    onboarding_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="profile")


# --- Assessment and its children -------------------------------------------

class Assessment(Base):
    """One version of the information used to build or update a plan.

    Users can complete more than one over time (e.g. at signup and again
    six months later), so this is versioned rather than overwritten in place.
    """
    __tablename__ = "assessments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)

    version: Mapped[int] = mapped_column(Integer)
    status: Mapped[AssessmentStatus] = mapped_column(Enum(AssessmentStatus), default=AssessmentStatus.IN_PROGRESS)

    training_experience: Mapped[TrainingExperience] = mapped_column(Enum(TrainingExperience))
    current_activity_level: Mapped[ActivityLevel] = mapped_column(Enum(ActivityLevel))

    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="assessments")
    goals: Mapped[list["UserGoal"]] = relationship(back_populates="assessment", cascade="all, delete-orphan")
    training_preference: Mapped["TrainingPreference"] = relationship(back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    equipment: Mapped[list["AvailableEquipment"]] = relationship(back_populates="assessment", cascade="all, delete-orphan")
    health_constraints: Mapped[list["HealthConstraint"]] = relationship(back_populates="assessment", cascade="all, delete-orphan")
    nutrition_preference: Mapped["NutritionPreference"] = relationship(back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    progress_photos: Mapped[list["ProgressPhoto"]] = relationship(back_populates="assessment")
    ai_assessment: Mapped["AiAssessment"] = relationship(back_populates="assessment", uselist=False, cascade="all, delete-orphan")


class UserGoal(Base):
    """A goal recorded on one assessment. Usually one PRIMARY, others SECONDARY."""
    __tablename__ = "user_goals"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    assessment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assessments.id"), index=True)

    type: Mapped[GoalType] = mapped_column(Enum(GoalType))
    priority: Mapped[GoalPriority] = mapped_column(Enum(GoalPriority))
    target_value: Mapped[float | None] = mapped_column(Float)
    target_date: Mapped[date | None] = mapped_column(Date)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    assessment: Mapped["Assessment"] = relationship(back_populates="goals")


class TrainingPreference(Base):
    """How and when the user can train, for one assessment."""
    __tablename__ = "training_preferences"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    assessment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assessments.id"), unique=True)

    training_days_per_week: Mapped[int] = mapped_column(Integer)
    session_duration_minutes: Mapped[int] = mapped_column(Integer)

    # Plain lists for an early MVP; promote to their own tables if querying
    # or normalizing them individually becomes necessary.
    preferred_days: Mapped[list[str] | None] = mapped_column(JSON)
    training_location: Mapped[TrainingLocation] = mapped_column(Enum(TrainingLocation))

    preferred_training_style: Mapped[str | None] = mapped_column(String)
    exercises_to_avoid: Mapped[list[str] | None] = mapped_column(JSON)

    assessment: Mapped["Assessment"] = relationship(back_populates="training_preference")


class AvailableEquipment(Base):
    """One piece of equipment available to the user, for one assessment."""
    __tablename__ = "available_equipment"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    assessment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assessments.id"), index=True)

    equipment_type: Mapped[EquipmentType] = mapped_column(Enum(EquipmentType))
    name: Mapped[str | None] = mapped_column(String)

    assessment: Mapped["Assessment"] = relationship(back_populates="equipment")


class HealthConstraint(Base):
    """A user-reported constraint the planning system must respect.

    This is not a diagnosis. See AiAssessment for the AI's own observations,
    which are kept separate and must never overwrite what the user reported.
    """
    __tablename__ = "health_constraints"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    assessment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assessments.id"), index=True)

    type: Mapped[HealthConstraintType] = mapped_column(Enum(HealthConstraintType))
    body_area: Mapped[str | None] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    severity: Mapped[Severity | None] = mapped_column(Enum(Severity))

    reported_by_user: Mapped[bool] = mapped_column(Boolean, default=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    assessment: Mapped["Assessment"] = relationship(back_populates="health_constraints")


class NutritionPreference(Base):
    """Dietary pattern and food preferences for one assessment.

    Calorie and macro targets belong to a generated NutritionPlan instead,
    since targets can change between plans while these preferences don't.
    """
    __tablename__ = "nutrition_preferences"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    assessment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assessments.id"), unique=True)

    dietary_pattern: Mapped[DietaryPattern] = mapped_column(Enum(DietaryPattern))
    meals_per_day: Mapped[int | None] = mapped_column(Integer)
    allergies: Mapped[list[str] | None] = mapped_column(JSON)
    disliked_foods: Mapped[list[str] | None] = mapped_column(JSON)
    preferred_foods: Mapped[list[str] | None] = mapped_column(JSON)
    budget_level: Mapped[BudgetLevel | None] = mapped_column(Enum(BudgetLevel))

    assessment: Mapped["Assessment"] = relationship(back_populates="nutrition_preference")


class ProgressPhoto(Base):
    """Object-storage reference and metadata for a progress photo. Never the image bytes."""
    __tablename__ = "progress_photos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    assessment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("assessments.id"), index=True)

    view: Mapped[PhotoView] = mapped_column(Enum(PhotoView))
    storage_key: Mapped[str] = mapped_column(String)
    captured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    ai_analysis_allowed: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="progress_photos")
    assessment: Mapped["Assessment"] = relationship(back_populates="progress_photos")


class AiAssessment(Base):
    """The AI's own observations for one assessment, kept separate from what the
    user reported (HealthConstraint.description). Neither should silently
    overwrite the other.
    """
    __tablename__ = "ai_assessments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    assessment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assessments.id"), unique=True)

    model_name: Mapped[str] = mapped_column(String)
    schema_version: Mapped[str] = mapped_column(String)

    summary: Mapped[str] = mapped_column(Text)
    estimated_training_level: Mapped[str | None] = mapped_column(String)

    observations: Mapped[list[str] | None] = mapped_column(JSON)
    training_considerations: Mapped[list[str] | None] = mapped_column(JSON)
    nutrition_considerations: Mapped[list[str] | None] = mapped_column(JSON)

    status: Mapped[AiAssessmentStatus] = mapped_column(Enum(AiAssessmentStatus), default=AiAssessmentStatus.PENDING)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    assessment: Mapped["Assessment"] = relationship(back_populates="ai_assessment")
