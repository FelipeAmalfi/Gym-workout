import { z } from 'zod/v3';
import { WorkoutService } from '../../services/workoutService.ts';
import type { GraphState } from '../graph.ts';

const GetWorkoutSlotsSchema = z.object({
    workoutId: z.number({ required_error: 'Workout ID is required' }),
});

export function createGetWorkoutNode(workoutService: WorkoutService) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        console.log('📋 Getting workout...');

        try {
            const validation = GetWorkoutSlotsSchema.safeParse(state.slots);

            if (!validation.success) {
                const errors = validation.error.errors.map(e => e.message).join(', ');
                console.log(`⚠️  Validation failed: ${errors}`);
                return { actionSuccess: false, actionError: errors };
            }

            const workout = await workoutService.getWorkoutWithExercises(validation.data.workoutId);
            console.log(`✅ Workout retrieved: ${workout.name} (ID ${workout.id})`);

            return { actionSuccess: true, actionData: workout };
        } catch (error) {
            console.error('❌ Error in getWorkoutNode:', error);
            return {
                actionSuccess: false,
                actionError: error instanceof Error ? error.message : 'Workout retrieval failed',
            };
        }
    };
}
