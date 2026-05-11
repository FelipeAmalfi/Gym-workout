import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { getPostgres, truncateAll } from '../../setup/postgres.ts';
import { PgVectorExerciseRetriever } from '../../../src/infrastructure/vector/PgVectorExerciseRetriever.ts';
import { MockEmbedder } from '../../mocks/MockEmbedder.ts';
import { seedExercises, seedEmbeddings, type SeededExercise } from '../../setup/seed.ts';
import type { ModelConfig } from '../../../src/shared/config/modelConfig.ts';

const modelConfig: ModelConfig = {
    apiKey: 'mock',
    httpReferer: 'http://test',
    xTitle: 'test',
    models: ['mock'],
    temperature: 0,
    embeddingModel: 'mock',
    embeddingDimensions: 8,
};

describe('PgVectorExerciseRetriever (real pgvector + mock embedder)', () => {
    let retriever: PgVectorExerciseRetriever;
    let exercises: SeededExercise[];

    beforeAll(async () => {
        const pool = getPostgres().pool;
        await truncateAll(pool);
        exercises = await seedExercises(pool);
        await seedEmbeddings(pool, exercises, 8);
        retriever = new PgVectorExerciseRetriever(pool, modelConfig, new MockEmbedder(8));
    });

    it('returns exercises matching a single muscle filter', async () => {
        const results = await retriever.search({ muscleGroups: ['Chest'], limit: 5 });
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((r) => r.bodyPart === 'Chest')).toBe(true);
    });

    it('applies the difficulty filter', async () => {
        const results = await retriever.search({
            muscleGroups: ['Chest'],
            difficulty: 'Beginner',
            limit: 10,
        });
        expect(results.every((r) => r.level === 'Beginner')).toBe(true);
    });

    it('fans out across multiple muscles and balances results', async () => {
        const results = await retriever.search({
            muscleGroups: ['Chest', 'Lats'],
            limit: 4,
        });
        const muscles = new Set(results.map((r) => r.bodyPart));
        expect(muscles.has('Chest')).toBe(true);
        expect(muscles.has('Lats')).toBe(true);
    });

    it('supports equipment filter with multiple options', async () => {
        const results = await retriever.search({
            muscleGroups: ['Chest'],
            equipment: ['Barbell', 'Dumbbell'],
            limit: 5,
        });
        expect(results.every((r) => ['Barbell', 'Dumbbell'].includes(r.equipment))).toBe(true);
    });

    it('returns empty when no muscle matches', async () => {
        const results = await retriever.search({ muscleGroups: ['Neck'], limit: 5 });
        expect(results).toHaveLength(0);
    });
});
