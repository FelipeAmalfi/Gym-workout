import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { registerErrorHandler } from './errorHandler.ts';
import { healthRoute } from './health.ts';
import { chatController } from './controllers/ChatController.ts';
import { workoutController } from './controllers/WorkoutController.ts';
import type { Container } from '../../composition/container.ts';

export async function createServer(container: Container): Promise<FastifyInstance> {
    const app = Fastify({ logger: true });

    await app.register(cors, {
        origin: process.env.FRONTEND_URL ?? true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    });

    registerErrorHandler(app);

    app.register(healthRoute);
    app.register(chatController({ graph: container.graph }));
    app.register(
        workoutController({
            workoutRepository: container.workoutRepository,
            updateWorkout: container.useCases.updateWorkout,
            deleteWorkout: container.useCases.deleteWorkout,
        }),
    );

    return app;
}
