import { getTurn, getUserContext, getWorkflow, type GraphState } from './state.ts';

const INTENTS_NEEDING_RESOLVE = new Set(['update_workout', 'delete_workout', 'get_workout']);

export function routeAfterIdentifyIntent(state: GraphState): 'resolveUser' | 'message' {
    const turn = getTurn(state);
    const workflow = getWorkflow(state);
    if (turn.error || !workflow.intent || workflow.intent === 'unknown') return 'message';
    return 'resolveUser';
}

export function routeAfterResolveUser(
    state: GraphState,
): 'create_workout' | 'resolveWorkout' | 'list_workouts' | 'message' {
    const workflow = getWorkflow(state);
    const userContext = getUserContext(state);
    const turn = getTurn(state);

    if (turn.actionError === 'invalid_cpf') return 'message';
    if (!userContext.isIdentified) return 'message';
    if (workflow.missingSlots.length > 0) return 'message';

    if (INTENTS_NEEDING_RESOLVE.has(workflow.intent ?? '')) return 'resolveWorkout';
    if (workflow.intent === 'create_workout') return 'create_workout';
    if (workflow.intent === 'list_workouts') return 'list_workouts';
    return 'message';
}

export function routeAfterResolveWorkout(
    state: GraphState,
): 'updateWorkout' | 'deleteWorkout' | 'getWorkout' | 'message' {
    const workflow = getWorkflow(state);
    const turn = getTurn(state);

    if (workflow.missingSlots.length > 0) return 'message';
    if (turn.actionError || turn.actionSuccess) return 'message';
    if (workflow.intent === 'update_workout') return 'updateWorkout';
    if (workflow.intent === 'delete_workout') return 'deleteWorkout';
    if (workflow.intent === 'get_workout') return 'getWorkout';
    return 'message';
}
