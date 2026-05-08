import type { WorkoutRepository } from '../../ports/WorkoutRepository.ts';
import type { WorkoutWithExercises, WorkoutSummary } from '../../../domain/entities/Workout.ts';

export interface ListWorkoutsInput {
    userId: number;
    muscleGroups?: string[];
}

export type ListWorkoutsOutput =
    | { kind: 'empty'; filterMuscleGroups?: string[] }
    | { kind: 'single'; workout: WorkoutWithExercises; filterMuscleGroups?: string[] }
    | { kind: 'multiple'; candidates: WorkoutSummary[]; filterMuscleGroups?: string[] };

export class ListWorkoutsUseCase {
    private readonly workoutRepository: WorkoutRepository;
    constructor(workoutRepository: WorkoutRepository) { this.workoutRepository = workoutRepository; }

    async execute(input: ListWorkoutsInput): Promise<ListWorkoutsOutput> {
        const filter = input.muscleGroups && input.muscleGroups.length > 0 ? input.muscleGroups : undefined;

        const matches: WorkoutSummary[] = filter
            ? await this.workoutRepository.findByUserIdAndMuscleGroups(input.userId, filter)
            : (await this.workoutRepository.findByUserId(input.userId)).map((w) => ({
                  id: w.id,
                  name: w.name,
                  goal: w.goal,
                  difficulty: w.difficulty,
                  muscleGroups: [],
              }));

        if (matches.length === 0) {
            return { kind: 'empty', filterMuscleGroups: filter };
        }

        if (matches.length === 1) {
            const full = await this.workoutRepository.findById(matches[0]!.id);
            if (!full) return { kind: 'empty', filterMuscleGroups: filter };
            return { kind: 'single', workout: full, filterMuscleGroups: filter };
        }

        return { kind: 'multiple', candidates: matches, filterMuscleGroups: filter };
    }
}
