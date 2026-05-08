import type { WorkoutRepository } from '../../ports/WorkoutRepository.ts';
import type { WorkoutWithExercises } from '../../../domain/entities/Workout.ts';
import { AuthorizationError, NotFoundError } from '../../../domain/errors/AppError.ts';

export interface GetWorkoutInput {
    workoutId: number;
    userId: number;
}

export class GetWorkoutUseCase {
    private readonly workoutRepository: WorkoutRepository;
    constructor(workoutRepository: WorkoutRepository) { this.workoutRepository = workoutRepository; }

    async execute(input: GetWorkoutInput): Promise<WorkoutWithExercises> {
        const workout = await this.workoutRepository.findById(input.workoutId);
        if (!workout) throw new NotFoundError(`Workout ${input.workoutId} not found`);
        if (workout.userId !== input.userId) {
            throw new AuthorizationError('You do not have access to this workout');
        }
        return workout;
    }
}
