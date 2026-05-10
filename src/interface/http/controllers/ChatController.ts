import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { HumanMessage } from 'langchain';
import { ChatBodySchema } from '../schemas/workoutSchemas.ts';
import type { buildWorkoutGraph } from '../../graph/builder.ts';
import { getTurn, getUserContext, getWorkflow } from '../../graph/state.ts';

export interface ChatControllerDeps {
    graph: ReturnType<typeof buildWorkoutGraph>;
}

export function chatController(deps: ChatControllerDeps): FastifyPluginAsync {
    return async (app: FastifyInstance) => {
        app.post('/chat', async (request) => {
            const body = ChatBodySchema.parse(request.body);

            const initialState = body.user_id
                ? {
                      messages: [new HumanMessage(body.message)],
                      workflow: { slots: { userId: body.user_id }, missingSlots: [] },
                  }
                : { messages: [new HumanMessage(body.message)] };

            const response = await deps.graph.invoke(
                initialState,
                { configurable: { thread_id: body.thread_id } },
            );

            const lastMessage = response.messages.at(-1);
            const workflow = getWorkflow(response);
            const turn = getTurn(response);
            const userContext = getUserContext(response);
            return {
                reply: typeof lastMessage?.content === 'string'
                    ? lastMessage.content
                    : JSON.stringify(lastMessage?.content),
                intent: workflow.intent,
                missingSlots: workflow.missingSlots,
                actionSuccess: turn.actionSuccess,
                actionData: turn.actionData,
                user: userContext.isIdentified
                    ? { id: userContext.userId, name: userContext.userName }
                    : undefined,
            };
        });
    };
}
