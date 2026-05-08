import type { WorkoutRepository } from '../../ports/WorkoutRepository.ts';

export interface DeleteWorkoutInput {
    workoutId: number;
    userId: number;
}

export class DeleteWorkoutUseCase {
    private readonly workoutRepository: WorkoutRepository;
    constructor(workoutRepository: WorkoutRepository) { this.workoutRepository = workoutRepository; }

    async execute(input: DeleteWorkoutInput): Promise<{ deletedWorkoutId: number }> {
        await this.workoutRepository.delete(input.workoutId, input.userId);
        return { deletedWorkoutId: input.workoutId };
    }
}
