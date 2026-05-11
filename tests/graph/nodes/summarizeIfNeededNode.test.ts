import { describe, it, expect } from 'vitest';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { createSummarizeIfNeededNode, MESSAGE_WINDOW } from '../../../src/interface/graph/nodes/summarizeIfNeededNode.ts';
import { SummarizeConversationUseCase } from '../../../src/core/application/use-cases/chat/SummarizeConversationUseCase.ts';
import { UpdateUserProfileUseCase } from '../../../src/core/application/use-cases/user/UpdateUserProfileUseCase.ts';
import { MockLlmAdapter } from '../../mocks/MockLlmAdapter.ts';
import { EMPTY_CONVERSATION, EMPTY_USER_CONTEXT, EMPTY_WORKFLOW, type GraphState } from '../../../src/interface/graph/state.ts';
import type { UserProfileRepository } from '../../../src/core/application/ports/UserProfileRepository.ts';

const fakeProfileRepo: UserProfileRepository = {
    async get() { return null; },
    async upsert() { return { userId: 0 }; },
    async updateSummary() { /* no-op */ },
};

function buildState(messageCount: number): GraphState {
    const msgs = [];
    for (let i = 0; i < messageCount; i++) {
        msgs.push(i % 2 === 0
            ? new HumanMessage({ content: `user ${i}`, id: `u-${i}` })
            : new AIMessage({ content: `assistant ${i}`, id: `a-${i}` }));
    }
    return {
        messages: msgs,
        userContext: { ...EMPTY_USER_CONTEXT, userId: 1, isIdentified: true },
        conversation: EMPTY_CONVERSATION,
        workflow: EMPTY_WORKFLOW,
        turn: {},
    } as GraphState;
}

describe('summarizeIfNeededNode', () => {
    it('no-ops when below the message window', async () => {
        const llm = new MockLlmAdapter();
        const node = createSummarizeIfNeededNode(
            new SummarizeConversationUseCase(llm),
            new UpdateUserProfileUseCase(fakeProfileRepo),
        );
        const out = await node(buildState(MESSAGE_WINDOW));
        expect(out).toEqual({});
        expect(llm.summaryCalls()).toHaveLength(0);
    });

    it('summarizes and updates conversation.summary when window exceeded', async () => {
        const llm = new MockLlmAdapter().onSummary(/transcript_to_compress/, {
            user_facts: ['Alice wants chest workouts'],
            decisions: ['Beginner difficulty'],
            unresolved_questions: [],
        });
        const node = createSummarizeIfNeededNode(
            new SummarizeConversationUseCase(llm),
            new UpdateUserProfileUseCase(fakeProfileRepo),
        );
        const out = await node(buildState(MESSAGE_WINDOW + 2));
        expect(out.conversation?.summary).toContain('Alice wants chest workouts');
        expect(out.conversation?.summarizedTurns).toBeGreaterThan(0);
        expect(llm.summaryCalls()).toHaveLength(1);
    });
});
