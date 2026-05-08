import Fastify, { type FastifyInstance } from 'fastify';
import { registerErrorHandler } from './errorHandler.ts';
import { healthRoute } from './health.ts';
import { chatController } from './controllers/ChatController.ts';
import { workoutController } from './controllers/WorkoutController.ts';
import type { Container } from '../../composition/container.ts';

export function createServer(container: Container): FastifyInstance {
    const app = Fastify({ logger: true });

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
