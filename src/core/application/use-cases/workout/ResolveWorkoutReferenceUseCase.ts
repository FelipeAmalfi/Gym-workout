import type { WorkoutRepository } from '../../ports/WorkoutRepository.ts';
import type { WorkoutSummary } from '../../../domain/entities/Workout.ts';

const ORDINAL_TO_INDEX: Record<string, number> = {
    first: 0, '1st': 0,
    second: 1, '2nd': 1,
    third: 2, '3rd': 2,
    fourth: 3, '4th': 3,
    fifth: 4, '5th': 4,
    sixth: 5, '6th': 5,
    seventh: 6, '7th': 6,
    eighth: 7, '8th': 7,
    ninth: 8, '9th': 8,
    tenth: 9, '10th': 9,
    last: -1,
};

export interface ResolveWorkoutInput {
    userId: number;
    workoutId?: number;
    muscleGroups?: string[];
    selectionRef?: string;
    candidates?: WorkoutSummary[];
    intent: 'update_workout' | 'delete_workout' | 'get_workout';
}

export type ResolveWorkoutOutput =
    | { kind: 'resolved'; workoutId: number }
    | { kind: 'multiple'; candidates: WorkoutSummary[] }
    | { kind: 'matches_for_get'; matches: WorkoutSummary[]; filterMuscleGroups: string[] }
    | { kind: 'no_match' }
    | { kind: 'needs_reference' }
    | { kind: 'invalid_selection' };

export class ResolveWorkoutReferenceUseCase {
    private readonly workoutRepository: WorkoutRepository;
    constructor(workoutRepository: WorkoutRepository) { this.workoutRepository = workoutRepository; }

    async execute(input: ResolveWorkoutInput): Promise<ResolveWorkoutOutput> {
        if (input.workoutId != null) {
            return { kind: 'resolved', workoutId: input.workoutId };
        }

        if (input.selectionRef && input.candidates && input.candidates.length > 0) {
            const resolved = this.resolveSelection(input.selectionRef, input.candidates);
            if (resolved != null) return { kind: 'resolved', workoutId: resolved };
            return { kind: 'invalid_selection' };
        }

        if (input.muscleGroups && input.muscleGroups.length > 0) {
            const matches = await this.workoutRepository.findByUserIdAndMuscleGroups(
                input.userId,
                input.muscleGroups,
            );

            if (matches.length === 0) return { kind: 'no_match' };
            if (matches.length === 1) return { kind: 'resolved', workoutId: matches[0]!.id };
            if (input.intent === 'get_workout') {
                return { kind: 'matches_for_get', matches, filterMuscleGroups: input.muscleGroups };
            }
            return { kind: 'multiple', candidates: matches };
        }

        return { kind: 'needs_reference' };
    }

    private resolveSelection(ref: string, candidates: WorkoutSummary[]): number | null {
        const trimmed = ref.trim().toLowerCase();
        if (!trimmed) return null;

        const numeric = Number.parseInt(trimmed, 10);
        if (Number.isFinite(numeric) && numeric >= 1 && numeric <= candidates.length) {
            return candidates[numeric - 1]!.id;
        }

        if (trimmed in ORDINAL_TO_INDEX) {
            const idx = ORDINAL_TO_INDEX[trimmed]!;
            const resolved = idx === -1 ? candidates[candidates.length - 1] : candidates[idx];
            return resolved?.id ?? null;
        }

        const exact = candidates.find((c) => c.name.toLowerCase() === trimmed);
        if (exact) return exact.id;

        const partial = candidates.find((c) => c.name.toLowerCase().includes(trimmed));
        return partial?.id ?? null;
    }
}
