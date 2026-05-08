import type { ResolveWorkoutReferenceUseCase } from '../../../core/application/use-cases/workout/ResolveWorkoutReferenceUseCase.ts';
import type { GraphState } from '../state.ts';

export function createResolveWorkoutNode(resolveWorkoutReference: ResolveWorkoutReferenceUseCase) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const slots = state.slots ?? {};
        const userId = slots.userId;

        if (userId == null) {
            return { missingSlots: ['cpf'] };
        }

        const intent = state.intent;
        if (intent !== 'update_workout' && intent !== 'delete_workout' && intent !== 'get_workout') {
            return { missingSlots: ['workout_reference'] };
        }

        try {
            const result = await resolveWorkoutReference.execute({
                userId,
                workoutId: slots.workoutId,
                muscleGroups: slots.muscleGroups,
                selectionRef: slots.selectionRef,
                candidates: state.workoutCandidates?.map((c) => ({
                    id: c.id,
                    name: c.name,
                    goal: c.goal ?? null,
                    difficulty: c.difficulty ?? null,
                    muscleGroups: c.muscleGroups,
                })),
                intent,
            });

            switch (result.kind) {
                case 'resolved':
                    return {
                        slots: { ...slots, workoutId: result.workoutId, selectionRef: undefined },
                        workoutCandidates: undefined,
                        missingSlots: [],
                    };

                case 'multiple':
                    return {
                        workoutCandidates: result.candidates,
                        missingSlots: ['workout_selection'],
                    };

                case 'matches_for_get':
                    return {
                        actionSuccess: true,
                        actionData: {
                            matches: result.matches,
                            filterMuscleGroups: result.filterMuscleGroups,
                        },
                        workoutCandidates: undefined,
                    };

                case 'no_match':
                    return {
                        actionSuccess: false,
                        actionError: 'no_match',
                        workoutCandidates: undefined,
                    };

                case 'invalid_selection':
                    return {
                        slots: { ...slots, selectionRef: undefined },
                        missingSlots: ['workout_selection'],
                    };

                case 'needs_reference':
                default:
                    return { missingSlots: ['workout_reference'] };
            }
        } catch (error) {
            return {
                actionSuccess: false,
                actionError: error instanceof Error ? error.message : 'Workout lookup failed',
            };
        }
    };
}
