import type { DeleteWorkoutUseCase } from '../../../core/application/use-cases/workout/DeleteWorkoutUseCase.ts';
import { getUserContext, getWorkflow, type GraphState } from '../state.ts';

export function createDeleteWorkoutNode(deleteWorkout: DeleteWorkoutUseCase) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const workflow = getWorkflow(state);
        const userId = getUserContext(state).userId ?? workflow.slots.userId;
        const { slots } = workflow;
        if (slots.workoutId == null || userId == null) {
            return { turn: { actionSuccess: false, actionError: 'Workout ID is required' } };
        }

        try {
            const result = await deleteWorkout.execute({
                workoutId: slots.workoutId,
                userId,
            });
            return { turn: { actionSuccess: true, actionData: result } };
        } catch (error) {
            return {
                turn: {
                    actionSuccess: false,
                    actionError: error instanceof Error ? error.message : 'Workout deletion failed',
                },
            };
        }
    };
}
