import pg from 'pg';
import type { Env } from '../../shared/config/env.ts';

const { Pool } = pg;

export function createPool(env: Env): pg.Pool {
    const pool = new Pool({
        host: env.POSTGRES_HOST,
        port: env.POSTGRES_PORT,
        database: env.POSTGRES_DB,
        user: env.POSTGRES_USER,
        password: env.POSTGRES_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 2_000,
    });

    pool.on('error', (err) => {
        console.error('Unexpected pool error', err);
    });

    return pool;
}
