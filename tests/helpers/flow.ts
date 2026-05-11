import type pg from 'pg';
import { HumanMessage } from '@langchain/core/messages';
import type { Container } from '../../src/composition/container.ts';
import { getTurn, getUserContext, getWorkflow, getConversation } from '../../src/interface/graph/state.ts';
import fixtureExercises from '../fixtures/exercises.json' with { type: 'json' };

export interface InvokeResult {
    reply: string;
    intent: string | undefined;
    missingSlots: string[];
    actionSuccess: boolean | undefined;
    actionData: unknown;
    userContext: ReturnType<typeof getUserContext>;
    conversation: ReturnType<typeof getConversation>;
    rawMessagesCount: number;
}

export async function invokeTurn(
    container: Container,
    message: string,
    threadId: string,
    userId?: number,
): Promise<InvokeResult> {
    const initialState = userId
        ? {
              messages: [new HumanMessage(message)],
              workflow: { slots: { userId }, missingSlots: [] as string[] },
          }
        : { messages: [new HumanMessage(message)] };

    const response = await container.graph.invoke(initialState, {
        configurable: { thread_id: threadId },
    });

    const last = response.messages.at(-1);
    const workflow = getWorkflow(response);
    const turn = getTurn(response);
    return {
        reply: typeof last?.content === 'string' ? last.content : JSON.stringify(last?.content),
        intent: workflow.intent,
        missingSlots: workflow.missingSlots,
        actionSuccess: turn.actionSuccess,
        actionData: turn.actionData,
        userContext: getUserContext(response),
        conversation: getConversation(response),
        rawMessagesCount: response.messages.length,
    };
}

/**
 * Seeds the `exercises` table with rows whose ids match the in-memory fixtures used by
 * MockExerciseRetriever. This keeps CreateWorkoutUseCase happy when it inserts FKs.
 */
export async function seedFixtureExercises(pool: pg.Pool): Promise<void> {
    const rows = fixtureExercises as Array<{
        title: string; description: string; bodyPart: string; equipment: string; level: string;
    }>;
    for (const [i, r] of rows.entries()) {
        await pool.query(
            `INSERT INTO exercises (id, title, description, body_part, equipment, level)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            [i + 1, r.title, r.description, r.bodyPart, r.equipment, r.level],
        );
    }
    // Bump sequence so future inserts don't collide.
    await pool.query(`SELECT setval('exercises_id_seq', GREATEST((SELECT MAX(id) FROM exercises), 1))`);
}
