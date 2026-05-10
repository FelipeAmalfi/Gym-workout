import type { WorkoutRepository } from '../../ports/WorkoutRepository.ts';
import type { ExerciseRetriever } from '../../ports/ExerciseRetriever.ts';
import type { WorkoutWithExercises } from '../../../domain/entities/Workout.ts';
import type { RetrievedExercise } from '../../../domain/entities/Exercise.ts';
import {
    type Difficulty,
    type DifficultyByMuscle,
    summarizeDifficulty,
    validateDifficultyMap,
} from '../../../domain/value-objects/Difficulty.ts';
import { ValidationError } from '../../../domain/errors/AppError.ts';

export interface CreateWorkoutInput {
    userId: number;
    workoutName?: string;
    goal?: string;
    muscleGroups?: string[];
    equipment?: string[];
    difficulty?: Difficulty;
    difficultyByMuscle?: DifficultyByMuscle;
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
        const numExercises = input.numExercises ?? 5;
        const muscles = input.muscleGroups?.filter(Boolean) ?? [];

        const validation = validateDifficultyMap(muscles, input.difficultyByMuscle);
        if (validation.extraMuscles.length || validation.invalidValues.length) {
            throw new ValidationError(
                `Invalid per-muscle difficulty mapping. Unknown muscles: ${validation.extraMuscles.join(', ') || 'none'}. Invalid values: ${validation.invalidValues.join(', ') || 'none'}.`,
            );
        }
        const byMuscle = validation.sanitized;
        const fallback = input.difficulty;
        const summaryDifficulty = summarizeDifficulty(fallback, byMuscle);

        const exercises = muscles.length > 1
            ? await this.searchPerMuscle(muscles, byMuscle, fallback, input.equipment, numExercises)
            : await this.exerciseRetriever.search({
                  muscleGroups: muscles,
                  equipment: input.equipment,
                  difficulty: fallback ?? byMuscle[muscles[0] ?? ''] ?? 'Intermediate',
                  limit: numExercises,
              });

        if (exercises.length === 0) {
            throw new ValidationError(
                'No exercises found matching your criteria. Try different muscle groups or equipment.',
            );
        }

        const name = input.workoutName ?? this.defaultName(input, summaryDifficulty);

        const workout = await this.workoutRepository.create({
            userId: input.userId,
            name,
            goal: input.goal ?? null,
            difficulty: summaryDifficulty,
            exerciseIds: exercises.map((e) => e.exerciseId),
        });

        return { workout, retrievedExercises: exercises };
    }

    private async searchPerMuscle(
        muscles: string[],
        byMuscle: DifficultyByMuscle,
        fallback: Difficulty | undefined,
        equipment: string[] | undefined,
        total: number,
    ): Promise<RetrievedExercise[]> {
        const perMuscle = Math.max(1, Math.ceil(total / muscles.length));

        const results = await Promise.all(
            muscles.map((muscle) =>
                this.exerciseRetriever.search({
                    muscleGroups: [muscle],
                    equipment,
                    difficulty: byMuscle[muscle] ?? fallback ?? 'Intermediate',
                    limit: perMuscle + 2,
                }),
            ),
        );

        const seen = new Set<number>();
        const merged: RetrievedExercise[] = [];
        const cursors = muscles.map(() => 0);
        while (merged.length < total) {
            let progressed = false;
            for (let i = 0; i < muscles.length && merged.length < total; i++) {
                const queue = results[i] ?? [];
                while (cursors[i]! < queue.length) {
                    const candidate = queue[cursors[i]!]!;
                    cursors[i] = cursors[i]! + 1;
                    if (!seen.has(candidate.exerciseId)) {
                        seen.add(candidate.exerciseId);
                        merged.push(candidate);
                        progressed = true;
                        break;
                    }
                }
            }
            if (!progressed) break;
        }
        return merged;
    }

    private defaultName(input: CreateWorkoutInput, difficulty: Difficulty): string {
        const focus = input.muscleGroups?.join(' & ') ?? input.goal ?? 'Full Body';
        return `${difficulty} ${focus} Workout`;
    }
}
