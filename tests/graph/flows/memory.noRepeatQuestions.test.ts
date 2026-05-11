import { describe, it, expect, beforeEach } from 'vitest';
import { getPostgres, truncateAll } from '../../setup/postgres.ts';
import { buildTestContainer } from '../../setup/container.ts';
import { invokeTurn, seedFixtureExercises } from '../../helpers/flow.ts';
import { MockLlmAdapter } from '../../mocks/MockLlmAdapter.ts';
import { makeUser } from '../../helpers/factories.ts';
import { newThreadId } from '../../helpers/chat.ts';

describe('no repeated questions for resolved slots', () => {
    beforeEach(async () => {
        await truncateAll(getPostgres().pool);
        await seedFixtureExercises(getPostgres().pool);
    });

    it('does not re-prompt for muscleGroups after they are provided', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);

        const llm = new MockLlmAdapter()
            .onIntent(/want a workout/i, { intent: 'create_workout', slots: {} })
            .onIntent(/chest/i, { intent: 'create_workout', slots: { muscleGroups: ['Chest'], difficulty: 'Beginner' } })
            .onIntent(/another/i, { intent: 'create_workout', slots: { muscleGroups: ['Lats'], difficulty: 'Beginner' } });

        const { container } = buildTestContainer({ llm });
        const thread = newThreadId('no-repeat');

        const t1 = await invokeTurn(container, 'I want a workout', thread, user.id);
        expect(t1.missingSlots).toContain('muscleGroups_or_goal');

        const t2 = await invokeTurn(container, 'Chest, beginner', thread, user.id);
        expect(t2.missingSlots).not.toContain('muscleGroups_or_goal');
        expect(t2.actionSuccess).toBe(true);

        const t3 = await invokeTurn(container, 'Create another one for lats', thread, user.id);
        expect(t3.missingSlots).not.toContain('muscleGroups_or_goal');
        expect(t3.actionSuccess).toBe(true);
    });
});
