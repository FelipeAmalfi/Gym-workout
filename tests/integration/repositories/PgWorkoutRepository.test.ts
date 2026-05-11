import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { getPostgres, truncateAll } from '../../setup/postgres.ts';
import { PgWorkoutRepository } from '../../../src/infrastructure/database/repositories/PgWorkoutRepository.ts';
import { makeUser, makeExercise } from '../../helpers/factories.ts';
import { NotFoundError, ValidationError } from '../../../src/core/domain/errors/AppError.ts';

describe('PgWorkoutRepository', () => {
    let repo: PgWorkoutRepository;

    beforeAll(() => {
        repo = new PgWorkoutRepository(getPostgres().pool);
    });

    beforeEach(async () => {
        await truncateAll(getPostgres().pool);
    });

    it('creates a workout with linked exercises', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);
        const ex1 = await makeExercise(pool, { title: 'A' });
        const ex2 = await makeExercise(pool, { title: 'B' });

        const workout = await repo.create({
            userId: user.id,
            name: 'Push Day',
            difficulty: 'Intermediate',
            exerciseIds: [ex1.id, ex2.id],
        });

        expect(workout.id).toBeGreaterThan(0);
        expect(workout.userId).toBe(user.id);
        expect(workout.exercises).toHaveLength(2);
        expect(workout.exercises[0]!.position).toBe(1);
        expect(workout.exercises[1]!.position).toBe(2);
        expect(workout.exercises[0]!.restTimeSec).toBe(60);
    });

    it('findById returns the workout with exercises', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);
        const ex = await makeExercise(pool);
        const created = await repo.create({ userId: user.id, name: 'W', exerciseIds: [ex.id] });

        const found = await repo.findById(created.id);
        expect(found?.id).toBe(created.id);
        expect(found?.exercises[0]!.title).toBe(ex.title);
    });

    it('findById returns null for missing workout', async () => {
        expect(await repo.findById(99_999)).toBeNull();
    });

    it('findByUserId returns ordered list', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);
        const ex = await makeExercise(pool);
        await repo.create({ userId: user.id, name: 'First', exerciseIds: [ex.id] });
        await repo.create({ userId: user.id, name: 'Second', exerciseIds: [ex.id] });

        const all = await repo.findByUserId(user.id);
        expect(all).toHaveLength(2);
    });

    it('findByUserIdAndMuscleGroups filters by body part', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);
        const chest = await makeExercise(pool, { bodyPart: 'Chest', title: 'C' });
        const legs = await makeExercise(pool, { bodyPart: 'Quadriceps', title: 'L' });
        await repo.create({ userId: user.id, name: 'Chest Day', exerciseIds: [chest.id] });
        await repo.create({ userId: user.id, name: 'Leg Day', exerciseIds: [legs.id] });

        const matches = await repo.findByUserIdAndMuscleGroups(user.id, ['Chest']);
        expect(matches).toHaveLength(1);
        expect(matches[0]!.name).toBe('Chest Day');
        expect(matches[0]!.muscleGroups).toContain('Chest');
    });

    it('update modifies fields and returns updated row', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);
        const ex = await makeExercise(pool);
        const w = await repo.create({ userId: user.id, name: 'Old', exerciseIds: [ex.id] });

        const updated = await repo.update(w.id, { name: 'New Name', goal: 'strength' });
        expect(updated.name).toBe('New Name');
        expect(updated.goal).toBe('strength');
    });

    it('update throws ValidationError when no fields provided', async () => {
        await expect(repo.update(1, {})).rejects.toThrow(ValidationError);
    });

    it('update throws NotFoundError when workout missing', async () => {
        await expect(repo.update(99_999, { name: 'X' })).rejects.toThrow(NotFoundError);
    });

    it('delete removes the workout and cascades exercises', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);
        const ex = await makeExercise(pool);
        const w = await repo.create({ userId: user.id, name: 'To Delete', exerciseIds: [ex.id] });

        await repo.delete(w.id, user.id);

        expect(await repo.findById(w.id)).toBeNull();
        const rem = await pool.query('SELECT COUNT(*)::int AS c FROM workout_exercises WHERE workout_id = $1', [w.id]);
        expect(rem.rows[0].c).toBe(0);
    });

    it('delete throws NotFoundError when workout does not belong to user', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);
        const other = await makeUser(pool);
        const ex = await makeExercise(pool);
        const w = await repo.create({ userId: user.id, name: 'Mine', exerciseIds: [ex.id] });

        await expect(repo.delete(w.id, other.id)).rejects.toThrow(NotFoundError);
    });
});
