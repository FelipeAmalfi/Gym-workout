import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const { Pool } = pg;

const SCHEMA_PATH = fileURLToPath(
    new URL('../../src/infrastructure/database/schema.sql', import.meta.url),
);

export interface StartedPostgres {
    container: StartedTestContainer;
    pool: pg.Pool;
    connectionString: string;
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
}

let shared: StartedPostgres | null = null;

export async function startPostgres(): Promise<StartedPostgres> {
    if (shared) return shared;

    const database = 'gymworkout_test';
    const user = 'gym_test';
    const password = 'gym_test_pw';

    const container = await new GenericContainer('pgvector/pgvector:pg16')
        .withEnvironment({
            POSTGRES_DB: database,
            POSTGRES_USER: user,
            POSTGRES_PASSWORD: password,
        })
        .withExposedPorts(5432)
        .withWaitStrategy(
            Wait.forLogMessage(/database system is ready to accept connections/, 2),
        )
        .withStartupTimeout(120_000)
        .start();

    const host = container.getHost();
    const port = container.getMappedPort(5432);

    const pool = new Pool({
        host,
        port,
        database,
        user,
        password,
        max: 10,
    });

    // Wait for pg to actually accept connections.
    for (let i = 0; i < 30; i++) {
        try {
            await pool.query('SELECT 1');
            break;
        } catch {
            await new Promise((r) => setTimeout(r, 500));
        }
    }

    const schemaSql = readFileSync(SCHEMA_PATH, 'utf8');
    await pool.query(schemaSql);

    shared = {
        container,
        pool,
        connectionString: `postgres://${user}:${password}@${host}:${port}/${database}`,
        host,
        port,
        database,
        user,
        password,
    };
    return shared;
}

export async function stopPostgres(): Promise<void> {
    if (!shared) return;
    try {
        await shared.pool.end();
    } catch {}
    try {
        await shared.container.stop({ timeout: 10_000 });
    } catch {}
    shared = null;
}

export function getPostgres(): StartedPostgres {
    if (shared) return shared;

    // Forked workers inherit env vars set by globalSetup but not the module-level
    // `shared` object. Reconstruct a pool-only handle from those env vars.
    const host = process.env.POSTGRES_HOST;
    const portStr = process.env.POSTGRES_PORT;
    const database = process.env.POSTGRES_DB;
    const user = process.env.POSTGRES_USER;
    const password = process.env.POSTGRES_PASSWORD;

    if (!host || !portStr || !database || !user || !password) {
        throw new Error('Postgres testcontainer not started — call startPostgres() in globalSetup');
    }

    const port = Number(portStr);
    shared = {
        container: null as unknown as StartedTestContainer,
        pool: new Pool({ host, port, database, user, password, max: 10 }),
        connectionString: `postgres://${user}:${password}@${host}:${port}/${database}`,
        host,
        port,
        database,
        user,
        password,
    };
    return shared;
}

/**
 * Wipes mutable rows between tests while preserving schema + seed data.
 * Order matters: dependent tables first.
 */
export async function truncateAll(pool: pg.Pool): Promise<void> {
    await pool.query(`
        TRUNCATE TABLE
          workout_exercises,
          workouts,
          user_profile,
          langchain_pg_embedding,
          exercises
        RESTART IDENTITY CASCADE
    `).catch(async () => {
        // langchain_pg_embedding may not exist yet on first run
        await pool.query(`
            TRUNCATE TABLE workout_exercises, workouts, user_profile, exercises
            RESTART IDENTITY CASCADE
        `);
    });
    // Reset users but keep the demo seed row.
    await pool.query(`DELETE FROM users WHERE email <> 'demo@gymworkout.ai'`);
    await pool.query(`ALTER SEQUENCE users_id_seq RESTART WITH 100`);
}

export function envForTestPostgres(): Record<string, string> {
    const p = getPostgres();
    return {
        POSTGRES_HOST: p.host,
        POSTGRES_PORT: String(p.port),
        POSTGRES_DB: p.database,
        POSTGRES_USER: p.user,
        POSTGRES_PASSWORD: p.password,
    };
}
