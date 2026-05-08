import type { GetWorkoutUseCase } from '../../../core/application/use-cases/workout/GetWorkoutUseCase.ts';
import type { GraphState } from '../state.ts';

export function createGetWorkoutNode(getWorkout: GetWorkoutUseCase) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const slots = state.slots ?? {};
        if (slots.workoutId == null || slots.userId == null) {
            return { actionSuccess: false, actionError: 'Workout ID is required' };
        }

        try {
            const workout = await getWorkout.execute({
                workoutId: slots.workoutId,
                userId: slots.userId,
            });
            return { actionSuccess: true, actionData: workout };
        } catch (error) {
            return {
                actionSuccess: false,
                actionError: error instanceof Error ? error.message : 'Workout retrieval failed',
            };
        }
    };
}
