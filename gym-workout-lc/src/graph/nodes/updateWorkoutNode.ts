import { z } from 'zod/v3';
import { WorkoutService } from '../../services/workoutService.ts';
import type { GraphState } from '../graph.ts';

const UpdateWorkoutSlotsSchema = z.object({
    workoutId: z.number({ required_error: 'Workout ID is required' }),
    workoutName: z.string().optional(),
    goal: z.string().optional(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Expert']).optional(),
});

export function createUpdateWorkoutNode(workoutService: WorkoutService) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        console.log('✏️  Updating workout...');

        try {
            const validation = UpdateWorkoutSlotsSchema.safeParse(state.slots);

            if (!validation.success) {
                const errors = validation.error.errors.map(e => e.message).join(', ');
                console.log(`⚠️  Validation failed: ${errors}`);
                return { actionSuccess: false, actionError: errors };
            }

            const { workoutId, ...patches } = validation.data;
            const filledPatches = Object.fromEntries(
                Object.entries(patches).filter(([, v]) => v !== undefined),
            ) as { name?: string; goal?: string; difficulty?: string };

            if (patches.workoutName) {
                (filledPatches as Record<string, unknown>)['name'] = patches.workoutName;
                delete (filledPatches as Record<string, unknown>)['workoutName'];
            }

            const workout = await workoutService.updateWorkout(workoutId, filledPatches);
            console.log(`✅ Workout updated: ID ${workout.id}`);

            return { actionSuccess: true, actionData: workout };
        } catch (error) {
            console.error('❌ Error in updateWorkoutNode:', error);
            return {
                actionSuccess: false,
                actionError: error instanceof Error ? error.message : 'Workout update failed',
            };
        }
    };
}
