import type pg from 'pg';
import type { Workout, WorkoutWithExercises } from '../../src/core/domain/entities/Workout.ts';

let userCounter = 0;
let workoutCounter = 0;

export function makeCpf(seed = userCounter): string {
    // Generate a valid CPF deterministically. Seed range 0–999.
    const base = String(seed % 1000).padStart(9, '0');
    const d1 = computeCheckDigit(base, 10);
    const d2 = computeCheckDigit(base + d1, 11);
    return base + d1 + d2;
}

function computeCheckDigit(slice: string, startWeight: number): string {
    let sum = 0;
    let weight = startWeight;
    for (const ch of slice) {
        sum += Number.parseInt(ch, 10) * weight;
        weight--;
    }
    const rem = sum % 11;
    return String(rem < 2 ? 0 : 11 - rem);
}

export interface MakeUserOptions {
    name?: string;
    email?: string;
    cpf?: string;
}

export async function makeUser(pool: pg.Pool, opts: MakeUserOptions = {}): Promise<{
    id: number; name: string; email: string; cpf: string;
}> {
    userCounter += 1;
    const name = opts.name ?? `Test User ${userCounter}`;
    const cpf = opts.cpf ?? makeCpf(userCounter);
    const email = opts.email ?? `user-${cpf}-${userCounter}@gymworkout.test`;

    const res = await pool.query<{ id: number }>(
        `INSERT INTO users (name, email, cpf) VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET cpf = EXCLUDED.cpf
         RETURNING id`,
        [name, email, cpf],
    );
    return { id: res.rows[0]!.id, name, email, cpf };
}

export async function makeExercise(
    pool: pg.Pool,
    opts: Partial<{ title: string; bodyPart: string; equipment: string; level: string; description: string }> = {},
): Promise<{ id: number; title: string; bodyPart: string; equipment: string; level: string }> {
    workoutCounter += 1;
    const title = opts.title ?? `Test Exercise ${workoutCounter}`;
    const bodyPart = opts.bodyPart ?? 'Chest';
    const equipment = opts.equipment ?? 'Dumbbell';
    const level = opts.level ?? 'Intermediate';
    const description = opts.description ?? `Description ${workoutCounter}`;
    const res = await pool.query<{ id: number }>(
        `INSERT INTO exercises (title, description, body_part, equipment, level)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [title, description, bodyPart, equipment, level],
    );
    return { id: res.rows[0]!.id, title, bodyPart, equipment, level };
}

export async function makeWorkout(
    pool: pg.Pool,
    args: { userId: number; name?: string; exerciseIds: number[]; difficulty?: string; goal?: string },
): Promise<Workout> {
    workoutCounter += 1;
    const name = args.name ?? `Workout ${workoutCounter}`;
    const res = await pool.query<{ id: number; user_id: number; name: string; description: string | null; goal: string | null; difficulty: string | null; created_at: Date; updated_at: Date }>(
        `INSERT INTO workouts (user_id, name, goal, difficulty)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [args.userId, name, args.goal ?? null, args.difficulty ?? null],
    );
    const row = res.rows[0]!;
    for (const [idx, exId] of args.exerciseIds.entries()) {
        await pool.query(
            `INSERT INTO workout_exercises (workout_id, exercise_id, position, sets, reps, rest_time_sec)
             VALUES ($1, $2, $3, 3, 10, 60)`,
            [row.id, exId, idx + 1],
        );
    }
    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description,
        goal: row.goal,
        difficulty: row.difficulty,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function isWorkout(x: unknown): x is WorkoutWithExercises {
    return typeof x === 'object' && x !== null && 'exercises' in x && Array.isArray((x as WorkoutWithExercises).exercises);
}
