import { AIMessage } from 'langchain';
import type { ClassifyIntentUseCase } from '../../../core/application/use-cases/chat/ClassifyIntentUseCase.ts';
import { getConversation, getUserContext, getWorkflow, type GraphState, type Slots } from '../state.ts';
import { computeRequiredMissingSlots } from '../helpers.ts';

function getLastAssistantMessage(messages: GraphState['messages']): string | undefined {
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg instanceof AIMessage) {
            return typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        }
    }
    return undefined;
}

function isMeaningful(value: unknown): boolean {
    if (value == null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
    return true;
}

function mergeSlots(prev: Slots, incoming: Partial<Slots>): Slots {
    const merged: Record<string, unknown> = { ...prev };
    for (const [key, value] of Object.entries(incoming)) {
        if (isMeaningful(value)) merged[key] = value;
    }
    return merged as Slots;
}

export function createIdentifyIntentNode(classifyIntent: ClassifyIntentUseCase) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const workflow = getWorkflow(state);
        const userContext = getUserContext(state);
        const conversation = getConversation(state);

        const lastMessage = state.messages.at(-1);
        const input = typeof lastMessage?.content === 'string'
            ? lastMessage.content
            : JSON.stringify(lastMessage?.content ?? '');

        try {
            const data = await classifyIntent.execute({
                message: input,
                priorIntent: workflow.priorIntent ?? workflow.intent,
                priorAssistantMessage: getLastAssistantMessage(state.messages),
                hasPendingWorkoutList: (workflow.workoutCandidates?.length ?? 0) > 0,
                userIsIdentified: userContext.isIdentified,
                userName: userContext.userName,
                summary: conversation.summary,
                userPreferences: userContext.preferences,
            });

            let { intent } = data;
            const newSlots = data.slots ?? {};

            const hadPendingList = (workflow.workoutCandidates?.length ?? 0) > 0;
            const isPureSelection = !!newSlots.selectionRef;

            if (
                workflow.priorIntent === 'list_workouts' &&
                hadPendingList &&
                isPureSelection &&
                intent !== 'unknown'
            ) {
                intent = 'get_workout';
            }

            const mergedSlots = mergeSlots(workflow.slots, newSlots);
            const missingSlots = computeRequiredMissingSlots(intent, mergedSlots, workflow.workoutCandidates);

            return {
                workflow: {
                    ...workflow,
                    intent,
                    slots: mergedSlots,
                    missingSlots,
                },
                turn: {},
            };
        } catch (error) {
            return {
                workflow: { ...workflow, intent: 'unknown' },
                turn: {
                    error: error instanceof Error ? error.message : 'Intent identification failed',
                },
            };
        }
    };
}
