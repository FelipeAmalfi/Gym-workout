import type { WorkoutExercisePrescription } from './Exercise.ts';

export interface Workout {
    id: number;
    userId: number;
    name: string;
    description: string | null;
    goal: string | null;
    difficulty: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface WorkoutWithExercises extends Workout {
    exercises: WorkoutExercisePrescription[];
}

export interface WorkoutSummary {
    id: number;
    name: string;
    goal: string | null;
    difficulty: string | null;
    muscleGroups: string[];
}
