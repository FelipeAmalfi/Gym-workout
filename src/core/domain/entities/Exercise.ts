export interface Exercise {
    id: number;
    title: string;
    description: string | null;
    bodyPart: string | null;
    equipment: string | null;
    level: string | null;
}

export interface RetrievedExercise {
    exerciseId: number;
    title: string;
    description: string;
    bodyPart: string;
    equipment: string;
    level: string;
    score: number;
}

export interface WorkoutExercisePrescription {
    id: number;
    title: string;
    description: string | null;
    bodyPart: string | null;
    equipment: string | null;
    level: string | null;
    sets: number;
    reps: number;
    restTimeSec: number;
    position: number;
}
