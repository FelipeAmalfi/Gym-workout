import type { ResolveWorkoutReferenceUseCase } from '../../../core/application/use-cases/workout/ResolveWorkoutReferenceUseCase.ts';
import { getUserContext, getWorkflow, type GraphState } from '../state.ts';

export function createResolveWorkoutNode(resolveWorkoutReference: ResolveWorkoutReferenceUseCase) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const workflow = getWorkflow(state);
        const slots = workflow.slots;
        const userId = getUserContext(state).userId ?? slots.userId;

        if (userId == null) {
            return { workflow: { ...workflow, missingSlots: ['cpf'] } };
        }

        const intent = workflow.intent;
        if (intent !== 'update_workout' && intent !== 'delete_workout' && intent !== 'get_workout') {
            return { workflow: { ...workflow, missingSlots: ['workout_reference'] } };
        }

        try {
            const result = await resolveWorkoutReference.execute({
                userId,
                workoutId: slots.workoutId,
                muscleGroups: slots.muscleGroups,
                selectionRef: slots.selectionRef,
                candidates: workflow.workoutCandidates?.map((c) => ({
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
                        workflow: {
                            ...workflow,
                            slots: { ...slots, workoutId: result.workoutId, selectionRef: undefined },
                            workoutCandidates: undefined,
                            missingSlots: [],
                        },
                    };

                case 'multiple':
                    return {
                        workflow: {
                            ...workflow,
                            workoutCandidates: result.candidates,
                            missingSlots: ['workout_selection'],
                        },
                    };

                case 'matches_for_get':
                    return {
                        workflow: { ...workflow, workoutCandidates: undefined },
                        turn: {
                            actionSuccess: true,
                            actionData: {
                                matches: result.matches,
                                filterMuscleGroups: result.filterMuscleGroups,
                            },
                        },
                    };

                case 'no_match':
                    return {
                        workflow: { ...workflow, workoutCandidates: undefined },
                        turn: { actionSuccess: false, actionError: 'no_match' },
                    };

                case 'invalid_selection':
                    return {
                        workflow: {
                            ...workflow,
                            slots: { ...slots, selectionRef: undefined },
                            missingSlots: ['workout_selection'],
                        },
                    };

                case 'needs_reference':
                default:
                    return { workflow: { ...workflow, missingSlots: ['workout_reference'] } };
            }
        } catch (error) {
            return {
                turn: {
                    actionSuccess: false,
                    actionError: error instanceof Error ? error.message : 'Workout lookup failed',
                },
            };
        }
    };
}
