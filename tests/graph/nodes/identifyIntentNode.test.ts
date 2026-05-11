import { describe, it, expect } from 'vitest';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { createIdentifyIntentNode } from '../../../src/interface/graph/nodes/identifyIntentNode.ts';
import { ClassifyIntentUseCase } from '../../../src/core/application/use-cases/chat/ClassifyIntentUseCase.ts';
import { MockLlmAdapter } from '../../mocks/MockLlmAdapter.ts';
import { EMPTY_WORKFLOW, EMPTY_USER_CONTEXT, EMPTY_CONVERSATION, type GraphState } from '../../../src/interface/graph/state.ts';

function baseState(overrides: Partial<GraphState> = {}): GraphState {
    return {
        messages: [new HumanMessage('hello')],
        userContext: EMPTY_USER_CONTEXT,
        conversation: EMPTY_CONVERSATION,
        workflow: EMPTY_WORKFLOW,
        turn: {},
        ...overrides,
    } as GraphState;
}

describe('identifyIntentNode', () => {
    it('routes create_workout and flags muscleGroups_or_goal as missing when none provided', async () => {
        const llm = new MockLlmAdapter().onIntent(/Create.*workout/, {
            intent: 'create_workout',
            slots: {},
        });
        const node = createIdentifyIntentNode(new ClassifyIntentUseCase(llm));

        const out = await node(baseState({ messages: [new HumanMessage('Create me a workout')] }));
        expect(out.workflow?.intent).toBe('create_workout');
        expect(out.workflow?.missingSlots).toContain('muscleGroups_or_goal');
    });

    it('merges incoming slots over previous slots without erasing them', async () => {
        const llm = new MockLlmAdapter().onIntent(/Beginner/, {
            intent: 'create_workout',
            slots: { difficulty: 'Beginner' },
        });
        const node = createIdentifyIntentNode(new ClassifyIntentUseCase(llm));

        const prev = baseState({
            workflow: { intent: 'create_workout', slots: { muscleGroups: ['Chest'] }, missingSlots: [] },
            messages: [new HumanMessage('Beginner')],
        });
        const out = await node(prev);
        expect(out.workflow?.slots.muscleGroups).toEqual(['Chest']);
        expect(out.workflow?.slots.difficulty).toBe('Beginner');
        expect(out.workflow?.missingSlots).not.toContain('muscleGroups_or_goal');
    });

    it('upgrades pure selectionRef after a list_workouts turn into get_workout', async () => {
        const llm = new MockLlmAdapter().onIntent(/second/, {
            intent: 'list_workouts',
            slots: { selectionRef: 'second' },
        });
        const node = createIdentifyIntentNode(new ClassifyIntentUseCase(llm));

        const state = baseState({
            workflow: {
                priorIntent: 'list_workouts',
                slots: {},
                missingSlots: [],
                workoutCandidates: [
                    { id: 1, name: 'A', muscleGroups: ['Chest'] },
                    { id: 2, name: 'B', muscleGroups: ['Back'] },
                ],
            },
            messages: [new AIMessage('Which one?'), new HumanMessage('the second one')],
        });
        const out = await node(state);
        expect(out.workflow?.intent).toBe('get_workout');
    });

    it('falls back to unknown intent when classifier throws', async () => {
        const llm = new MockLlmAdapter(); // default → unknown intent
        const node = createIdentifyIntentNode(new ClassifyIntentUseCase(llm));
        const out = await node(baseState());
        expect(out.workflow?.intent).toBe('unknown');
    });
});
