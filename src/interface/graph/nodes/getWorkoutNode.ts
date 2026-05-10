import type { GetWorkoutUseCase } from '../../../core/application/use-cases/workout/GetWorkoutUseCase.ts';
import { getUserContext, getWorkflow, type GraphState } from '../state.ts';

export function createGetWorkoutNode(getWorkout: GetWorkoutUseCase) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const workflow = getWorkflow(state);
        const userId = getUserContext(state).userId ?? workflow.slots.userId;
        const { slots } = workflow;
        if (slots.workoutId == null || userId == null) {
            return { turn: { actionSuccess: false, actionError: 'Workout ID is required' } };
        }

        try {
            const workout = await getWorkout.execute({
                workoutId: slots.workoutId,
                userId,
            });
            return { turn: { actionSuccess: true, actionData: workout } };
        } catch (error) {
            return {
                turn: {
                    actionSuccess: false,
                    actionError: error instanceof Error ? error.message : 'Workout retrieval failed',
                },
            };
        }
    };
}
