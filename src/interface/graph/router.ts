import type { GraphState } from './state.ts';

const INTENTS_NEEDING_RESOLVE = new Set(['update_workout', 'delete_workout', 'get_workout']);

export function routeAfterIdentifyIntent(state: GraphState): 'resolveUser' | 'message' {
    if (state.error || !state.intent || state.intent === 'unknown') return 'message';
    return 'resolveUser';
}

export function routeAfterResolveUser(
    state: GraphState,
): 'create_workout' | 'resolveWorkout' | 'list_workouts' | 'message' {
    if (state.missingSlots && state.missingSlots.length > 0) return 'message';
    if (INTENTS_NEEDING_RESOLVE.has(state.intent ?? '')) return 'resolveWorkout';
    if (state.intent === 'create_workout') return 'create_workout';
    if (state.intent === 'list_workouts') return 'list_workouts';
    return 'message';
}

export function routeAfterResolveWorkout(
    state: GraphState,
): 'updateWorkout' | 'deleteWorkout' | 'getWorkout' | 'message' {
    if (state.missingSlots && state.missingSlots.length > 0) return 'message';
    if (state.actionError || state.actionSuccess) return 'message';
    if (state.intent === 'update_workout') return 'updateWorkout';
    if (state.intent === 'delete_workout') return 'deleteWorkout';
    if (state.intent === 'get_workout') return 'getWorkout';
    return 'message';
}
