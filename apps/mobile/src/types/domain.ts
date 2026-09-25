/**
 * Frontend types for the domain models in services/backend/app/models.py.
 * Mirrors that schema field-for-field, with two deliberate differences:
 *   - Dates are ISO 8601 strings (what the API actually sends over JSON),
 *     not `Date` objects.
 *   - `User` omits `passwordHash` — the API must never return it, so it has
 *     no place in a type describing what the client receives.
 * Keep both files in sync when the schema changes.
 */

// --- Account -----------------------------------------------------------

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export type User = {
  id: string;
  email: string;
  emailVerified: boolean;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

export type BiologicalSex = 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_SPECIFIED';
export type WeightUnit = 'KG' | 'LB';
export type DistanceUnit = 'KM' | 'MI';

export type UserProfile = {
  id: string;
  userId: string;

  firstName: string;
  lastName?: string;
  dateOfBirth?: string;

  biologicalSex?: BiologicalSex;

  heightCm?: number;
  currentWeightKg?: number;

  preferredWeightUnit: WeightUnit;
  preferredDistanceUnit: DistanceUnit;

  timezone: string;
  profileImageUrl?: string;

  onboardingCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
};

// --- Assessment and its children ----------------------------------------

export type AssessmentStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
export type TrainingExperience = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'HIGH';

export type Assessment = {
  id: string;
  userId: string;

  version: number;
  status: AssessmentStatus;

  trainingExperience: TrainingExperience;
  currentActivityLevel: ActivityLevel;

  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type GoalType = 'LOSE_FAT' | 'BUILD_MUSCLE' | 'GAIN_STRENGTH' | 'IMPROVE_FITNESS' | 'MAINTAIN_WEIGHT';
export type GoalPriority = 'PRIMARY' | 'SECONDARY';

export type UserGoal = {
  id: string;
  assessmentId: string;

  type: GoalType;
  priority: GoalPriority;
  targetValue?: number;
  targetDate?: string;

  createdAt: string;
};

export type TrainingLocation = 'COMMERCIAL_GYM' | 'HOME_GYM' | 'HOME' | 'OUTDOORS';

export type TrainingPreference = {
  id: string;
  assessmentId: string;

  trainingDaysPerWeek: number;
  sessionDurationMinutes: number;

  preferredDays: string[];
  trainingLocation: TrainingLocation;

  preferredTrainingStyle?: string;
  exercisesToAvoid?: string[];
};

export type EquipmentType =
  | 'BARBELL' | 'DUMBBELL' | 'BENCH' | 'CABLE_MACHINE'
  | 'RESISTANCE_BAND' | 'CARDIO_MACHINE' | 'BODYWEIGHT' | 'OTHER';

export type AvailableEquipment = {
  id: string;
  assessmentId: string;

  equipmentType: EquipmentType;
  name?: string;
};

export type HealthConstraintType =
  | 'INJURY' | 'PAIN' | 'MOVEMENT_LIMITATION' | 'MEDICAL_CONDITION' | 'EXERCISE_RESTRICTION';
export type Severity = 'LOW' | 'MODERATE' | 'HIGH';

/** User-reported. Not a diagnosis — see AiAssessment for the AI's own observations. */
export type HealthConstraint = {
  id: string;
  assessmentId: string;

  type: HealthConstraintType;
  bodyArea?: string;
  description: string;
  severity?: Severity;

  reportedByUser: boolean;
  active: boolean;

  createdAt: string;
  updatedAt: string;
};

export type DietaryPattern =
  | 'NO_PREFERENCE' | 'VEGETARIAN' | 'VEGAN' | 'PESCATARIAN' | 'HALAL' | 'KOSHER' | 'OTHER';
export type BudgetLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/** Preferences only. Calorie/macro targets belong to a generated NutritionPlan instead. */
export type NutritionPreference = {
  id: string;
  assessmentId: string;

  dietaryPattern: DietaryPattern;
  mealsPerDay?: number;
  allergies?: string[];
  dislikedFoods?: string[];
  preferredFoods?: string[];
  budgetLevel?: BudgetLevel;
};

export type PhotoView = 'FRONT' | 'SIDE' | 'BACK' | 'OTHER';

/** Object-storage reference and metadata only — never the image bytes. */
export type ProgressPhoto = {
  id: string;
  userId: string;
  assessmentId?: string;

  view: PhotoView;
  storageKey: string;
  capturedAt?: string;
  uploadedAt: string;

  aiAnalysisAllowed: boolean;
  deletedAt?: string;
};

export type AiAssessmentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

/** The AI's own observations. Kept separate from HealthConstraint; neither overwrites the other. */
export type AiAssessment = {
  id: string;
  assessmentId: string;

  modelName: string;
  schemaVersion: string;

  summary: string;
  estimatedTrainingLevel?: string;

  observations: string[];
  trainingConsiderations: string[];
  nutritionConsiderations: string[];

  status: AiAssessmentStatus;
  createdAt: string;
};

// --- Aggregates for API responses ---------------------------------------
// Convenience shapes for what the API returns; never stored as one object.

export type AssessmentDetail = Assessment & {
  goals: UserGoal[];
  trainingPreference?: TrainingPreference;
  equipment: AvailableEquipment[];
  healthConstraints: HealthConstraint[];
  nutritionPreference?: NutritionPreference;
  progressPhotos: ProgressPhoto[];
  aiAssessment?: AiAssessment;
};

export type UserAggregate = {
  user: User;
  profile?: UserProfile;
  latestAssessment?: AssessmentDetail;
};
