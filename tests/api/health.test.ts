import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../../src/interface/http/server.ts';
import { buildTestContainer } from '../setup/container.ts';

describe('GET /health', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        const { container } = buildTestContainer();
        app = await createServer(container);
    });

    afterAll(async () => {
        await app.close();
    });

    it('returns ok', async () => {
        const res = await app.inject({ method: 'GET', url: '/health' });
        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ status: 'ok' });
    });
});
