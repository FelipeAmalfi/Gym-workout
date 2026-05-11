import { describe, it, expect, beforeEach } from 'vitest';
import { getPostgres, truncateAll } from '../../setup/postgres.ts';
import { buildTestContainer } from '../../setup/container.ts';
import { invokeTurn, seedFixtureExercises } from '../../helpers/flow.ts';
import { MockLlmAdapter } from '../../mocks/MockLlmAdapter.ts';
import { makeUser } from '../../helpers/factories.ts';
import { newThreadId } from '../../helpers/chat.ts';
import { assertWorkoutShape } from '../../helpers/assertions.ts';

describe('create_workout multi-turn slot filling', () => {
    beforeEach(async () => {
        await truncateAll(getPostgres().pool);
        await seedFixtureExercises(getPostgres().pool);
    });

    it('asks for muscleGroups when missing, then creates the workout once provided', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);

        const llm = new MockLlmAdapter()
            .onIntent(/^.+want.+workout|create.+workout/i, {
                intent: 'create_workout',
                slots: {},
            })
            .onIntent(/chest|biceps/i, {
                intent: 'create_workout',
                slots: { muscleGroups: ['Chest'], difficulty: 'Beginner' },
            });

        const { container } = buildTestContainer({ llm });
        const thread = newThreadId('multi-turn');

        const first = await invokeTurn(container, 'I want a workout', thread, user.id);
        expect(first.intent).toBe('create_workout');
        expect(first.missingSlots).toContain('muscleGroups_or_goal');
        expect(first.actionSuccess).not.toBe(true);

        const second = await invokeTurn(container, 'Chest, beginner', thread, user.id);
        expect(second.intent).toBe('create_workout');
        expect(second.actionSuccess).toBe(true);
        assertWorkoutShape(second.actionData);
        expect((second.actionData as { exercises: unknown[] }).exercises.length).toBeGreaterThan(0);
    });
});
