import type pg from 'pg';
import { MemorySaver } from '@langchain/langgraph';

import { loadEnv, type Env } from '../shared/config/env.ts';
import { buildModelConfig } from '../shared/config/modelConfig.ts';
import { createPool } from '../infrastructure/database/pgPool.ts';
import { PgUserRepository } from '../infrastructure/database/repositories/PgUserRepository.ts';
import { PgUserProfileRepository } from '../infrastructure/database/repositories/PgUserProfileRepository.ts';
import { PgWorkoutRepository } from '../infrastructure/database/repositories/PgWorkoutRepository.ts';
import { OpenRouterLlmAdapter } from '../infrastructure/llm/OpenRouterLlmAdapter.ts';
import { PgVectorExerciseRetriever } from '../infrastructure/vector/PgVectorExerciseRetriever.ts';

import { ClassifyIntentUseCase } from '../core/application/use-cases/chat/ClassifyIntentUseCase.ts';
import { GenerateMessageUseCase } from '../core/application/use-cases/chat/GenerateMessageUseCase.ts';
import { SummarizeConversationUseCase } from '../core/application/use-cases/chat/SummarizeConversationUseCase.ts';
import { ResolveUserByCpfUseCase } from '../core/application/use-cases/user/ResolveUserByCpfUseCase.ts';
import { LoadUserProfileUseCase } from '../core/application/use-cases/user/LoadUserProfileUseCase.ts';
import { UpdateUserProfileUseCase } from '../core/application/use-cases/user/UpdateUserProfileUseCase.ts';
import { CreateWorkoutUseCase } from '../core/application/use-cases/workout/CreateWorkoutUseCase.ts';
import { GetWorkoutUseCase } from '../core/application/use-cases/workout/GetWorkoutUseCase.ts';
import { UpdateWorkoutUseCase } from '../core/application/use-cases/workout/UpdateWorkoutUseCase.ts';
import { DeleteWorkoutUseCase } from '../core/application/use-cases/workout/DeleteWorkoutUseCase.ts';
import { ListWorkoutsUseCase } from '../core/application/use-cases/workout/ListWorkoutsUseCase.ts';
import { ResolveWorkoutReferenceUseCase } from '../core/application/use-cases/workout/ResolveWorkoutReferenceUseCase.ts';

import type { UserRepository } from '../core/application/ports/UserRepository.ts';
import type { UserProfileRepository } from '../core/application/ports/UserProfileRepository.ts';
import type { WorkoutRepository } from '../core/application/ports/WorkoutRepository.ts';
import type { ExerciseRetriever } from '../core/application/ports/ExerciseRetriever.ts';
import type { LlmPort } from '../core/application/ports/LlmPort.ts';

import { buildWorkoutGraph } from '../interface/graph/builder.ts';
import type { GraphDependencies } from '../interface/graph/dependencies.ts';

export interface Container {
    env: Env;
    pool: pg.Pool;
    llm: LlmPort;
    userRepository: UserRepository;
    userProfileRepository: UserProfileRepository;
    workoutRepository: WorkoutRepository;
    exerciseRetriever: ExerciseRetriever;
    useCases: GraphDependencies;
    graph: ReturnType<typeof buildWorkoutGraph>;
}

export function buildContainer(envOverride?: Env): Container {
    const env = envOverride ?? loadEnv();
    const modelConfig = buildModelConfig(env);

    const pool = createPool(env);

    const userRepository = new PgUserRepository(pool);
    const userProfileRepository = new PgUserProfileRepository(pool);
    const workoutRepository = new PgWorkoutRepository(pool);
    const exerciseRetriever = new PgVectorExerciseRetriever(pool, modelConfig);
    const llm = new OpenRouterLlmAdapter(modelConfig);

    const useCases: GraphDependencies = {
        classifyIntent: new ClassifyIntentUseCase(llm),
        generateMessage: new GenerateMessageUseCase(llm),
        summarizeConversation: new SummarizeConversationUseCase(llm),
        resolveUserByCpf: new ResolveUserByCpfUseCase(userRepository),
        loadUserProfile: new LoadUserProfileUseCase(userProfileRepository),
        updateUserProfile: new UpdateUserProfileUseCase(userProfileRepository),
        createWorkout: new CreateWorkoutUseCase(workoutRepository, exerciseRetriever),
        getWorkout: new GetWorkoutUseCase(workoutRepository),
        updateWorkout: new UpdateWorkoutUseCase(workoutRepository),
        deleteWorkout: new DeleteWorkoutUseCase(workoutRepository),
        listWorkouts: new ListWorkoutsUseCase(workoutRepository),
        resolveWorkoutReference: new ResolveWorkoutReferenceUseCase(workoutRepository),
    };

    const checkpointer = new MemorySaver();
    const graph = buildWorkoutGraph(useCases, checkpointer);

    return {
        env,
        pool,
        llm,
        userRepository,
        userProfileRepository,
        workoutRepository,
        exerciseRetriever,
        useCases,
        graph,
    };
}
