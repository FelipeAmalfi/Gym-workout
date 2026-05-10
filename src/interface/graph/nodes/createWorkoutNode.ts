import type { CreateWorkoutUseCase } from '../../../core/application/use-cases/workout/CreateWorkoutUseCase.ts';
import type { UpdateUserProfileUseCase } from '../../../core/application/use-cases/user/UpdateUserProfileUseCase.ts';
import { ValidationError, AppError } from '../../../core/domain/errors/AppError.ts';
import { getUserContext, getWorkflow, type GraphState } from '../state.ts';

export function createCreateWorkoutNode(
    createWorkout: CreateWorkoutUseCase,
    updateUserProfile: UpdateUserProfileUseCase,
) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const workflow = getWorkflow(state);
        const userContext = getUserContext(state);
        const slots = workflow.slots;
        const userId = userContext.userId ?? slots.userId;

        if (userId == null) {
            return { turn: { actionSuccess: false, actionError: 'missing_user' } };
        }

        const preferences = userContext.preferences;
        const muscleGroups = slots.muscleGroups ?? preferences?.preferredMuscles;
        const equipment = slots.equipment ?? preferences?.preferredEquipment;
        const difficulty = slots.difficulty ?? preferences?.preferredDifficulty;
        const numExercises = slots.numExercises ?? preferences?.defaultNumExercises;

        try {
            const { workout, retrievedExercises } = await createWorkout.execute({
                userId,
                workoutName: slots.workoutName,
                goal: slots.goal,
                muscleGroups,
                equipment,
                difficulty,
                difficultyByMuscle: slots.difficultyByMuscle,
                numExercises,
            });

            // Best-effort preference learning. Don't block the response on this.
            try {
                await updateUserProfile.execute(userId, {
                    preferredMuscles: muscleGroups,
                    preferredDifficulty: difficulty,
                    preferredEquipment: equipment,
                    defaultNumExercises: numExercises,
                });
            } catch {
                // ignore — preferences are non-critical
            }

            return {
                workflow: { ...workflow, workoutCandidates: undefined },
                turn: {
                    retrievedExercises,
                    actionSuccess: true,
                    actionData: workout,
                },
            };
        } catch (error) {
            const message = error instanceof AppError || error instanceof ValidationError
                ? error.message
                : error instanceof Error
                    ? error.message
                    : 'Workout creation failed';
            return { turn: { actionSuccess: false, actionError: message } };
        }
    };
}
