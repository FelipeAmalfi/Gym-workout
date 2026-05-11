import type { FastifyInstance } from 'fastify';

export interface ChatBody {
    reply: string;
    intent: string;
    missingSlots?: string[];
    actionSuccess?: boolean;
    actionData?: unknown;
    user?: { id?: number; name?: string };
}

export async function chat(
    app: FastifyInstance,
    message: string,
    threadId: string,
    userId?: number,
): Promise<{ status: number; body: ChatBody }> {
    const res = await app.inject({
        method: 'POST',
        url: '/chat',
        payload: { message, thread_id: threadId, user_id: userId },
    });
    return { status: res.statusCode, body: JSON.parse(res.body) as ChatBody };
}

let counter = 0;
export function newThreadId(prefix = 't'): string {
    counter += 1;
    return `${prefix}-${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}
