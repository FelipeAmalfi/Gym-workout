import type { ListWorkoutsUseCase } from '../../../core/application/use-cases/workout/ListWorkoutsUseCase.ts';
import { getUserContext, getWorkflow, type GraphState } from '../state.ts';

export function createListWorkoutsNode(listWorkouts: ListWorkoutsUseCase) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const workflow = getWorkflow(state);
        const userId = getUserContext(state).userId ?? workflow.slots.userId;

        if (userId == null) {
            return { turn: { actionSuccess: false, actionError: 'missing_user' } };
        }

        try {
            const result = await listWorkouts.execute({
                userId,
                muscleGroups: workflow.slots.muscleGroups,
            });

            switch (result.kind) {
                case 'empty':
                    return {
                        workflow: { ...workflow, workoutCandidates: undefined },
                        turn: { actionSuccess: false, actionError: 'no_match' },
                    };

                case 'single':
                    return {
                        workflow: { ...workflow, workoutCandidates: undefined },
                        turn: {
                            actionSuccess: true,
                            actionData: { single: result.workout, filterMuscleGroups: result.filterMuscleGroups },
                        },
                    };

                case 'multiple':
                    return {
                        workflow: { ...workflow, workoutCandidates: result.candidates },
                        turn: {
                            actionSuccess: true,
                            actionData: {
                                multiple: result.candidates,
                                filterMuscleGroups: result.filterMuscleGroups,
                            },
                        },
                    };
            }
        } catch (error) {
            return {
                turn: {
                    actionSuccess: false,
                    actionError: error instanceof Error ? error.message : 'Listing workouts failed',
                },
            };
        }
    };
}
