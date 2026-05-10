import { AIMessage } from 'langchain';
import type { GenerateMessageUseCase } from '../../../core/application/use-cases/chat/GenerateMessageUseCase.ts';
import {
    formatWorkout,
    formatWorkoutSummaryList,
} from '../../../shared/formatting/WorkoutPresenter.ts';
import type { WorkoutWithExercises, WorkoutSummary } from '../../../core/domain/entities/Workout.ts';
import { getConversation, getTurn, getUserContext, getWorkflow, type GraphState } from '../state.ts';

interface ScenarioInputs {
    intent: string | undefined;
    missingSlots: string[];
    actionSuccess: boolean | undefined;
    actionError: string | undefined;
    error: string | undefined;
}

function resolveScenario(inputs: ScenarioInputs): string {
    if (inputs.actionError === 'invalid_cpf') return 'ask_for_cpf_invalid';
    if (inputs.missingSlots.length) return `ask_for_${inputs.missingSlots[0]}`;
    if (!inputs.intent || inputs.intent === 'unknown' || inputs.error) return 'unknown';
    if (inputs.actionError === 'no_match') return 'no_workout_match';
    const outcome = inputs.actionSuccess ? 'success' : 'error';
    return `${inputs.intent}_${outcome}`;
}

function isWorkoutWithExercises(value: unknown): value is WorkoutWithExercises {
    return !!value
        && typeof value === 'object'
        && 'exercises' in (value as Record<string, unknown>)
        && Array.isArray((value as { exercises: unknown }).exercises);
}

function deterministicResponse(actionData: unknown, scenario: string): string | null {
    if (!actionData) return null;

    if (scenario === 'create_workout_success' || scenario === 'get_workout_success') {
        if (isWorkoutWithExercises(actionData)) return formatWorkout(actionData);
    }

    if (scenario === 'list_workouts_success') {
        if (typeof actionData === 'object' && actionData !== null) {
            const obj = actionData as { single?: unknown; multiple?: unknown; filterMuscleGroups?: string[] };
            if (isWorkoutWithExercises(obj.single)) return formatWorkout(obj.single);
            if (Array.isArray(obj.multiple)) {
                return formatWorkoutSummaryList(
                    obj.multiple as WorkoutSummary[],
                    obj.filterMuscleGroups,
                );
            }
        }
    }

    return null;
}

export function createMessageGeneratorNode(generateMessage: GenerateMessageUseCase) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const workflow = getWorkflow(state);
        const turn = getTurn(state);
        const userContext = getUserContext(state);
        const conversation = getConversation(state);

        const scenario = resolveScenario({
            intent: workflow.intent,
            missingSlots: workflow.missingSlots,
            actionSuccess: turn.actionSuccess,
            actionError: turn.actionError,
            error: turn.error,
        });

        const direct = deterministicResponse(turn.actionData, scenario);
        if (direct) {
            return { messages: [...state.messages, new AIMessage(direct)] };
        }

        try {
            const message = await generateMessage.execute({
                scenario,
                details: {
                    intent: workflow.intent,
                    missingSlots: workflow.missingSlots,
                    slots: workflow.slots,
                    actionData: turn.actionData,
                    actionError: turn.actionError,
                    retrievedExercises: turn.retrievedExercises?.slice(0, 8),
                    workoutCandidates: workflow.workoutCandidates,
                    error: turn.error,
                    userName: userContext.userName,
                    summary: conversation.summary,
                    userPreferences: userContext.preferences,
                },
            });
            return { messages: [...state.messages, new AIMessage(message)] };
        } catch {
            return {
                messages: [
                    ...state.messages,
                    new AIMessage('An error occurred. Please try again.'),
                ],
            };
        }
    };
}
