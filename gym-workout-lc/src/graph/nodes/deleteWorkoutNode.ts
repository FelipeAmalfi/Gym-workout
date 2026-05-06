import { z } from 'zod/v3';
import { WorkoutService } from '../../services/workoutService.ts';
import type { GraphState } from '../graph.ts';

const DeleteWorkoutSlotsSchema = z.object({
    workoutId: z.number({ required_error: 'Workout ID is required' }),
    userId: z.number().default(1),
});

export function createDeleteWorkoutNode(workoutService: WorkoutService) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        console.log('🗑️  Deleting workout...');

        try {
            const validation = DeleteWorkoutSlotsSchema.safeParse({
                ...state.slots,
                userId: state.slots?.userId ?? 1,
            });

            if (!validation.success) {
                const errors = validation.error.errors.map(e => e.message).join(', ');
                console.log(`⚠️  Validation failed: ${errors}`);
                return { actionSuccess: false, actionError: errors };
            }

            const { workoutId, userId } = validation.data;
            await workoutService.deleteWorkout(workoutId, userId);
            console.log(`✅ Workout deleted: ID ${workoutId}`);

            return { actionSuccess: true, actionData: { deletedWorkoutId: workoutId } };
        } catch (error) {
            console.error('❌ Error in deleteWorkoutNode:', error);
            return {
                actionSuccess: false,
                actionError: error instanceof Error ? error.message : 'Workout deletion failed',
            };
        }
    };
}
