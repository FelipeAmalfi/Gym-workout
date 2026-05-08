import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { HumanMessage } from 'langchain';
import { ChatBodySchema } from '../schemas/workoutSchemas.ts';
import type { buildWorkoutGraph } from '../../graph/builder.ts';

export interface ChatControllerDeps {
    graph: ReturnType<typeof buildWorkoutGraph>;
}

export function chatController(deps: ChatControllerDeps): FastifyPluginAsync {
    return async (app: FastifyInstance) => {
        app.post('/chat', async (request) => {
            const body = ChatBodySchema.parse(request.body);

            const response = await deps.graph.invoke(
                {
                    messages: [new HumanMessage(body.message)],
                    slots: body.user_id ? { userId: body.user_id } : undefined,
                },
                { configurable: { thread_id: body.thread_id } },
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
        });
    };
}
