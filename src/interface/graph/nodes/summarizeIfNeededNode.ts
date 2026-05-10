import { RemoveMessage } from '@langchain/core/messages';
import type { SummarizeConversationUseCase } from '../../../core/application/use-cases/chat/SummarizeConversationUseCase.ts';
import type { UpdateUserProfileUseCase } from '../../../core/application/use-cases/user/UpdateUserProfileUseCase.ts';
import { getConversation, getUserContext, type GraphState } from '../state.ts';

export const MESSAGE_WINDOW = 12;
export const MESSAGES_TO_FOLD = 6;

export function createSummarizeIfNeededNode(
    summarize: SummarizeConversationUseCase,
    updateUserProfile: UpdateUserProfileUseCase,
) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const messages = state.messages;
        if (messages.length <= MESSAGE_WINDOW) return {};

        const conversation = getConversation(state);
        const userContext = getUserContext(state);

        const oldest = messages.slice(0, MESSAGES_TO_FOLD);
        try {
            const result = await summarize.execute({
                messages: oldest,
                priorSummary: conversation.summary,
            });

            if (userContext.userId != null && result.summary) {
                try {
                    await updateUserProfile.saveSummary(userContext.userId, result.summary);
                } catch {
                    // non-critical
                }
            }

            const removals = oldest
                .map((m) => m.id)
                .filter((id): id is string => typeof id === 'string')
                .map((id) => new RemoveMessage({ id }));

            return {
                conversation: {
                    summary: result.summary || conversation.summary,
                    summarizedTurns: conversation.summarizedTurns + result.turnsCovered,
                },
                ...(removals.length ? { messages: removals } : {}),
            };
        } catch {
            return {};
        }
    };
}
