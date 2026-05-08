import type { WorkoutRepository } from '../../ports/WorkoutRepository.ts';
import type { ExerciseRetriever } from '../../ports/ExerciseRetriever.ts';
import type { WorkoutWithExercises } from '../../../domain/entities/Workout.ts';
import type { RetrievedExercise } from '../../../domain/entities/Exercise.ts';
import type { Difficulty } from '../../../domain/value-objects/Difficulty.ts';
import { ValidationError } from '../../../domain/errors/AppError.ts';

export interface CreateWorkoutInput {
    userId: number;
    workoutName?: string;
    goal?: string;
    muscleGroups?: string[];
    equipment?: string[];
    difficulty?: Difficulty;
    numExercises?: number;
}

export interface CreateWorkoutOutput {
    workout: WorkoutWithExercises;
    retrievedExercises: RetrievedExercise[];
}

export class CreateWorkoutUseCase {
    private readonly workoutRepository: WorkoutRepository;
    private readonly exerciseRetriever: ExerciseRetriever;
    constructor(workoutRepository: WorkoutRepository, exerciseRetriever: ExerciseRetriever) {
        this.workoutRepository = workoutRepository;
        this.exerciseRetriever = exerciseRetriever;
    }

    async execute(input: CreateWorkoutInput): Promise<CreateWorkoutOutput> {
        const difficulty: Difficulty = input.difficulty ?? 'Intermediate';
        const numExercises = input.numExercises ?? 5;

        const exercises = await this.exerciseRetriever.search({
            muscleGroups: input.muscleGroups,
            equipment: input.equipment,
            difficulty,
            limit: numExercises,
        });

        if (exercises.length === 0) {
            throw new ValidationError(
                'No exercises found matching your criteria. Try different muscle groups or equipment.',
            );
        }

        const name = input.workoutName ?? this.defaultName(input, difficulty);

        const workout = await this.workoutRepository.create({
            userId: input.userId,
            name,
            goal: input.goal ?? null,
            difficulty,
            exerciseIds: exercises.map((e) => e.exerciseId),
        });

        return { workout, retrievedExercises: exercises };
    }

    private defaultName(input: CreateWorkoutInput, difficulty: Difficulty): string {
        const focus = input.muscleGroups?.join(' & ') ?? input.goal ?? 'Full Body';
        return `${difficulty} ${focus} Workout`;
    }
}
