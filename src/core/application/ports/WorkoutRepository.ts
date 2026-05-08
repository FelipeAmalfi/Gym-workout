import type { Workout, WorkoutWithExercises, WorkoutSummary } from '../../domain/entities/Workout.ts';

export interface CreateWorkoutData {
    userId: number;
    name: string;
    goal?: string | null;
    difficulty?: string | null;
    description?: string | null;
    exerciseIds: number[];
    sets?: number;
    reps?: number;
    restTimeSec?: number;
}

export interface UpdateWorkoutData {
    name?: string;
    goal?: string | null;
    difficulty?: string | null;
    description?: string | null;
}

export interface WorkoutRepository {
    create(data: CreateWorkoutData): Promise<WorkoutWithExercises>;
    update(workoutId: number, patches: UpdateWorkoutData): Promise<Workout>;
    delete(workoutId: number, userId: number): Promise<void>;
    findById(workoutId: number): Promise<WorkoutWithExercises | null>;
    findByUserId(userId: number): Promise<Workout[]>;
    findByUserIdAndMuscleGroups(userId: number, muscleGroups: string[]): Promise<WorkoutSummary[]>;
}
