import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { getPostgres, truncateAll } from '../../setup/postgres.ts';
import { PgWorkoutRepository } from '../../../src/infrastructure/database/repositories/PgWorkoutRepository.ts';
import { CreateWorkoutUseCase } from '../../../src/core/application/use-cases/workout/CreateWorkoutUseCase.ts';
import { MockExerciseRetriever } from '../../mocks/MockExerciseRetriever.ts';
import { makeUser } from '../../helpers/factories.ts';
import fixtureExercises from '../../fixtures/exercises.json' with { type: 'json' };
import { ValidationError } from '../../../src/core/domain/errors/AppError.ts';

const rows = (fixtureExercises as Array<{ title: string; description: string; bodyPart: string; equipment: string; level: string }>)
    .map((e, i) => ({ id: i + 1, ...e }));

describe('CreateWorkoutUseCase (integration)', () => {
    let useCase: CreateWorkoutUseCase;
    let retriever: MockExerciseRetriever;

    beforeEach(async () => {
        const pool = getPostgres().pool;
        await truncateAll(pool);
        // Seed exercises matching the mock retriever ids so FK constraints hold.
        for (const r of rows) {
            await pool.query(
                `INSERT INTO exercises (id, title, description, body_part, equipment, level)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [r.id, r.title, r.description, r.bodyPart, r.equipment, r.level],
            );
        }
        retriever = new MockExerciseRetriever(rows);
        useCase = new CreateWorkoutUseCase(new PgWorkoutRepository(pool), retriever);
    });

    it('creates a single-muscle workout with the requested exercises', async () => {
        const user = await makeUser(getPostgres().pool);
        const out = await useCase.execute({
            userId: user.id,
            muscleGroups: ['Chest'],
            difficulty: 'Beginner',
            numExercises: 3,
        });
        expect(out.workout.exercises).toHaveLength(1); // only Push-Up is Beginner Chest
        expect(out.workout.exercises[0]!.bodyPart).toBe('Chest');
        expect(out.workout.difficulty).toBe('Beginner');
    });

    it('fans out across multiple muscles when multi-muscle requested', async () => {
        const user = await makeUser(getPostgres().pool);
        const out = await useCase.execute({
            userId: user.id,
            muscleGroups: ['Chest', 'Lats'],
            difficulty: 'Intermediate',
            numExercises: 4,
        });
        const muscles = new Set(out.workout.exercises.map((e) => e.bodyPart));
        expect(muscles.has('Chest')).toBe(true);
        expect(muscles.has('Lats')).toBe(true);
    });

    it('respects per-muscle difficulty overrides', async () => {
        const user = await makeUser(getPostgres().pool);
        const out = await useCase.execute({
            userId: user.id,
            muscleGroups: ['Chest', 'Lats'],
            difficultyByMuscle: { Chest: 'Expert', Lats: 'Beginner' },
            numExercises: 4,
        });
        const chest = out.workout.exercises.filter((e) => e.bodyPart === 'Chest');
        const lats = out.workout.exercises.filter((e) => e.bodyPart === 'Lats');
        expect(chest.every((e) => e.level === 'Expert')).toBe(true);
        expect(lats.every((e) => e.level === 'Beginner')).toBe(true);
    });

    it('throws ValidationError when no exercises match', async () => {
        const user = await makeUser(getPostgres().pool);
        await expect(
            useCase.execute({
                userId: user.id,
                muscleGroups: ['Neck'],
                difficulty: 'Expert',
                numExercises: 3,
            }),
        ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError on unknown muscle in difficultyByMuscle', async () => {
        const user = await makeUser(getPostgres().pool);
        await expect(
            useCase.execute({
                userId: user.id,
                muscleGroups: ['Chest'],
                difficultyByMuscle: { NotAMuscle: 'Expert' },
                numExercises: 3,
            }),
        ).rejects.toThrow(ValidationError);
    });
});
