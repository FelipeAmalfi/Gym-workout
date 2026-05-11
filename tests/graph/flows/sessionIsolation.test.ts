import { describe, it, expect, beforeEach } from 'vitest';
import { getPostgres, truncateAll } from '../../setup/postgres.ts';
import { buildTestContainer } from '../../setup/container.ts';
import { invokeTurn, seedFixtureExercises } from '../../helpers/flow.ts';
import { MockLlmAdapter } from '../../mocks/MockLlmAdapter.ts';
import { makeUser } from '../../helpers/factories.ts';
import { newThreadId } from '../../helpers/chat.ts';

describe('session isolation between thread ids', () => {
    beforeEach(async () => {
        await truncateAll(getPostgres().pool);
        await seedFixtureExercises(getPostgres().pool);
    });

    it('two threads do not share workflow.slots state', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);

        const llm = new MockLlmAdapter()
            .onIntent(/chest/i, { intent: 'create_workout', slots: { muscleGroups: ['Chest'], difficulty: 'Beginner' } })
            .onIntent(/^second$|just create/i, { intent: 'create_workout', slots: {} });

        const { container } = buildTestContainer({ llm });
        const threadA = newThreadId('a');
        const threadB = newThreadId('b');

        const a = await invokeTurn(container, 'create a chest workout for beginners', threadA, user.id);
        expect(a.actionSuccess).toBe(true);

        // Thread B should NOT inherit muscleGroups from thread A.
        const b = await invokeTurn(container, 'just create one for me', threadB, user.id);
        expect(b.missingSlots).toContain('muscleGroups_or_goal');
        expect(b.actionSuccess).not.toBe(true);
    });
});
