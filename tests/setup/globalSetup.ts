import { startPostgres, stopPostgres } from './postgres.ts';

export default async function () {
    const pg = await startPostgres();
    // Surface env vars to child workers via process.env (vitest forks inherit).
    process.env.POSTGRES_HOST = pg.host;
    process.env.POSTGRES_PORT = String(pg.port);
    process.env.POSTGRES_DB = pg.database;
    process.env.POSTGRES_USER = pg.user;
    process.env.POSTGRES_PASSWORD = pg.password;
    // Ensure other env required by loadEnv() is present in tests.
    process.env.OPENROUTER_API_KEY ??= 'test-key-not-used';
    process.env.LLM_MODELS ??= 'mock-model';
    process.env.EMBEDDING_MODEL ??= 'mock-embedding';
    process.env.EMBEDDING_DIMENSIONS ??= '8';

    return async () => {
        await stopPostgres();
    };
}
