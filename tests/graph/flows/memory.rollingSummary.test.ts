import { describe, it, expect, beforeEach } from 'vitest';
import { getPostgres, truncateAll } from '../../setup/postgres.ts';
import { buildTestContainer } from '../../setup/container.ts';
import { invokeTurn, seedFixtureExercises } from '../../helpers/flow.ts';
import { MockLlmAdapter } from '../../mocks/MockLlmAdapter.ts';
import { makeUser } from '../../helpers/factories.ts';
import { newThreadId } from '../../helpers/chat.ts';
import { MESSAGE_WINDOW } from '../../../src/interface/graph/nodes/summarizeIfNeededNode.ts';

describe('rolling summary memory', () => {
    beforeEach(async () => {
        await truncateAll(getPostgres().pool);
        await seedFixtureExercises(getPostgres().pool);
    });

    it('produces a summary once the message window is exceeded', async () => {
        const pool = getPostgres().pool;
        const user = await makeUser(pool);

        const llm = new MockLlmAdapter()
            .onIntent(/list/i, { intent: 'list_workouts', slots: {} })
            .onIntent(/chest|create/i, { intent: 'create_workout', slots: { muscleGroups: ['Chest'], difficulty: 'Beginner' } })
            .onSummary(/transcript_to_compress/, {
                user_facts: ['User prefers Chest workouts.'],
                decisions: ['Beginner difficulty.'],
                unresolved_questions: [],
            });

        const { container } = buildTestContainer({ llm });
        const thread = newThreadId('summary');

        // Drive enough turns to exceed MESSAGE_WINDOW = 12 messages (each turn produces 2 messages).
        const requiredTurns = Math.ceil((MESSAGE_WINDOW + 2) / 2);
        let last;
        for (let i = 0; i < requiredTurns; i++) {
            last = await invokeTurn(container, i % 2 === 0 ? 'list my workouts' : 'create a chest workout', thread, user.id);
        }
        expect(last).toBeDefined();
        expect(last!.conversation.summary ?? '').toContain('Chest');
        expect(llm.summaryCalls().length).toBeGreaterThan(0);
    });
});
