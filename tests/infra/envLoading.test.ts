import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('env loading', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('throws a clear error when OPENROUTER_API_KEY is missing', async () => {
        const saved = process.env.OPENROUTER_API_KEY;
        delete process.env.OPENROUTER_API_KEY;
        try {
            const mod = await import('../../src/shared/config/env.ts');
            expect(() => mod.loadEnv()).toThrowError(/OPENROUTER_API_KEY/);
        } finally {
            if (saved) process.env.OPENROUTER_API_KEY = saved;
        }
    });

    it('parses default values for optional vars', async () => {
        process.env.OPENROUTER_API_KEY = 'present';
        const mod = await import('../../src/shared/config/env.ts');
        const env = mod.loadEnv();
        expect(env.HTTP_REFERER).toBeDefined();
        expect(env.POSTGRES_PORT).toBeTypeOf('number');
        expect(env.LLM_MODELS.length).toBeGreaterThan(0);
        expect(env.EMBEDDING_DIMENSIONS).toBeGreaterThan(0);
    });
});
