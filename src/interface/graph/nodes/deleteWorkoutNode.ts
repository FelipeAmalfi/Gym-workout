import type { DeleteWorkoutUseCase } from '../../../core/application/use-cases/workout/DeleteWorkoutUseCase.ts';
import type { GraphState } from '../state.ts';

export function createDeleteWorkoutNode(deleteWorkout: DeleteWorkoutUseCase) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const slots = state.slots ?? {};
        if (slots.workoutId == null || slots.userId == null) {
            return { actionSuccess: false, actionError: 'Workout ID is required' };
        }

        try {
            const result = await deleteWorkout.execute({
                workoutId: slots.workoutId,
                userId: slots.userId,
            });
            return { actionSuccess: true, actionData: result };
        } catch (error) {
            return {
                actionSuccess: false,
                actionError: error instanceof Error ? error.message : 'Workout deletion failed',
            };
        }
    };
}
