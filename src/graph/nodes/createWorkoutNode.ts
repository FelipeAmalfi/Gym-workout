import { z } from 'zod/v3';
import { WorkoutService } from '../../services/workoutService.ts';
import { RagService } from '../../services/ragService.ts';
import type { GraphState } from '../graph.ts';

const CreateWorkoutSlotsSchema = z.object({
    userId: z.number({ required_error: 'User ID is required' }),
    muscleGroups: z.array(z.string()).optional(),
    goal: z.string().optional(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Expert']).default('Intermediate'),
    equipment: z.array(z.string()).optional(),
    numExercises: z.number().default(5),
    workoutName: z.string().optional(),
});

export function createCreateWorkoutNode(workoutService: WorkoutService, ragService: RagService) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        console.log('🏋️  Creating workout...');

        try {
            const validation = CreateWorkoutSlotsSchema.safeParse({
                ...state.slots,
                userId: state.slots?.userId ?? 1,
            });

            if (!validation.success) {
                const errors = validation.error.errors.map(e => e.message).join(', ');
                console.log(`⚠️  Validation failed: ${errors}`);
                return { actionSuccess: false, actionError: errors };
            }

            const slots = validation.data;

            const exercises = await ragService.searchExercises({
                muscleGroups: slots.muscleGroups,
                equipment: slots.equipment,
                difficulty: slots.difficulty,
                limit: slots.numExercises,
            });

            if (exercises.length === 0) {
                return {
                    actionSuccess: false,
                    actionError: 'No exercises found matching your criteria. Try different muscle groups or equipment.',
                };
            }

            const workoutName = slots.workoutName
                ?? `${slots.difficulty} ${slots.muscleGroups?.join(' & ') ?? slots.goal ?? 'Full Body'} Workout`;

            const workout = await workoutService.createWorkout({
                userId: slots.userId,
                name: workoutName,
                goal: slots.goal,
                difficulty: slots.difficulty,
                exerciseIds: exercises.map(e => e.exerciseId),
            });

            console.log(`✅ Workout created: ${workout.name} (ID ${workout.id})`);

            return {
                retrievedExercises: exercises,
                actionSuccess: true,
                actionData: workout,
                workoutCandidates: undefined,
            };
        } catch (error) {
            console.error('❌ Error in createWorkoutNode:', error);
            return {
                actionSuccess: false,
                actionError: error instanceof Error ? error.message : 'Workout creation failed',
            };
        }
    };
}
