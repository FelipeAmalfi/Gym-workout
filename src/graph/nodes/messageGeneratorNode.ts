import { AIMessage } from 'langchain';
import { getSystemPrompt, getUserPromptTemplate, MessageSchema } from '../../prompts/v1/messageGenerator.ts';
import { OpenRouterService } from '../../services/openRouterService.ts';
import type { GraphState } from '../graph.ts';

function resolveScenario(state: GraphState): string {
    if (state.missingSlots?.length) {
        return `ask_for_${state.missingSlots[0]}`;
    }
    if (!state.intent || state.intent === 'unknown' || state.error) {
        return 'unknown';
    }
    const outcome = state.actionSuccess ? 'success' : 'error';
    return `${state.intent}_${outcome}`;
}

export function createMessageGeneratorNode(llmClient: OpenRouterService) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        console.log('💬 Generating response message...');

        try {
            const scenario = resolveScenario(state);
            const details: Record<string, unknown> = {
                intent: state.intent,
                missingSlots: state.missingSlots,
                slots: state.slots,
                actionData: state.actionData,
                actionError: state.actionError,
                retrievedExercises: state.retrievedExercises?.slice(0, 8),
                error: state.error,
            };

            console.log(`📝 Scenario: ${scenario}`);

            const systemPrompt = getSystemPrompt();
            const userPrompt = getUserPromptTemplate({ scenario, details });

            const result = await llmClient.generateStructured(
                systemPrompt,
                userPrompt,
                MessageSchema,
            );

            if (!result.success || !result.data) {
                console.log(`⚠️  Message generation failed: ${result.error}`);
                return {
                    messages: [
                        ...state.messages,
                        new AIMessage('Sorry, I encountered an issue generating a response. Please try again.'),
                    ],
                };
            }

            console.log(`✅ Message generated`);

            return {
                messages: [
                    ...state.messages,
                    new AIMessage(result.data.message),
                ],
            };
        } catch (error) {
            console.error('❌ Error in messageGeneratorNode:', error);
            return {
                messages: [
                    ...state.messages,
                    new AIMessage('An error occurred. Please try again.'),
                ],
            };
        }
    };
}
