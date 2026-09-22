import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Plan: undefined;
  Coach: undefined;
  Progress: undefined;
};

export type RootStackParamList = {
  EntryAccount: undefined;
  SignUp: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  AssessmentWelcome: undefined;
  AssessmentBasics: undefined;
  AssessmentGoals: undefined;
  AssessmentExperience: undefined;
  AssessmentSchedule: undefined;
  AssessmentEquipment: undefined;
  AssessmentHealth: undefined;
  AssessmentNutrition: undefined;
  AssessmentPhotos: undefined;
  AssessmentReview: undefined;
  PlanReady: undefined;
  PlanFirst: undefined;
  PlanWorkoutPreview: { day: 'A' | 'B' };
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  TodayWorkout: { day: 'A' | 'B'; done?: string[] };
  ExerciseDetail: { day: 'A' | 'B'; exercise: string; done?: string[] };
  WorkoutComplete: { day: 'A' | 'B' };
  WorkoutAdjust: undefined;
  Profile: undefined;
};
