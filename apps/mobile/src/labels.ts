/** Shared enum -> display label maps, derived from or alongside onboardingDraft.ts's wizard option maps. */
import { EXPERIENCE_OPTIONS, GOAL_OPTIONS } from './onboardingDraft';
import type {
  ActivityLevel, BiologicalSex, DietaryPattern, DistanceUnit, EquipmentType,
  GoalPriority, TrainingLocation, WeightUnit,
} from './types/domain';

function invert<V extends string>(map: Record<string, V>): Record<V, string> {
  return Object.fromEntries(Object.entries(map).map(([label, value]) => [value, label])) as Record<V, string>;
}

export const GOAL_LABELS = invert(GOAL_OPTIONS);
export const EXPERIENCE_LABELS = invert(EXPERIENCE_OPTIONS);

export const GOAL_PRIORITY_LABELS: Record<GoalPriority, string> = {
  PRIMARY: 'Primary', SECONDARY: 'Secondary',
};

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: 'Sedentary', LIGHT: 'Lightly active', MODERATE: 'Moderately active', HIGH: 'Highly active',
};

export const TRAINING_LOCATION_LABELS: Record<TrainingLocation, string> = {
  COMMERCIAL_GYM: 'Commercial gym', HOME_GYM: 'Home gym', HOME: 'Home', OUTDOORS: 'Outdoors',
};

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  BARBELL: 'Barbell', DUMBBELL: 'Dumbbell', BENCH: 'Bench', CABLE_MACHINE: 'Cable machine',
  RESISTANCE_BAND: 'Resistance band', CARDIO_MACHINE: 'Cardio machine', BODYWEIGHT: 'Bodyweight', OTHER: 'Other',
};

export const DIETARY_PATTERN_LABELS: Record<DietaryPattern, string> = {
  NO_PREFERENCE: 'No preference', VEGETARIAN: 'Vegetarian', VEGAN: 'Vegan', PESCATARIAN: 'Pescatarian',
  HALAL: 'Halal', KOSHER: 'Kosher', OTHER: 'Other',
};

export const BIOLOGICAL_SEX_LABELS: Record<BiologicalSex, string> = {
  FEMALE: 'Female', MALE: 'Male', OTHER: 'Other', NOT_SPECIFIED: 'Prefer not to say',
};

export const WEIGHT_UNIT_LABELS: Record<WeightUnit, string> = { KG: 'Kilograms (kg)', LB: 'Pounds (lb)' };
export const DISTANCE_UNIT_LABELS: Record<DistanceUnit, string> = { KM: 'Kilometers (km)', MI: 'Miles (mi)' };
