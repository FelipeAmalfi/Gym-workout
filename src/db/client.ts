import pg from 'pg';

const { Pool } = pg;

console.assert(process.env.POSTGRES_HOST, 'POSTGRES_HOST is not set');
console.assert(process.env.POSTGRES_USER, 'POSTGRES_USER is not set');
console.assert(process.env.POSTGRES_PASSWORD, 'POSTGRES_PASSWORD is not set');
console.assert(process.env.POSTGRES_DB, 'POSTGRES_DB is not set');

export const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  database: process.env.POSTGRES_DB ?? 'gymworkout',
  user: process.env.POSTGRES_USER ?? 'gym',
  password: process.env.POSTGRES_PASSWORD ?? 'gympassword',
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
});

pool.on('error', (err) => {
  console.error('Unexpected pool error', err);
});
