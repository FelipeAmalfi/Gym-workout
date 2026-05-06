import pg from 'pg';

export interface WorkoutRow {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    goal: string | null;
    difficulty: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface ExerciseRow {
    id: number;
    title: string;
    description: string | null;
    type: string | null;
    body_part: string | null;
    equipment: string | null;
    level: string | null;
    rating: number | null;
}

export interface WorkoutExerciseDetail {
    id: number;
    title: string;
    description: string | null;
    body_part: string | null;
    equipment: string | null;
    level: string | null;
    sets: number | null;
    reps: number | null;
    rest_time_sec: number | null;
    position: number;
}

export interface WorkoutWithExercises extends WorkoutRow {
    exercises: WorkoutExerciseDetail[];
}

export interface CreateWorkoutParams {
    userId: number;
    name: string;
    goal?: string;
    difficulty?: string;
    exerciseIds: number[];
    restTimeSec?: number;
}

export interface UpdateWorkoutParams {
    name?: string;
    goal?: string;
    difficulty?: string;
    description?: string;
}

export interface UserRow {
    id: number;
    cpf: string;
}

export class WorkoutService {
    private pool: pg.Pool;

    constructor(pool: pg.Pool) {
        this.pool = pool;
    }

    async getOrCreateUserByCpf(cpf: string): Promise<UserRow> {
        const existing = await this.pool.query<UserRow>(
            `SELECT id, cpf FROM users WHERE cpf = $1`,
            [cpf],
        );
        if (existing.rows[0]) return existing.rows[0];

        const created = await this.pool.query<UserRow>(
            `INSERT INTO users (name, email, cpf)
             VALUES ($1, $2, $3)
             ON CONFLICT (email) DO UPDATE SET cpf = EXCLUDED.cpf
             RETURNING id, cpf`,
            [`User ${cpf}`, `user-${cpf}@gymworkout.ai`, cpf],
        );
        return created.rows[0]!;
    }

    async createWorkout(params: CreateWorkoutParams): Promise<WorkoutWithExercises> {
        const client = await this.pool.connect();
        const restTime = params.restTimeSec ?? 60;
        try {
            await client.query('BEGIN');

            const workoutResult = await client.query<WorkoutRow>(
                `INSERT INTO workouts (user_id, name, goal, difficulty)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [params.userId, params.name, params.goal ?? null, params.difficulty ?? null],
            );
            const workout = workoutResult.rows[0]!;

            for (const [idx, exerciseId] of params.exerciseIds.entries()) {
                await client.query(
                    `INSERT INTO workout_exercises (workout_id, exercise_id, position, sets, reps, rest_time_sec)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [workout.id, exerciseId, idx + 1, 3, 10, restTime],
                );
            }

            await client.query('COMMIT');
            return this.getWorkoutWithExercises(workout.id, client);
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    async updateWorkout(workoutId: number, patches: UpdateWorkoutParams): Promise<WorkoutRow> {
        const entries = Object.entries(patches).filter(([, v]) => v !== undefined);
        if (entries.length === 0) throw new Error('No fields to update');

        const setClauses = entries.map(([key, _], i) => `${key} = $${i + 2}`).join(', ');
        const values = [workoutId, ...entries.map(([, v]) => v)];

        const result = await this.pool.query<WorkoutRow>(
            `UPDATE workouts SET ${setClauses} WHERE id = $1 RETURNING *`,
            values,
        );
        if (!result.rows[0]) throw new Error(`Workout ${workoutId} not found`);
        return result.rows[0];
    }

    async deleteWorkout(workoutId: number, userId: number): Promise<void> {
        const result = await this.pool.query(
            `DELETE FROM workouts WHERE id = $1 AND user_id = $2 RETURNING id`,
            [workoutId, userId],
        );
        if (!result.rowCount) {
            throw new Error(`Workout ${workoutId} not found or does not belong to user ${userId}`);
        }
    }

    async getWorkoutWithExercises(
        workoutId: number,
        client?: pg.PoolClient,
    ): Promise<WorkoutWithExercises> {
        const q = client ?? this.pool;

        const workoutRes = await q.query<WorkoutRow>(
            `SELECT * FROM workouts WHERE id = $1`,
            [workoutId],
        );
        if (!workoutRes.rows[0]) throw new Error(`Workout ${workoutId} not found`);

        const exRes = await q.query<WorkoutExerciseDetail>(
            `SELECT e.id, e.title, e.description, e.body_part, e.equipment, e.level,
                    we.sets, we.reps, we.rest_time_sec, we.position
             FROM workout_exercises we
             JOIN exercises e ON e.id = we.exercise_id
             WHERE we.workout_id = $1
             ORDER BY we.position`,
            [workoutId],
        );

        return { ...workoutRes.rows[0], exercises: exRes.rows };
    }

    async listWorkouts(userId: number): Promise<WorkoutRow[]> {
        const res = await this.pool.query<WorkoutRow>(
            `SELECT * FROM workouts WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId],
        );
        return res.rows;
    }

    async findWorkoutsByMuscleGroups(
        userId: number,
        muscleGroups: string[],
    ): Promise<Array<WorkoutRow & { muscleGroups: string[] }>> {
        const res = await this.pool.query<WorkoutRow & { muscle_groups: string[] }>(
            `SELECT w.*,
                    array_agg(DISTINCT e.body_part) FILTER (WHERE e.body_part IS NOT NULL) AS muscle_groups
             FROM workouts w
             JOIN workout_exercises we ON we.workout_id = w.id
             JOIN exercises e ON e.id = we.exercise_id
             WHERE w.user_id = $1
               AND e.body_part = ANY($2::text[])
             GROUP BY w.id
             ORDER BY w.created_at DESC`,
            [userId, muscleGroups],
        );
        return res.rows.map(({ muscle_groups, ...rest }) => ({
            ...rest,
            muscleGroups: muscle_groups ?? [],
        }));
    }
}
