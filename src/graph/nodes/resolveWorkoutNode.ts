import { WorkoutService } from '../../services/workoutService.ts';
import type { GraphState } from '../graph.ts';

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

function resolveSelectionRef(
    ref: string,
    candidates: NonNullable<GraphState['workoutCandidates']>,
): { id: number } | null {
    const trimmed = ref.trim().toLowerCase();
    if (!trimmed) return null;

    const numeric = Number.parseInt(trimmed, 10);
    if (Number.isFinite(numeric) && numeric >= 1 && numeric <= candidates.length) {
        return { id: candidates[numeric - 1]!.id };
    }

    if (trimmed in ORDINAL_TO_INDEX) {
        const idx = ORDINAL_TO_INDEX[trimmed]!;
        const resolved = idx === -1 ? candidates[candidates.length - 1] : candidates[idx];
        return resolved ? { id: resolved.id } : null;
    }

    const exactName = candidates.find(c => c.name.toLowerCase() === trimmed);
    if (exactName) return { id: exactName.id };

    const partialName = candidates.find(c => c.name.toLowerCase().includes(trimmed));
    if (partialName) return { id: partialName.id };

    return null;
}

export function createResolveWorkoutNode(workoutService: WorkoutService) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        console.log('🔎 Resolving workout reference...');

        const slots = state.slots ?? {};
        const userId = slots.userId ?? 1;
        const candidates = state.workoutCandidates ?? [];

        if (slots.workoutId != null) {
            return { workoutCandidates: undefined };
        }

        if (slots.selectionRef && candidates.length > 0) {
            const resolved = resolveSelectionRef(slots.selectionRef, candidates);
            if (resolved) {
                console.log(`✅ Selection resolved to workoutId ${resolved.id}`);
                return {
                    slots: { ...slots, workoutId: resolved.id, selectionRef: undefined },
                    workoutCandidates: undefined,
                    missingSlots: [],
                };
            }
            console.log(`⚠️  Selection "${slots.selectionRef}" did not match any candidate`);
            return {
                slots: { ...slots, selectionRef: undefined },
                missingSlots: ['workout_selection'],
            };
        }

        if (slots.muscleGroups && slots.muscleGroups.length > 0) {
            try {
                const matches = await workoutService.findWorkoutsByMuscleGroups(
                    userId,
                    slots.muscleGroups,
                );
                console.log(`📊 Found ${matches.length} workouts matching ${slots.muscleGroups.join(', ')}`);

                if (matches.length === 0) {
                    return {
                        actionSuccess: false,
                        actionError: 'no_match',
                        workoutCandidates: undefined,
                    };
                }

                if (matches.length === 1) {
                    return {
                        slots: { ...slots, workoutId: matches[0]!.id },
                        workoutCandidates: undefined,
                        missingSlots: [],
                    };
                }

                if (state.intent === 'get_workout') {
                    return {
                        actionSuccess: true,
                        actionData: { matches, filterMuscleGroups: slots.muscleGroups },
                        workoutCandidates: undefined,
                    };
                }

                return {
                    workoutCandidates: matches.map(m => ({
                        id: m.id,
                        name: m.name,
                        goal: m.goal,
                        difficulty: m.difficulty,
                        muscleGroups: m.muscleGroups,
                    })),
                    missingSlots: ['workout_selection'],
                };
            } catch (error) {
                console.error('❌ Error in resolveWorkoutNode:', error);
                return {
                    actionSuccess: false,
                    actionError: error instanceof Error ? error.message : 'Workout lookup failed',
                };
            }
        }

        return { missingSlots: ['workout_reference'] };
    };
}
