import { describe, it, expect, beforeEach } from 'vitest';
import { getPostgres, truncateAll } from '../../setup/postgres.ts';
import { buildTestContainer } from '../../setup/container.ts';
import { invokeTurn, seedFixtureExercises } from '../../helpers/flow.ts';
import { MockLlmAdapter } from '../../mocks/MockLlmAdapter.ts';
import { makeUser } from '../../helpers/factories.ts';
import { newThreadId } from '../../helpers/chat.ts';
import { assertWorkoutShape } from '../../helpers/assertions.ts';

describe('create_workout mixed difficulty per muscle', () => {
    beforeEach(async () => {
        await truncateAll(getPostgres().pool);
        await seedFixtureExercises(getPostgres().pool);
    });

    it('respects difficultyByMuscle: Expert Chest + Beginner Lats', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);

        const llm = new MockLlmAdapter().onIntent(/expert chest.*beginner lats/i, {
            intent: 'create_workout',
            slots: {
                muscleGroups: ['Chest', 'Lats'],
                difficultyByMuscle: { Chest: 'Expert', Lats: 'Beginner' },
                numExercises: 4,
            },
        });

        const { container } = buildTestContainer({ llm });
        const thread = newThreadId('mixed-difficulty');
        const out = await invokeTurn(container, 'Expert chest and Beginner lats', thread, user.id);

        expect(out.actionSuccess).toBe(true);
        assertWorkoutShape(out.actionData);

        const exercises = (out.actionData as { exercises: Array<{ bodyPart: string | null; level: string | null }> }).exercises;
        const chestLevels = new Set(exercises.filter((e) => e.bodyPart === 'Chest').map((e) => e.level));
        const latsLevels = new Set(exercises.filter((e) => e.bodyPart === 'Lats').map((e) => e.level));
        expect(chestLevels).toEqual(new Set(['Expert']));
        expect(latsLevels).toEqual(new Set(['Beginner']));
    });
});
