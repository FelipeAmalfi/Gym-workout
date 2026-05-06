import { getSystemPrompt, getUserPromptTemplate, IntentSchema } from '../../prompts/v1/identifyIntent.ts';
import { OpenRouterService } from '../../services/openRouterService.ts';
import type { GraphState } from '../graph.ts';

const REQUIRED_SLOTS_BY_INTENT: Record<string, string[]> = {
    create_workout: ['muscleGroups_or_goal'],
    update_workout: ['workout_reference'],
    delete_workout: ['workout_reference'],
    get_workout: ['workout_reference'],
    list_workouts: [],
};

function computeMissingSlots(
    intent: string,
    slots: GraphState['slots'],
    workoutCandidates: GraphState['workoutCandidates'],
): string[] {
    const required = REQUIRED_SLOTS_BY_INTENT[intent] ?? [];
    const missing: string[] = [];

    for (const slot of required) {
        if (slot === 'muscleGroups_or_goal') {
            if (!slots?.muscleGroups?.length && !slots?.goal) {
                missing.push('muscleGroups_or_goal');
            }
        } else if (slot === 'workout_reference') {
            const hasCandidates = (workoutCandidates?.length ?? 0) > 0;
            const hasReference =
                slots?.workoutId != null ||
                (slots?.muscleGroups?.length ?? 0) > 0 ||
                (slots?.selectionRef != null && slots.selectionRef !== '') ||
                hasCandidates;
            if (!hasReference) {
                missing.push('workout_reference');
            }
        }
    }

    return missing;
}

export function createIdentifyIntentNode(llmClient: OpenRouterService) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        console.log('🔍 Identifying intent...');

        const lastMessage = state.messages.at(-1);
        const input = typeof lastMessage?.content === 'string'
            ? lastMessage.content
            : JSON.stringify(lastMessage?.content ?? '');

        try {
            const systemPrompt = getSystemPrompt();
            const userPrompt = getUserPromptTemplate(input);

            const result = await llmClient.generateStructured(
                systemPrompt,
                userPrompt,
                IntentSchema,
            );

            if (!result.success || !result.data) {
                console.log(`⚠️  Intent identification failed: ${result.error}`);
                return { intent: 'unknown', error: result.error };
            }

            const { intent, slots: newSlots } = result.data;
            console.log(`✅ Intent identified: ${intent}`);

            const mergedSlots = { ...state.slots, ...newSlots };
            const missingSlots = intent !== 'unknown'
                ? computeMissingSlots(intent, mergedSlots, state.workoutCandidates)
                : [];

            if (missingSlots.length > 0) {
                console.log(`⚠️  Missing slots: ${missingSlots.join(', ')}`);
            }

            return { intent, slots: mergedSlots, missingSlots };
        } catch (error) {
            console.error('❌ Error in identifyIntentNode:', error);
            return {
                intent: 'unknown',
                error: error instanceof Error ? error.message : 'Intent identification failed',
            };
        }
    };
}
