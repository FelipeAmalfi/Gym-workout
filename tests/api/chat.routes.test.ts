import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../../src/interface/http/server.ts';
import { buildTestContainer } from '../setup/container.ts';
import { chat, newThreadId } from '../helpers/chat.ts';
import { MockLlmAdapter } from '../mocks/MockLlmAdapter.ts';
import { getPostgres, truncateAll } from '../setup/postgres.ts';
import { makeUser } from '../helpers/factories.ts';
import { seedFixtureExercises } from '../helpers/flow.ts';
import { assertIntent, assertWorkoutShape } from '../helpers/assertions.ts';

describe('POST /chat', () => {
    let app: FastifyInstance;
    let llm: MockLlmAdapter;
    let userId: number;

    beforeAll(async () => {
        llm = new MockLlmAdapter()
            .onIntent(/weather/i, { intent: 'unknown', slots: {} })
            .onIntent(/create.*workout$/i, { intent: 'create_workout', slots: {} })
            .onIntent(/chest.+triceps|chest, triceps/i, {
                intent: 'create_workout',
                slots: { muscleGroups: ['Chest', 'Triceps'], difficulty: 'Beginner' },
            })
            .onIntent(/show.*workouts|all my workouts|list/i, {
                intent: 'list_workouts',
                slots: {},
            });

        const { container } = buildTestContainer({ llm });
        app = await createServer(container);
    });

    beforeEach(async () => {
        const pool = getPostgres().pool;
        await truncateAll(pool);
        await seedFixtureExercises(pool);
        const u = await makeUser(pool);
        userId = u.id;
    });

    afterAll(async () => {
        await app.close();
    });

    it('returns 400 on invalid payload', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/chat',
            payload: { message: '', thread_id: '' },
        });
        expect(res.statusCode).toBe(400);
    });

    it('identifies unknown intent gracefully', async () => {
        const { status, body } = await chat(app, 'What is the weather today?', newThreadId('unknown'), userId);
        expect(status).toBe(200);
        assertIntent(body, 'unknown');
        expect(body.reply.length).toBeGreaterThan(0);
    });

    it('returns missing slots when create_workout has no muscles', async () => {
        const { status, body } = await chat(app, 'Create me a workout', newThreadId('slots'), userId);
        expect(status).toBe(200);
        assertIntent(body, 'create_workout');
        expect(body.missingSlots?.length ?? 0).toBeGreaterThan(0);
    });

    it('multi-turn slot filling creates a workout', async () => {
        const thread = newThreadId('multi');
        const first = await chat(app, 'create a workout', thread, userId);
        expect(first.body.missingSlots?.length ?? 0).toBeGreaterThan(0);

        const second = await chat(app, 'Chest and Triceps, beginner', thread, userId);
        expect(second.body.actionSuccess).toBe(true);
        assertWorkoutShape(second.body.actionData);
    });

    it('list_workouts returns 200 with intent set', async () => {
        const { status, body } = await chat(app, 'Show me all my workouts', newThreadId('list'), userId);
        expect(status).toBe(200);
        assertIntent(body, 'list_workouts');
    });
});
