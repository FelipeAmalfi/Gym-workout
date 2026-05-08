import type { ListWorkoutsUseCase } from '../../../core/application/use-cases/workout/ListWorkoutsUseCase.ts';
import type { GraphState } from '../state.ts';

export function createListWorkoutsNode(listWorkouts: ListWorkoutsUseCase) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const slots = state.slots ?? {};
        const userId = slots.userId;

        if (userId == null) {
            return { actionSuccess: false, actionError: 'missing_user' };
        }

        try {
            const result = await listWorkouts.execute({
                userId,
                muscleGroups: slots.muscleGroups,
            });

            switch (result.kind) {
                case 'empty':
                    return {
                        actionSuccess: false,
                        actionError: 'no_match',
                        workoutCandidates: undefined,
                    };

                case 'single':
                    return {
                        actionSuccess: true,
                        actionData: { single: result.workout, filterMuscleGroups: result.filterMuscleGroups },
                        workoutCandidates: undefined,
                    };

                case 'multiple':
                    return {
                        actionSuccess: true,
                        actionData: {
                            multiple: result.candidates,
                            filterMuscleGroups: result.filterMuscleGroups,
                        },
                        workoutCandidates: result.candidates,
                    };
            }
        } catch (error) {
            return {
                actionSuccess: false,
                actionError: error instanceof Error ? error.message : 'Listing workouts failed',
            };
        }
    };
}
