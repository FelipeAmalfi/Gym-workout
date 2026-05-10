import type { UpdateWorkoutUseCase } from '../../../core/application/use-cases/workout/UpdateWorkoutUseCase.ts';
import { getUserContext, getWorkflow, type GraphState } from '../state.ts';

export function createUpdateWorkoutNode(updateWorkout: UpdateWorkoutUseCase) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const workflow = getWorkflow(state);
        const userId = getUserContext(state).userId ?? workflow.slots.userId;
        const { slots } = workflow;
        if (slots.workoutId == null || userId == null) {
            return { turn: { actionSuccess: false, actionError: 'Workout ID is required' } };
        }

        try {
            const workout = await updateWorkout.execute({
                workoutId: slots.workoutId,
                userId,
                name: slots.workoutName,
                goal: slots.goal,
                difficulty: slots.difficulty,
            });
            return { turn: { actionSuccess: true, actionData: workout } };
        } catch (error) {
            return {
                turn: {
                    actionSuccess: false,
                    actionError: error instanceof Error ? error.message : 'Workout update failed',
                },
            };
        }
    };
}
