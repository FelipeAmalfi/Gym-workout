import type { CreateWorkoutUseCase } from '../../../core/application/use-cases/workout/CreateWorkoutUseCase.ts';
import { ValidationError, AppError } from '../../../core/domain/errors/AppError.ts';
import type { GraphState } from '../state.ts';

export function createCreateWorkoutNode(createWorkout: CreateWorkoutUseCase) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const slots = state.slots ?? {};
        const userId = slots.userId;

        if (userId == null) {
            return { actionSuccess: false, actionError: 'missing_user' };
        }

        try {
            const { workout, retrievedExercises } = await createWorkout.execute({
                userId,
                workoutName: slots.workoutName,
                goal: slots.goal,
                muscleGroups: slots.muscleGroups,
                equipment: slots.equipment,
                difficulty: slots.difficulty,
                numExercises: slots.numExercises,
            });

            return {
                retrievedExercises,
                actionSuccess: true,
                actionData: workout,
                workoutCandidates: undefined,
            };
        } catch (error) {
            const message = error instanceof AppError || error instanceof ValidationError
                ? error.message
                : error instanceof Error
                    ? error.message
                    : 'Workout creation failed';
            return { actionSuccess: false, actionError: message };
        }
    };
}
