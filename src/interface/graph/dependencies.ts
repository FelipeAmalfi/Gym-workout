import type { ClassifyIntentUseCase } from '../../core/application/use-cases/chat/ClassifyIntentUseCase.ts';
import type { GenerateMessageUseCase } from '../../core/application/use-cases/chat/GenerateMessageUseCase.ts';
import type { ResolveUserByCpfUseCase } from '../../core/application/use-cases/user/ResolveUserByCpfUseCase.ts';
import type { CreateWorkoutUseCase } from '../../core/application/use-cases/workout/CreateWorkoutUseCase.ts';
import type { GetWorkoutUseCase } from '../../core/application/use-cases/workout/GetWorkoutUseCase.ts';
import type { UpdateWorkoutUseCase } from '../../core/application/use-cases/workout/UpdateWorkoutUseCase.ts';
import type { DeleteWorkoutUseCase } from '../../core/application/use-cases/workout/DeleteWorkoutUseCase.ts';
import type { ListWorkoutsUseCase } from '../../core/application/use-cases/workout/ListWorkoutsUseCase.ts';
import type { ResolveWorkoutReferenceUseCase } from '../../core/application/use-cases/workout/ResolveWorkoutReferenceUseCase.ts';

export interface GraphDependencies {
    classifyIntent: ClassifyIntentUseCase;
    generateMessage: GenerateMessageUseCase;
    resolveUserByCpf: ResolveUserByCpfUseCase;
    createWorkout: CreateWorkoutUseCase;
    getWorkout: GetWorkoutUseCase;
    updateWorkout: UpdateWorkoutUseCase;
    deleteWorkout: DeleteWorkoutUseCase;
    listWorkouts: ListWorkoutsUseCase;
    resolveWorkoutReference: ResolveWorkoutReferenceUseCase;
}
