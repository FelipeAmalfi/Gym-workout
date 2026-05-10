import type { Slots, Workflow } from './state.ts';

const REQUIRED_SLOTS_BY_INTENT: Record<string, string[]> = {
    create_workout: ['muscleGroups_or_goal'],
    update_workout: ['workout_reference'],
    delete_workout: ['workout_reference'],
    get_workout: ['workout_reference'],
    list_workouts: [],
};

export function computeRequiredMissingSlots(
    intent: string | undefined,
    slots: Slots,
    workoutCandidates: Workflow['workoutCandidates'],
): string[] {
    if (!intent || intent === 'unknown') return [];
    const required = REQUIRED_SLOTS_BY_INTENT[intent] ?? [];
    const missing: string[] = [];

    for (const slot of required) {
        if (slot === 'muscleGroups_or_goal') {
            if (!slots.muscleGroups?.length && !slots.goal) {
                missing.push('muscleGroups_or_goal');
            }
        } else if (slot === 'workout_reference') {
            const hasCandidates = (workoutCandidates?.length ?? 0) > 0;
            const hasReference =
                slots.workoutId != null ||
                (slots.muscleGroups?.length ?? 0) > 0 ||
                (slots.selectionRef != null && slots.selectionRef !== '') ||
                hasCandidates;
            if (!hasReference) missing.push('workout_reference');
        }
    }

    return missing;
}

export function withMissingSlot(existing: string[], slot: string): string[] {
    const set = new Set(existing);
    set.add(slot);
    return Array.from(set);
}

export function withoutMissingSlots(existing: string[], slots: string[]): string[] {
    return existing.filter((s) => !slots.includes(s));
}
