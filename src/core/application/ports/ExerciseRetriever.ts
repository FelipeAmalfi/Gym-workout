import type { RetrievedExercise } from '../../domain/entities/Exercise.ts';

export interface ExerciseSearchQuery {
    muscleGroups?: string[];
    equipment?: string[];
    difficulty?: string;
    limit?: number;
}

export interface ExerciseRetriever {
    search(query: ExerciseSearchQuery): Promise<RetrievedExercise[]>;
}
