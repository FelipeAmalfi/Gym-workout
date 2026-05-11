import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { getPostgres, truncateAll } from '../../setup/postgres.ts';
import { PgUserProfileRepository } from '../../../src/infrastructure/database/repositories/PgUserProfileRepository.ts';
import { makeUser } from '../../helpers/factories.ts';

describe('PgUserProfileRepository', () => {
    let repo: PgUserProfileRepository;

    beforeAll(() => {
        repo = new PgUserProfileRepository(getPostgres().pool);
    });

    beforeEach(async () => {
        await truncateAll(getPostgres().pool);
    });

    it('returns null for unknown user', async () => {
        expect(await repo.get(99_999)).toBeNull();
    });

    it('upserts preferences then reads them back', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);

        const saved = await repo.upsert(user.id, {
            preferredMuscles: ['Chest', 'Back'],
            preferredDifficulty: 'Expert',
            defaultNumExercises: 6,
        });
        expect(saved.preferredMuscles).toEqual(['Chest', 'Back']);
        expect(saved.preferredDifficulty).toBe('Expert');
        expect(saved.defaultNumExercises).toBe(6);

        const reloaded = await repo.get(user.id);
        expect(reloaded?.preferredMuscles).toEqual(['Chest', 'Back']);
    });

    it('merges partial updates without overwriting unrelated fields', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);

        await repo.upsert(user.id, { preferredMuscles: ['Chest'], preferredDifficulty: 'Beginner' });
        await repo.upsert(user.id, { defaultNumExercises: 8 });

        const out = await repo.get(user.id);
        expect(out?.preferredMuscles).toEqual(['Chest']);
        expect(out?.preferredDifficulty).toBe('Beginner');
        expect(out?.defaultNumExercises).toBe(8);
    });

    it('updateSummary writes lastSummary', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);

        await repo.updateSummary(user.id, 'User wants chest workouts.');
        const out = await repo.get(user.id);
        expect(out?.lastSummary).toBe('User wants chest workouts.');
        expect(out?.lastSummaryAt).toBeDefined();
    });

    it('cascades when user is deleted', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);
        await repo.upsert(user.id, { preferredMuscles: ['Chest'] });

        await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
        expect(await repo.get(user.id)).toBeNull();
    });
});
