import { describe, it, expect, beforeEach } from 'vitest';
import { getPostgres, truncateAll } from '../../setup/postgres.ts';
import { buildTestContainer } from '../../setup/container.ts';
import { invokeTurn, seedFixtureExercises } from '../../helpers/flow.ts';
import { MockLlmAdapter } from '../../mocks/MockLlmAdapter.ts';
import { makeUser } from '../../helpers/factories.ts';
import { newThreadId } from '../../helpers/chat.ts';
import { assertWorkoutShape } from '../../helpers/assertions.ts';

describe('create_workout multi-muscle fan-out', () => {
    beforeEach(async () => {
        await truncateAll(getPostgres().pool);
        await seedFixtureExercises(getPostgres().pool);
    });

    it('builds a workout drawing exercises from multiple muscles', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);

        const llm = new MockLlmAdapter().onIntent(/chest.*lats|lats.*chest/i, {
            intent: 'create_workout',
            slots: { muscleGroups: ['Chest', 'Lats'], difficulty: 'Intermediate', numExercises: 4 },
        });

        const { container } = buildTestContainer({ llm });
        const thread = newThreadId('multi-muscle');

        const out = await invokeTurn(container, 'Create chest and lats workout', thread, user.id);
        expect(out.actionSuccess).toBe(true);
        assertWorkoutShape(out.actionData);

        const muscles = new Set(
            (out.actionData as { exercises: Array<{ bodyPart: string | null }> }).exercises
                .map((e) => e.bodyPart),
        );
        expect(muscles.has('Chest')).toBe(true);
        expect(muscles.has('Lats')).toBe(true);
    });
});
