import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
    ListWorkoutsQuerySchema,
    CreateWorkoutBodySchema,
    UpdateWorkoutBodySchema,
    DeleteWorkoutQuerySchema,
    WorkoutIdParamsSchema,
} from '../schemas/workoutSchemas.ts';
import type { WorkoutRepository } from '../../../core/application/ports/WorkoutRepository.ts';
import type { UpdateWorkoutUseCase } from '../../../core/application/use-cases/workout/UpdateWorkoutUseCase.ts';
import type { DeleteWorkoutUseCase } from '../../../core/application/use-cases/workout/DeleteWorkoutUseCase.ts';

export interface WorkoutControllerDeps {
    workoutRepository: WorkoutRepository;
    updateWorkout: UpdateWorkoutUseCase;
    deleteWorkout: DeleteWorkoutUseCase;
}

export function workoutController(deps: WorkoutControllerDeps): FastifyPluginAsync {
    return async (app: FastifyInstance) => {
        app.get('/workouts', async (request) => {
            const { user_id } = ListWorkoutsQuerySchema.parse(request.query);
            return deps.workoutRepository.findByUserId(user_id);
        });

        app.post('/workouts', async (request, reply) => {
            const body = CreateWorkoutBodySchema.parse(request.body);
            const workout = await deps.workoutRepository.create({
                userId: body.userId,
                name: body.name,
                goal: body.goal ?? null,
                difficulty: body.difficulty ?? null,
                description: body.description ?? null,
                exerciseIds: body.exerciseIds,
            });
            return reply.status(201).send(workout);
        });

        app.put('/workouts/:id', async (request) => {
            const { id } = WorkoutIdParamsSchema.parse(request.params);
            const body = UpdateWorkoutBodySchema.parse(request.body);

            return deps.updateWorkout.execute({
                workoutId: id,
                userId: body.userId,
                name: body.name,
                goal: body.goal,
                difficulty: body.difficulty,
                description: body.description,
            });
        });

        app.delete('/workouts/:id', async (request) => {
            const { id } = WorkoutIdParamsSchema.parse(request.params);
            const { user_id } = DeleteWorkoutQuerySchema.parse(request.query);

            return deps.deleteWorkout.execute({ workoutId: id, userId: user_id });
        });
    };
}
