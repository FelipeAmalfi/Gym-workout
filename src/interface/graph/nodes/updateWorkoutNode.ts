import type { UpdateWorkoutUseCase } from '../../../core/application/use-cases/workout/UpdateWorkoutUseCase.ts';
import type { GraphState } from '../state.ts';

export function createUpdateWorkoutNode(updateWorkout: UpdateWorkoutUseCase) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const slots = state.slots ?? {};
        if (slots.workoutId == null || slots.userId == null) {
            return { actionSuccess: false, actionError: 'Workout ID is required' };
        }

        try {
            const workout = await updateWorkout.execute({
                workoutId: slots.workoutId,
                userId: slots.userId,
                name: slots.workoutName,
                goal: slots.goal,
                difficulty: slots.difficulty,
            });
            return { actionSuccess: true, actionData: workout };
        } catch (error) {
            return {
                actionSuccess: false,
                actionError: error instanceof Error ? error.message : 'Workout update failed',
            };
        }
    };
}
