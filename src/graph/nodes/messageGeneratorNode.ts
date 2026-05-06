import { AIMessage } from 'langchain';
import { getSystemPrompt, getUserPromptTemplate, MessageSchema } from '../../prompts/v1/messageGenerator.ts';
import { OpenRouterService } from '../../services/openRouterService.ts';
import { formatWorkout, formatWorkoutSummaryList } from '../../services/workoutFormatter.ts';
import type { WorkoutWithExercises } from '../../services/workoutService.ts';
import type { GraphState } from '../graph.ts';

function resolveScenario(state: GraphState): string {
    if (state.actionError === 'invalid_cpf') return 'ask_for_cpf_invalid';
    if (state.missingSlots?.length) {
        return `ask_for_${state.missingSlots[0]}`;
    }
    if (!state.intent || state.intent === 'unknown' || state.error) {
        return 'unknown';
    }
    if (state.actionError === 'no_match') {
        return 'no_workout_match';
    }
    const outcome = state.actionSuccess ? 'success' : 'error';
    return `${state.intent}_${outcome}`;
}

function isWorkoutWithExercises(value: unknown): value is WorkoutWithExercises {
    return !!value
        && typeof value === 'object'
        && 'exercises' in (value as Record<string, unknown>)
        && Array.isArray((value as { exercises: unknown }).exercises);
}

function deterministicResponse(state: GraphState, scenario: string): string | null {
    const data = state.actionData;
    if (!data) return null;

    if (scenario === 'create_workout_success' || scenario === 'get_workout_success') {
        if (isWorkoutWithExercises(data)) return formatWorkout(data);
    }

    if (scenario === 'list_workouts_success') {
        if (typeof data === 'object' && data !== null) {
            const obj = data as { single?: unknown; multiple?: unknown; filterMuscleGroups?: string[] };
            if (isWorkoutWithExercises(obj.single)) {
                return formatWorkout(obj.single);
            }
            if (Array.isArray(obj.multiple)) {
                return formatWorkoutSummaryList(obj.multiple as any[], obj.filterMuscleGroups);
            }
        }
    }

    return null;
}

export function createMessageGeneratorNode(llmClient: OpenRouterService) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        console.log('💬 Generating response message...');

        try {
            const scenario = resolveScenario(state);
            console.log(`📝 Scenario: ${scenario}`);

            const direct = deterministicResponse(state, scenario);
            if (direct) {
                console.log(`✅ Deterministic response used for ${scenario}`);
                return {
                    messages: [
                        ...state.messages,
                        new AIMessage(direct),
                    ],
                };
            }

            const details: Record<string, unknown> = {
                intent: state.intent,
                missingSlots: state.missingSlots,
                slots: state.slots,
                actionData: state.actionData,
                actionError: state.actionError,
                retrievedExercises: state.retrievedExercises?.slice(0, 8),
                workoutCandidates: state.workoutCandidates,
                error: state.error,
            };

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
