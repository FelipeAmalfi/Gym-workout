import { describe, it, expect } from 'vitest';
import { buildContainer } from '../../src/composition/container.ts';
import { createServer } from '../../src/interface/http/server.ts';
import { OpenRouterLlmAdapter } from '../../src/infrastructure/llm/OpenRouterLlmAdapter.ts';
import { buildModelConfig } from '../../src/shared/config/modelConfig.ts';
import { loadEnv } from '../../src/shared/config/env.ts';

/**
 * Nightly smoke test against real OpenRouter. Excluded from the default vitest
 * projects (see vitest.config.ts) so it only runs in the dedicated CI job.
 *
 * Asserts that one full create_workout turn succeeds end-to-end with a real LLM —
 * intended to catch prompt drift and provider regressions, not behavior we already
 * pin in the deterministic suite.
 */
describe('@live OpenRouter smoke', () => {
    it('classifies a basic create_workout request', async () => {
        const env = loadEnv();
        const config = buildModelConfig(env);
        const llm = new OpenRouterLlmAdapter(config);

        // Minimal direct call — skip the rest of the graph to keep token cost low.
        const { IntentSchema, getSystemPrompt, getUserPromptTemplate } = await import(
            '../../src/shared/prompts/v1/identifyIntent.ts'
        );
        const result = await llm.generateStructured(
            getSystemPrompt(),
            getUserPromptTemplate({ message: 'Create a chest workout for beginners' }),
            IntentSchema,
        );
        expect(result.success).toBe(true);
        expect(result.data.intent).toBe('create_workout');
        expect(result.data.slots?.muscleGroups).toContain('Chest');
    }, 60_000);

    it('boots the full server without error', async () => {
        const container = buildContainer();
        const app = await createServer(container);
        const res = await app.inject({ method: 'GET', url: '/health' });
        expect(res.statusCode).toBe(200);
        await app.close();
    });
});
