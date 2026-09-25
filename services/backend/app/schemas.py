import uuid
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel
from .models import (
    ActivityLevel, AiAssessmentStatus, AssessmentStatus, BiologicalSex, BudgetLevel,
    DietaryPattern, DistanceUnit, EquipmentType, GoalPriority, GoalType,
    HealthConstraintType, PhotoView, Severity, TrainingExperience, TrainingLocation,
    UserStatus, WeightUnit,
)


class CamelModel(BaseModel):
    """Base for every schema exposed to the frontend: accepts and emits camelCase
    over the wire (matching apps/mobile/src/types/domain.ts) while the Python side
    stays snake_case. populate_by_name still accepts snake_case input too."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class ChatRequest(CamelModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, str_strip_whitespace=True)
    message: str = Field(min_length=1, max_length=4000)


class AgentReply(CamelModel):
    reply: str = Field(min_length=1, max_length=32000)
    provider: str = Field(min_length=1, max_length=50)


class ChatResponse(CamelModel):
    id: uuid.UUID
    prompt: str
    reply: str
    provider: str
    created_at: datetime


# --- Account ---------------------------------------------------------------

class UserCreate(CamelModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, str_strip_whitespace=True)
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)


class UserResponse(CamelModel):
    id: uuid.UUID
    email: str
    email_verified: bool
    status: UserStatus
    created_at: datetime
    updated_at: datetime


class UserProfileUpsert(CamelModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, str_strip_whitespace=True)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    date_of_birth: date | None = None
    biological_sex: BiologicalSex | None = None
    height_cm: float | None = Field(default=None, gt=0, lt=300)
    current_weight_kg: float | None = Field(default=None, gt=0, lt=500)
    preferred_weight_unit: WeightUnit = WeightUnit.KG
    preferred_distance_unit: DistanceUnit = DistanceUnit.KM
    timezone: str = Field(default="UTC", max_length=64)
    profile_image_url: str | None = None


class UserProfileResponse(CamelModel):
    id: uuid.UUID
    user_id: uuid.UUID
    first_name: str
    last_name: str | None
    date_of_birth: date | None
    biological_sex: BiologicalSex | None
    height_cm: float | None
    current_weight_kg: float | None
    preferred_weight_unit: WeightUnit
    preferred_distance_unit: DistanceUnit
    timezone: str
    profile_image_url: str | None
    onboarding_completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


# --- Assessment and its children -------------------------------------------

class UserGoalInput(CamelModel):
    type: GoalType
    priority: GoalPriority
    target_value: float | None = None
    target_date: date | None = None


class UserGoalResponse(UserGoalInput):
    id: uuid.UUID
    assessment_id: uuid.UUID
    created_at: datetime


class TrainingPreferenceInput(CamelModel):
    training_days_per_week: int = Field(ge=1, le=7)
    session_duration_minutes: int = Field(ge=10, le=240)
    preferred_days: list[str] | None = None
    training_location: TrainingLocation
    preferred_training_style: str | None = None
    exercises_to_avoid: list[str] | None = None


class TrainingPreferenceResponse(TrainingPreferenceInput):
    id: uuid.UUID
    assessment_id: uuid.UUID


class AvailableEquipmentInput(CamelModel):
    equipment_type: EquipmentType
    name: str | None = None


class AvailableEquipmentResponse(AvailableEquipmentInput):
    id: uuid.UUID
    assessment_id: uuid.UUID


class HealthConstraintInput(CamelModel):
    type: HealthConstraintType
    body_area: str | None = None
    description: str = Field(min_length=1)
    severity: Severity | None = None


class HealthConstraintResponse(CamelModel):
    id: uuid.UUID
    assessment_id: uuid.UUID
    type: HealthConstraintType
    body_area: str | None
    description: str
    severity: Severity | None
    reported_by_user: bool
    active: bool
    created_at: datetime
    updated_at: datetime


class NutritionPreferenceInput(CamelModel):
    dietary_pattern: DietaryPattern
    meals_per_day: int | None = Field(default=None, ge=1, le=10)
    allergies: list[str] | None = None
    disliked_foods: list[str] | None = None
    preferred_foods: list[str] | None = None
    budget_level: BudgetLevel | None = None


class NutritionPreferenceResponse(NutritionPreferenceInput):
    id: uuid.UUID
    assessment_id: uuid.UUID


class AiAssessmentResponse(CamelModel):
    id: uuid.UUID
    assessment_id: uuid.UUID
    model_name: str
    schema_version: str
    summary: str
    estimated_training_level: str | None
    observations: list[str] | None
    training_considerations: list[str] | None
    nutrition_considerations: list[str] | None
    status: AiAssessmentStatus
    created_at: datetime


class ProgressPhotoCreate(CamelModel):
    assessment_id: uuid.UUID | None = None
    view: PhotoView
    storage_key: str = Field(min_length=1)
    captured_at: datetime | None = None
    ai_analysis_allowed: bool = False


class ProgressPhotoResponse(CamelModel):
    id: uuid.UUID
    user_id: uuid.UUID
    assessment_id: uuid.UUID | None
    view: PhotoView
    storage_key: str
    captured_at: datetime | None
    uploaded_at: datetime
    ai_analysis_allowed: bool
    deleted_at: datetime | None


class AssessmentCreate(CamelModel):
    training_experience: TrainingExperience
    current_activity_level: ActivityLevel
    goals: list[UserGoalInput] = Field(min_length=1)
    training_preference: TrainingPreferenceInput
    equipment: list[AvailableEquipmentInput] = Field(default_factory=list)
    health_constraints: list[HealthConstraintInput] = Field(default_factory=list)
    nutrition_preference: NutritionPreferenceInput | None = None


class AssessmentResponse(CamelModel):
    id: uuid.UUID
    user_id: uuid.UUID
    version: int
    status: AssessmentStatus
    training_experience: TrainingExperience
    current_activity_level: ActivityLevel
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class AssessmentDetailResponse(AssessmentResponse):
    goals: list[UserGoalResponse] = []
    training_preference: TrainingPreferenceResponse | None = None
    equipment: list[AvailableEquipmentResponse] = []
    health_constraints: list[HealthConstraintResponse] = []
    nutrition_preference: NutritionPreferenceResponse | None = None
    progress_photos: list[ProgressPhotoResponse] = []
    ai_assessment: AiAssessmentResponse | None = None
