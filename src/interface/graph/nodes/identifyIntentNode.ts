import { AIMessage } from 'langchain';
import type { ClassifyIntentUseCase } from '../../../core/application/use-cases/chat/ClassifyIntentUseCase.ts';
import type { GraphState } from '../state.ts';

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
            if (!hasReference) missing.push('workout_reference');
        }
    }

    return missing;
}

function getLastAssistantMessage(messages: GraphState['messages']): string | undefined {
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg instanceof AIMessage) {
            return typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        }
    }
    return undefined;
}

export function createIdentifyIntentNode(classifyIntent: ClassifyIntentUseCase) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const lastMessage = state.messages.at(-1);
        const input = typeof lastMessage?.content === 'string'
            ? lastMessage.content
            : JSON.stringify(lastMessage?.content ?? '');

        try {
            const data = await classifyIntent.execute({
                message: input,
                priorIntent: state.intent,
                priorAssistantMessage: getLastAssistantMessage(state.messages),
                hasPendingWorkoutList: (state.workoutCandidates?.length ?? 0) > 0,
            });

            let { intent } = data;
            const newSlots = data.slots ?? {};

            const hadPendingList = (state.workoutCandidates?.length ?? 0) > 0;
            const isPureSelection = !!newSlots.selectionRef;

            if (
                state.intent === 'list_workouts' &&
                hadPendingList &&
                isPureSelection &&
                intent !== 'unknown'
            ) {
                intent = 'get_workout';
            }

            const mergedSlots = { ...state.slots, ...newSlots };
            const missingSlots = intent !== 'unknown'
                ? computeMissingSlots(intent, mergedSlots, state.workoutCandidates)
                : [];

            return {
                intent,
                slots: mergedSlots,
                missingSlots,
                actionSuccess: undefined,
                actionError: undefined,
                actionData: undefined,
                error: undefined,
            };
        } catch (error) {
            return {
                intent: 'unknown',
                error: error instanceof Error ? error.message : 'Intent identification failed',
                actionSuccess: undefined,
                actionError: undefined,
                actionData: undefined,
            };
        }
    };
}
