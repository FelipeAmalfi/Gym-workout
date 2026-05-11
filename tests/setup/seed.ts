import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type pg from 'pg';
import { hashToVector } from '../mocks/MockEmbedder.ts';

const EXERCISES_PATH = fileURLToPath(new URL('../fixtures/exercises.json', import.meta.url));

export interface SeededExercise {
    id: number;
    title: string;
    description: string;
    bodyPart: string;
    equipment: string;
    level: string;
}

export async function seedExercises(pool: pg.Pool): Promise<SeededExercise[]> {
    const raw = JSON.parse(readFileSync(EXERCISES_PATH, 'utf8')) as Array<{
        title: string;
        description: string;
        bodyPart: string;
        equipment: string;
        level: string;
    }>;

    const out: SeededExercise[] = [];
    for (const e of raw) {
        const res = await pool.query<{ id: number }>(
            `INSERT INTO exercises (title, description, body_part, equipment, level)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [e.title, e.description, e.bodyPart, e.equipment, e.level],
        );
        out.push({ id: res.rows[0]!.id, ...e });
    }
    return out;
}

/**
 * Seed the pgvector table used by PGVectorStore with deterministic vectors.
 * Builds the langchain_pg_collection + langchain_pg_embedding rows compatible with
 * @langchain/community PGVectorStore.
 */
export async function seedEmbeddings(
    pool: pg.Pool,
    exercises: SeededExercise[],
    dims = 8,
): Promise<void> {
    // langchain_pg_embedding is auto-created by PGVectorStore.ensureTableInDatabase(); for tests we mirror its schema.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS langchain_pg_collection (
            uuid UUID PRIMARY KEY,
            name VARCHAR NOT NULL,
            cmetadata JSONB
        );
        CREATE TABLE IF NOT EXISTS langchain_pg_embedding (
            uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            collection_id UUID,
            embedding VECTOR,
            document TEXT,
            cmetadata JSONB
        );
    `);
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    for (const ex of exercises) {
        const text = `${ex.title}. ${ex.description}. Targets ${ex.bodyPart}. Equipment ${ex.equipment}. Level ${ex.level}.`;
        const vec = hashToVector(`${ex.bodyPart} ${ex.title}`, dims);
        const vectorLiteral = `[${vec.join(',')}]`;
        await pool.query(
            `INSERT INTO langchain_pg_embedding (embedding, document, cmetadata)
             VALUES ($1::vector, $2, $3::jsonb)`,
            [
                vectorLiteral,
                text,
                JSON.stringify({
                    exercise_id: ex.id,
                    title: ex.title,
                    body_part: ex.bodyPart,
                    equipment: ex.equipment,
                    level: ex.level,
                }),
            ],
        );
    }
}

export async function seedUser(
    pool: pg.Pool,
    args: { name: string; email: string; cpf: string },
): Promise<{ id: number; name: string; cpf: string }> {
    const res = await pool.query<{ id: number }>(
        `INSERT INTO users (name, email, cpf) VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET cpf = EXCLUDED.cpf
         RETURNING id`,
        [args.name, args.email, args.cpf],
    );
    return { id: res.rows[0]!.id, name: args.name, cpf: args.cpf };
}
