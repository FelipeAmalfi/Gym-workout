import { WorkoutService } from '../../services/workoutService.ts';
import type { GraphState } from '../graph.ts';

export function createListWorkoutsNode(workoutService: WorkoutService) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        console.log('📃 Listing workouts...');

        try {
            const userId = state.slots?.userId ?? 1;
            const workouts = await workoutService.listWorkouts(userId);
            console.log(`✅ Found ${workouts.length} workouts for user ${userId}`);

            return { actionSuccess: true, actionData: workouts };
        } catch (error) {
            console.error('❌ Error in listWorkoutsNode:', error);
            return {
                actionSuccess: false,
                actionError: error instanceof Error ? error.message : 'Listing workouts failed',
            };
        }
    };
}
