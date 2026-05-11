import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../../src/interface/http/server.ts';
import { buildTestContainer } from '../setup/container.ts';
import { getPostgres, truncateAll } from '../setup/postgres.ts';
import { makeUser, makeExercise, makeWorkout } from '../helpers/factories.ts';

describe('Workout REST routes', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        const { container } = buildTestContainer();
        app = await createServer(container);
    });

    beforeEach(async () => {
        await truncateAll(getPostgres().pool);
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /workouts returns 400 without user_id', async () => {
        const res = await app.inject({ method: 'GET', url: '/workouts' });
        expect(res.statusCode).toBe(400);
    });

    it('GET /workouts returns user workouts', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);
        const ex = await makeExercise(pool);
        await makeWorkout(pool, { userId: user.id, exerciseIds: [ex.id] });

        const res = await app.inject({ method: 'GET', url: `/workouts?user_id=${user.id}` });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body) as unknown[];
        expect(Array.isArray(body)).toBe(true);
        expect(body).toHaveLength(1);
    });

    it('POST /workouts creates a workout', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);
        const ex = await makeExercise(pool);

        const res = await app.inject({
            method: 'POST',
            url: '/workouts',
            payload: { userId: user.id, name: 'Test', exerciseIds: [ex.id] },
        });
        expect(res.statusCode).toBe(201);
        const body = JSON.parse(res.body);
        expect(body.name).toBe('Test');
        expect(body.exercises).toHaveLength(1);
    });

    it('PUT /workouts/:id updates a workout', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);
        const ex = await makeExercise(pool);
        const w = await makeWorkout(pool, { userId: user.id, exerciseIds: [ex.id] });

        const res = await app.inject({
            method: 'PUT',
            url: `/workouts/${w.id}`,
            payload: { userId: user.id, name: 'Renamed' },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.name).toBe('Renamed');
    });

    it('DELETE /workouts/:id returns 400 without user_id', async () => {
        const res = await app.inject({ method: 'DELETE', url: '/workouts/99999' });
        expect(res.statusCode).toBe(400);
    });

    it('DELETE /workouts/:id returns 404 when workout does not belong to user', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);
        const other = await makeUser(pool);
        const ex = await makeExercise(pool);
        const w = await makeWorkout(pool, { userId: user.id, exerciseIds: [ex.id] });

        const res = await app.inject({
            method: 'DELETE',
            url: `/workouts/${w.id}?user_id=${other.id}`,
        });
        expect(res.statusCode).toBe(404);
    });

    it('DELETE /workouts/:id removes the workout', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);
        const ex = await makeExercise(pool);
        const w = await makeWorkout(pool, { userId: user.id, exerciseIds: [ex.id] });

        const res = await app.inject({
            method: 'DELETE',
            url: `/workouts/${w.id}?user_id=${user.id}`,
        });
        expect(res.statusCode === 200 || res.statusCode === 204).toBe(true);

        const after = await pool.query('SELECT id FROM workouts WHERE id = $1', [w.id]);
        expect(after.rows).toHaveLength(0);
    });
});
