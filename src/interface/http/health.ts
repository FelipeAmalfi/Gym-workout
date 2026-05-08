import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const healthRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
    app.get('/health', async () => ({ status: 'ok' }));
};
