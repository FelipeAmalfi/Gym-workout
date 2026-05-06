import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/server.ts';

const app = createServer();

async function chat(message: string, threadId: string, userId = 1) {
    return app.inject({
        method: 'POST',
        url: '/chat',
        payload: { message, thread_id: threadId, user_id: userId },
    });
}

describe('Gym Workout API — E2E Tests', async () => {

    it('POST /chat — identifies unknown intent gracefully', async () => {
        const res = await chat('What is the weather today?', 'test-unknown-1');
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.body);
        assert.ok(body.reply, 'reply should be present');
        assert.equal(body.intent, 'unknown');
    });

    it('POST /chat — requests missing slots for create_workout', async () => {
        const res = await chat('Create me a workout', 'test-create-slots-1');
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.body);
        assert.equal(body.intent, 'create_workout');
        assert.ok(body.missingSlots?.length > 0, 'should have missing slots');
        assert.ok(body.reply.length > 0, 'should ask a follow-up question');
    });

    it('POST /chat — multi-turn slot filling creates a workout', async () => {
        const threadId = 'test-create-multi-1';

        const first = await chat('I want to create a workout', threadId);
        assert.equal(first.statusCode, 200);
        const firstBody = JSON.parse(first.body);
        assert.equal(firstBody.intent, 'create_workout');
        assert.ok(firstBody.missingSlots?.length > 0);

        const second = await chat('Chest and Triceps, Beginner difficulty', threadId);
        assert.equal(second.statusCode, 200);
        const secondBody = JSON.parse(second.body);
        assert.equal(secondBody.intent, 'create_workout');
        assert.equal(secondBody.actionSuccess, true);
        assert.ok(secondBody.actionData?.id, 'workout should have an ID');
        assert.ok(secondBody.actionData?.exercises?.length > 0, 'workout should have exercises');
    });

    it('POST /chat — lists workouts', async () => {
        const res = await chat('Show me all my workouts', 'test-list-1');
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.body);
        assert.equal(body.intent, 'list_workouts');
        assert.ok(body.reply.length > 0);
    });

    it('GET /workouts — returns workouts for user', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/workouts?user_id=1',
        });
        assert.equal(res.statusCode, 200);
        const body = JSON.parse(res.body);
        assert.ok(Array.isArray(body), 'should return an array');
    });

    it('GET /workouts — returns 400 without user_id', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/workouts',
        });
        assert.equal(res.statusCode, 400);
    });

    it('DELETE /workouts/:id — returns 400 without user_id', async () => {
        const res = await app.inject({
            method: 'DELETE',
            url: '/workouts/99999',
        });
        assert.equal(res.statusCode, 400);
    });
});
