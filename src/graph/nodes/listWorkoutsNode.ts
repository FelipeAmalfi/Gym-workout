import { WorkoutService } from '../../services/workoutService.ts';
import type { GraphState } from '../graph.ts';

export function createListWorkoutsNode(workoutService: WorkoutService) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        console.log('📃 Listing workouts...');

        try {
            const userId = state.slots?.userId;
            if (userId == null) {
                return {
                    actionSuccess: false,
                    actionError: 'missing_user',
                };
            }

            const filterMuscleGroups = state.slots?.muscleGroups;
            const matches = filterMuscleGroups && filterMuscleGroups.length > 0
                ? await workoutService.findWorkoutsByMuscleGroups(userId, filterMuscleGroups)
                : (await workoutService.listWorkouts(userId)).map(w => ({ ...w, muscleGroups: [] as string[] }));

            console.log(`✅ Found ${matches.length} workouts for user ${userId}`);

            if (matches.length === 0) {
                return {
                    actionSuccess: false,
                    actionError: 'no_match',
                    workoutCandidates: undefined,
                };
            }

            if (matches.length === 1) {
                const full = await workoutService.getWorkoutWithExercises(matches[0]!.id);
                return {
                    actionSuccess: true,
                    actionData: { single: full, filterMuscleGroups },
                    workoutCandidates: undefined,
                };
            }

            const candidates = matches.map(m => ({
                id: m.id,
                name: m.name,
                goal: m.goal,
                difficulty: m.difficulty,
                muscleGroups: m.muscleGroups ?? [],
            }));

            return {
                actionSuccess: true,
                actionData: { multiple: candidates, filterMuscleGroups },
                workoutCandidates: candidates,
            };
        } catch (error) {
            console.error('❌ Error in listWorkoutsNode:', error);
            return {
                actionSuccess: false,
                actionError: error instanceof Error ? error.message : 'Listing workouts failed',
            };
        }
    };
}
