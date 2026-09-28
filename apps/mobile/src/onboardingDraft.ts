/**
 * Accumulates answers across the assessment wizard's screens (each of which
 * owns its own local UI state) so AssessmentReviewScreen can submit one
 * profile update and one assessment in a single "Generate my plan" tap.
 * In memory only, matching session.ts — cleared after a successful submit
 * or when a fresh assessment starts.
 */
import type {
  ActivityLevel, BiologicalSex, DietaryPattern, EquipmentType,
  GoalType, TrainingExperience, TrainingLocation,
} from './types/domain';

export type OnboardingDraft = {
  // -> PUT /users/{id}/profile
  firstName: string;
  lastName?: string;
  dateOfBirth?: string;
  biologicalSex?: BiologicalSex;
  heightCm?: number;
  currentWeightKg?: number;

  // -> POST /users/{id}/assessments
  goalType: GoalType;
  trainingExperience: TrainingExperience;
  trainingDaysPerWeek: number;
  sessionDurationMinutes: number;
  trainingLocation: TrainingLocation;
  equipment: EquipmentType[];
  /** Free text; empty means "nothing to report" and no HealthConstraint is sent. */
  healthDescription: string;
  dietaryPattern: DietaryPattern;
  allergies: string[];
};

const defaults: OnboardingDraft = {
  firstName: 'Member',
  goalType: 'BUILD_MUSCLE',
  trainingExperience: 'INTERMEDIATE',
  trainingDaysPerWeek: 3,
  sessionDurationMinutes: 45,
  trainingLocation: 'COMMERCIAL_GYM',
  equipment: ['BARBELL', 'DUMBBELL', 'BENCH', 'CABLE_MACHINE', 'CARDIO_MACHINE'],
  healthDescription: '',
  dietaryPattern: 'NO_PREFERENCE',
  allergies: [],
};

let draft: OnboardingDraft = { ...defaults };

export const getDraft = () => draft;
export const updateDraft = (patch: Partial<OnboardingDraft>) => { draft = { ...draft, ...patch }; };
export const resetDraft = () => { draft = { ...defaults }; };

/** The wizard never asks about activity level directly; derive it from experience. */
export const activityLevelForExperience = (experience: TrainingExperience): ActivityLevel => ({
  BEGINNER: 'SEDENTARY', INTERMEDIATE: 'MODERATE', ADVANCED: 'HIGH',
} as const)[experience];

export const GOAL_OPTIONS: Record<string, GoalType> = {
  'Lose body fat': 'LOSE_FAT',
  'Build muscle': 'BUILD_MUSCLE',
  'Get stronger': 'GAIN_STRENGTH',
  'Improve fitness': 'IMPROVE_FITNESS',
};

export const EXPERIENCE_OPTIONS: Record<string, TrainingExperience> = {
  'Beginner': 'BEGINNER',
  'Intermediate': 'INTERMEDIATE',
  'Advanced': 'ADVANCED',
};

export const EQUIPMENT_OPTIONS: Record<string, { trainingLocation: TrainingLocation; equipment: EquipmentType[] }> = {
  'Full gym': { trainingLocation: 'COMMERCIAL_GYM', equipment: ['BARBELL', 'DUMBBELL', 'BENCH', 'CABLE_MACHINE', 'CARDIO_MACHINE'] },
  'Home gym': { trainingLocation: 'HOME_GYM', equipment: ['DUMBBELL', 'BENCH', 'RESISTANCE_BAND'] },
  'Dumbbells only': { trainingLocation: 'HOME', equipment: ['DUMBBELL'] },
  'Bodyweight only': { trainingLocation: 'HOME', equipment: ['BODYWEIGHT'] },
};

export const DIET_OPTIONS: Record<string, DietaryPattern> = {
  'Performance': 'NO_PREFERENCE',
  'Vegetarian': 'VEGETARIAN',
  'Vegan': 'VEGAN',
  'Low carb': 'OTHER',
};
