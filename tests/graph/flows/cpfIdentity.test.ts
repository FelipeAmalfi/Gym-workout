import { describe, it, expect, beforeEach } from 'vitest';
import { getPostgres, truncateAll } from '../../setup/postgres.ts';
import { buildTestContainer } from '../../setup/container.ts';
import { invokeTurn, seedFixtureExercises } from '../../helpers/flow.ts';
import { MockLlmAdapter } from '../../mocks/MockLlmAdapter.ts';
import { newThreadId } from '../../helpers/chat.ts';

const VALID_CPF = '11144477735';

describe('CPF identity flow', () => {
    beforeEach(async () => {
        await truncateAll(getPostgres().pool);
        await seedFixtureExercises(getPostgres().pool);
    });

    it('asks for CPF on first unidentified turn and resolves after CPF+name provided', async () => {
        const llm = new MockLlmAdapter()
            .onIntent(/create.*chest/i, { intent: 'create_workout', slots: { muscleGroups: ['Chest'] } })
            .onIntent(/11144477735|111\.444/i, {
                intent: 'create_workout',
                slots: { cpf: VALID_CPF },
            })
            .onIntent(/alice/i, {
                intent: 'create_workout',
                slots: { userName: 'Alice' },
            })
            .defaultMessage({ message: 'Default mock reply (long enough).' });

        const { container } = buildTestContainer({ llm });
        const thread = newThreadId('cpf');

        const turn1 = await invokeTurn(container, 'Create me a chest workout', thread);
        expect(turn1.intent).toBe('create_workout');
        expect(turn1.missingSlots).toContain('cpf');

        const turn2 = await invokeTurn(container, VALID_CPF, thread);
        expect(turn2.missingSlots).toContain('name');
        expect(turn2.missingSlots).not.toContain('cpf');

        const turn3 = await invokeTurn(container, 'My name is Alice', thread);
        expect(turn3.userContext.isIdentified).toBe(true);
        expect(turn3.userContext.userName).toBe('Alice');
        expect(turn3.missingSlots).not.toContain('cpf');
        expect(turn3.missingSlots).not.toContain('name');
    });

    it('asks for CPF again when user provides an invalid CPF', async () => {
        const llm = new MockLlmAdapter()
            .onIntent(/create.*chest/i, { intent: 'create_workout', slots: { muscleGroups: ['Chest'] } })
            .onIntent(/000|invalid/i, { intent: 'create_workout', slots: { cpf: '00000000000' } });

        const { container } = buildTestContainer({ llm });
        const thread = newThreadId('cpf-invalid');

        await invokeTurn(container, 'Create me a chest workout', thread);
        const second = await invokeTurn(container, 'My CPF is 00000000000', thread);

        expect(second.missingSlots).toContain('cpf');
    });

    it('does not re-ask for CPF in subsequent turns once user is identified', async () => {
        const llm = new MockLlmAdapter()
            .onIntent(/chest/i, { intent: 'create_workout', slots: { muscleGroups: ['Chest'] } })
            .onIntent(/11144477735/, { intent: 'create_workout', slots: { cpf: VALID_CPF } })
            .onIntent(/alice/i, { intent: 'create_workout', slots: { userName: 'Alice' } })
            .onIntent(/list/i, { intent: 'list_workouts', slots: {} });

        const { container } = buildTestContainer({ llm });
        const thread = newThreadId('cpf-stick');

        await invokeTurn(container, 'create a chest workout', thread);
        await invokeTurn(container, VALID_CPF, thread);
        await invokeTurn(container, 'Alice', thread);
        const last = await invokeTurn(container, 'list my workouts', thread);

        expect(last.userContext.isIdentified).toBe(true);
        expect(last.missingSlots ?? []).not.toContain('cpf');
        expect(last.missingSlots ?? []).not.toContain('name');
    });
});
