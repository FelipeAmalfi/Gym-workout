import Fastify from 'fastify';
import { HumanMessage } from 'langchain';
import { buildGraph } from './graph/factory.ts';
import { WorkoutService } from './services/workoutService.ts';
import { pool } from './db/client.ts';

const graph = buildGraph();
const workoutService = new WorkoutService(pool);

export const createServer = () => {
    const app = Fastify({ logger: true });

    app.post('/chat', {
        schema: {
            body: {
                type: 'object',
                required: ['message', 'thread_id'],
                properties: {
                    message: { type: 'string', minLength: 2 },
                    thread_id: { type: 'string' },
                    user_id: { type: 'number' },
                },
            },
        },
    }, async (request, reply) => {
        const { message, thread_id, user_id } = request.body as {
            message: string;
            thread_id: string;
            user_id?: number;
        };

        try {
            const response = await graph.invoke(
                {
                    messages: [new HumanMessage(message)],
                    slots: user_id ? { userId: user_id } : undefined,
                },
                {
                    configurable: { thread_id },
                },
            );

            const lastMessage = response.messages.at(-1);
            return {
                reply: typeof lastMessage?.content === 'string'
                    ? lastMessage.content
                    : JSON.stringify(lastMessage?.content),
                intent: response.intent,
                missingSlots: response.missingSlots,
                actionSuccess: response.actionSuccess,
                actionData: response.actionData,
            };
        } catch (error) {
            app.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    app.get('/workouts', async (request, reply) => {
        const { user_id } = request.query as { user_id?: string };
        if (!user_id) return reply.status(400).send({ error: 'user_id query param is required' });

        try {
            return await workoutService.listWorkouts(Number(user_id));
        } catch (error) {
            app.log.error(error);
            return reply.status(500).send({ error: 'Failed to list workouts' });
        }
    });

    app.post('/workouts', async (request, reply) => {
        const body = request.body as {
            userId: number;
            name: string;
            goal?: string;
            difficulty?: string;
            exerciseIds: number[];
        };

        try {
            return await workoutService.createWorkout(body);
        } catch (error) {
            app.log.error(error);
            return reply.status(500).send({ error: 'Failed to create workout' });
        }
    });

    app.put('/workouts/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const patches = request.body as {
            name?: string;
            goal?: string;
            difficulty?: string;
            description?: string;
        };

        try {
            return await workoutService.updateWorkout(Number(id), patches);
        } catch (error) {
            app.log.error(error);
            return reply.status(500).send({ error: 'Failed to update workout' });
        }
    });

    app.delete('/workouts/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { user_id } = request.query as { user_id?: string };

        if (!user_id) return reply.status(400).send({ error: 'user_id query param is required' });

        try {
            await workoutService.deleteWorkout(Number(id), Number(user_id));
            return { success: true, deletedWorkoutId: Number(id) };
        } catch (error) {
            app.log.error(error);
            return reply.status(500).send({ error: 'Failed to delete workout' });
        }
    });

    return app;
};
