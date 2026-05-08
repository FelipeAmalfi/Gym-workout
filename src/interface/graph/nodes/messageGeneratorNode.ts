import { AIMessage } from 'langchain';
import type { GenerateMessageUseCase } from '../../../core/application/use-cases/chat/GenerateMessageUseCase.ts';
import {
    formatWorkout,
    formatWorkoutSummaryList,
} from '../../../shared/formatting/WorkoutPresenter.ts';
import type { WorkoutWithExercises, WorkoutSummary } from '../../../core/domain/entities/Workout.ts';
import type { GraphState } from '../state.ts';

function resolveScenario(state: GraphState): string {
    if (state.actionError === 'invalid_cpf') return 'ask_for_cpf_invalid';
    if (state.missingSlots?.length) return `ask_for_${state.missingSlots[0]}`;
    if (!state.intent || state.intent === 'unknown' || state.error) return 'unknown';
    if (state.actionError === 'no_match') return 'no_workout_match';
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
        const scenario = resolveScenario(state);

        const direct = deterministicResponse(state, scenario);
        if (direct) {
            return { messages: [...state.messages, new AIMessage(direct)] };
        }

        try {
            const message = await generateMessage.execute({
                scenario,
                details: {
                    intent: state.intent,
                    missingSlots: state.missingSlots,
                    slots: state.slots,
                    actionData: state.actionData,
                    actionError: state.actionError,
                    retrievedExercises: state.retrievedExercises?.slice(0, 8),
                    workoutCandidates: state.workoutCandidates,
                    error: state.error,
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
