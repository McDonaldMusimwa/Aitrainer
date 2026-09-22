export type PlanExercise = { name: string; sets: number; reps: string; rest: string; targetWeightKg: number };
export type PlanDay = { id: 'A' | 'B'; label: string; exercises: PlanExercise[] };

export const planDays: PlanDay[] = [
  {
    id: 'A',
    label: 'Full body A',
    exercises: [
      { name: 'Back squat', sets: 3, reps: '8-10', rest: '90 sec', targetWeightKg: 60 },
      { name: 'Bench press', sets: 3, reps: '8-10', rest: '90 sec', targetWeightKg: 70 },
      { name: 'Lat pulldown', sets: 3, reps: '10', rest: '60 sec', targetWeightKg: 55 },
    ],
  },
  {
    id: 'B',
    label: 'Full body B',
    exercises: [
      { name: 'Deadlift', sets: 3, reps: '6-8', rest: '120 sec', targetWeightKg: 80 },
      { name: 'Overhead press', sets: 3, reps: '8-10', rest: '90 sec', targetWeightKg: 40 },
      { name: 'Seated row', sets: 3, reps: '10', rest: '60 sec', targetWeightKg: 50 },
    ],
  },
];

export const findDay = (id?: 'A' | 'B') => planDays.find(day => day.id === id) ?? planDays[0];
