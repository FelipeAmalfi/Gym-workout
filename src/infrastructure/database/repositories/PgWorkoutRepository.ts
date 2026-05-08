import type pg from 'pg';
import type { Workout, WorkoutWithExercises, WorkoutSummary } from '../../../core/domain/entities/Workout.ts';
import type { WorkoutExercisePrescription } from '../../../core/domain/entities/Exercise.ts';
import type {
    WorkoutRepository,
    CreateWorkoutData,
    UpdateWorkoutData,
} from '../../../core/application/ports/WorkoutRepository.ts';
import { NotFoundError, RepositoryError, ValidationError } from '../../../core/domain/errors/AppError.ts';

interface WorkoutRow {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    goal: string | null;
    difficulty: string | null;
    created_at: Date;
    updated_at: Date;
}

interface WorkoutExerciseRow {
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

interface WorkoutRowWithMuscles extends WorkoutRow {
    muscle_groups: string[] | null;
}

function mapWorkout(row: WorkoutRow): Workout {
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

function mapPrescription(row: WorkoutExerciseRow): WorkoutExercisePrescription {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        bodyPart: row.body_part,
        equipment: row.equipment,
        level: row.level,
        sets: row.sets ?? 0,
        reps: row.reps ?? 0,
        restTimeSec: row.rest_time_sec ?? 60,
        position: row.position,
    };
}

export class PgWorkoutRepository implements WorkoutRepository {
    private readonly pool: pg.Pool;
    constructor(pool: pg.Pool) { this.pool = pool; }

    async create(data: CreateWorkoutData): Promise<WorkoutWithExercises> {
        const client = await this.pool.connect();
        const sets = data.sets ?? 3;
        const reps = data.reps ?? 10;
        const restTime = data.restTimeSec ?? 60;
        try {
            await client.query('BEGIN');

            const workoutResult = await client.query<WorkoutRow>(
                `INSERT INTO workouts (user_id, name, goal, difficulty, description)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [
                    data.userId,
                    data.name,
                    data.goal ?? null,
                    data.difficulty ?? null,
                    data.description ?? null,
                ],
            );
            const workoutRow = workoutResult.rows[0]!;

            for (const [idx, exerciseId] of data.exerciseIds.entries()) {
                await client.query(
                    `INSERT INTO workout_exercises (workout_id, exercise_id, position, sets, reps, rest_time_sec)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [workoutRow.id, exerciseId, idx + 1, sets, reps, restTime],
                );
            }

            await client.query('COMMIT');

            const exercisesRes = await client.query<WorkoutExerciseRow>(
                `SELECT e.id, e.title, e.description, e.body_part, e.equipment, e.level,
                        we.sets, we.reps, we.rest_time_sec, we.position
                 FROM workout_exercises we
                 JOIN exercises e ON e.id = we.exercise_id
                 WHERE we.workout_id = $1
                 ORDER BY we.position`,
                [workoutRow.id],
            );

            return {
                ...mapWorkout(workoutRow),
                exercises: exercisesRes.rows.map(mapPrescription),
            };
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            throw new RepositoryError('Failed to create workout', error);
        } finally {
            client.release();
        }
    }

    async update(workoutId: number, patches: UpdateWorkoutData): Promise<Workout> {
        const entries = Object.entries(patches).filter(([, v]) => v !== undefined);
        if (entries.length === 0) throw new ValidationError('No fields to update');

        const setClauses = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
        const values = [workoutId, ...entries.map(([, v]) => v)];

        try {
            const result = await this.pool.query<WorkoutRow>(
                `UPDATE workouts SET ${setClauses} WHERE id = $1 RETURNING *`,
                values,
            );
            if (!result.rows[0]) throw new NotFoundError(`Workout ${workoutId} not found`);
            return mapWorkout(result.rows[0]);
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new RepositoryError('Failed to update workout', error);
        }
    }

    async delete(workoutId: number, userId: number): Promise<void> {
        try {
            const result = await this.pool.query(
                `DELETE FROM workouts WHERE id = $1 AND user_id = $2 RETURNING id`,
                [workoutId, userId],
            );
            if (!result.rowCount) {
                throw new NotFoundError(
                    `Workout ${workoutId} not found or does not belong to user ${userId}`,
                );
            }
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new RepositoryError('Failed to delete workout', error);
        }
    }

    async findById(workoutId: number): Promise<WorkoutWithExercises | null> {
        try {
            const workoutRes = await this.pool.query<WorkoutRow>(
                `SELECT * FROM workouts WHERE id = $1`,
                [workoutId],
            );
            if (!workoutRes.rows[0]) return null;

            const exRes = await this.pool.query<WorkoutExerciseRow>(
                `SELECT e.id, e.title, e.description, e.body_part, e.equipment, e.level,
                        we.sets, we.reps, we.rest_time_sec, we.position
                 FROM workout_exercises we
                 JOIN exercises e ON e.id = we.exercise_id
                 WHERE we.workout_id = $1
                 ORDER BY we.position`,
                [workoutId],
            );

            return {
                ...mapWorkout(workoutRes.rows[0]),
                exercises: exRes.rows.map(mapPrescription),
            };
        } catch (error) {
            throw new RepositoryError('Failed to fetch workout', error);
        }
    }

    async findByUserId(userId: number): Promise<Workout[]> {
        try {
            const res = await this.pool.query<WorkoutRow>(
                `SELECT * FROM workouts WHERE user_id = $1 ORDER BY created_at DESC`,
                [userId],
            );
            return res.rows.map(mapWorkout);
        } catch (error) {
            throw new RepositoryError('Failed to list workouts', error);
        }
    }

    async findByUserIdAndMuscleGroups(
        userId: number,
        muscleGroups: string[],
    ): Promise<WorkoutSummary[]> {
        try {
            const res = await this.pool.query<WorkoutRowWithMuscles>(
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
            return res.rows.map((row) => ({
                id: row.id,
                name: row.name,
                goal: row.goal,
                difficulty: row.difficulty,
                muscleGroups: row.muscle_groups ?? [],
            }));
        } catch (error) {
            throw new RepositoryError('Failed to find workouts by muscle groups', error);
        }
    }
}
