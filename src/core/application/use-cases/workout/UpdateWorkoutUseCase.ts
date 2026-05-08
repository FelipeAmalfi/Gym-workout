import type { WorkoutRepository, UpdateWorkoutData } from '../../ports/WorkoutRepository.ts';
import type { Workout } from '../../../domain/entities/Workout.ts';
import { AuthorizationError, NotFoundError, ValidationError } from '../../../domain/errors/AppError.ts';

export interface UpdateWorkoutInput {
    workoutId: number;
    userId: number;
    name?: string;
    goal?: string;
    difficulty?: string;
    description?: string;
}

export class UpdateWorkoutUseCase {
    private readonly workoutRepository: WorkoutRepository;
    constructor(workoutRepository: WorkoutRepository) { this.workoutRepository = workoutRepository; }

    async execute(input: UpdateWorkoutInput): Promise<Workout> {
        const existing = await this.workoutRepository.findById(input.workoutId);
        if (!existing) throw new NotFoundError(`Workout ${input.workoutId} not found`);
        if (existing.userId !== input.userId) {
            throw new AuthorizationError('You do not have access to this workout');
        }

        const patches: UpdateWorkoutData = {};
        if (input.name !== undefined) patches.name = input.name;
        if (input.goal !== undefined) patches.goal = input.goal;
        if (input.difficulty !== undefined) patches.difficulty = input.difficulty;
        if (input.description !== undefined) patches.description = input.description;

        if (Object.keys(patches).length === 0) {
            throw new ValidationError('No fields to update');
        }

        return this.workoutRepository.update(input.workoutId, patches);
    }
}
