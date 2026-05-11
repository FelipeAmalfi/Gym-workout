import type pg from 'pg';
import { buildContainer, type Container } from '../../src/composition/container.ts';
import { loadEnv } from '../../src/shared/config/env.ts';
import type { LlmPort } from '../../src/core/application/ports/LlmPort.ts';
import type { ExerciseRetriever } from '../../src/core/application/ports/ExerciseRetriever.ts';
import { MockLlmAdapter } from '../mocks/MockLlmAdapter.ts';
import { MockExerciseRetriever, type MockExerciseRow } from '../mocks/MockExerciseRetriever.ts';
import { getPostgres } from './postgres.ts';
import fixtureExercises from '../fixtures/exercises.json' with { type: 'json' };

export interface TestContainerOptions {
    llm?: LlmPort;
    exerciseRetriever?: ExerciseRetriever;
    pool?: pg.Pool;
    /** Pre-seed exercises in the mock retriever. Defaults to fixtures/exercises.json. */
    exercises?: MockExerciseRow[];
    /** Use real testcontainer pool. Requires startPostgres() in globalSetup. */
    useRealDb?: boolean;
}

export interface TestContainer {
    container: Container;
    llm: MockLlmAdapter;
    retriever: MockExerciseRetriever | ExerciseRetriever;
}

/**
 * Builds a test container with mocked LLM + optional mocked retriever.
 * By default uses the real testcontainer Postgres pool from globalSetup.
 */
export function buildTestContainer(opts: TestContainerOptions = {}): TestContainer {
    process.env.OPENROUTER_API_KEY ??= 'test-key';
    process.env.LLM_MODELS ??= 'mock-model';
    process.env.EMBEDDING_MODEL ??= 'mock-embedding';
    process.env.EMBEDDING_DIMENSIONS ??= '8';

    const env = (() => {
        try { return loadEnv(); } catch { return undefined; }
    })();

    const llm = (opts.llm as MockLlmAdapter | undefined) ?? new MockLlmAdapter();

    let pool = opts.pool;
    if (!pool && opts.useRealDb !== false) {
        try { pool = getPostgres().pool; } catch { /* no DB available */ }
    }

    const rows: MockExerciseRow[] = opts.exercises ?? (fixtureExercises as MockExerciseRow[]).map(
        (e, i) => ({ id: i + 1, ...(e as Omit<MockExerciseRow, 'id'>) }),
    );
    const retriever = opts.exerciseRetriever ?? new MockExerciseRetriever(rows);

    const container = buildContainer({
        env,
        pool,
        llm,
        exerciseRetriever: retriever,
    });

    return { container, llm, retriever };
}
