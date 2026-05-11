import { expect } from 'vitest';
import { z } from 'zod/v3';
import type { ChatBody } from './chat.ts';

export function assertIntent(body: ChatBody, expected: string): void {
    expect(body.intent, `expected intent=${expected} got ${body.intent}`).toBe(expected);
}

export function assertMissingSlots(body: ChatBody, expected: string[]): void {
    const got = new Set(body.missingSlots ?? []);
    const want = new Set(expected);
    expect(got, `expected missingSlots ${[...want].sort().join(',')} got ${[...got].sort().join(',')}`)
        .toEqual(want);
}

export function assertActionSuccess(body: ChatBody, success = true): void {
    expect(body.actionSuccess).toBe(success);
}

const WorkoutShape = z.object({
    id: z.number(),
    userId: z.number(),
    name: z.string(),
    difficulty: z.string().nullable(),
    exercises: z.array(
        z.object({
            id: z.number(),
            title: z.string(),
            bodyPart: z.string().nullable(),
            level: z.string().nullable(),
            sets: z.number(),
            reps: z.number(),
            restTimeSec: z.number(),
            position: z.number(),
        }),
    ),
});

export function assertWorkoutShape(actionData: unknown): asserts actionData is z.infer<typeof WorkoutShape> {
    const parsed = WorkoutShape.safeParse(actionData);
    if (!parsed.success) {
        throw new Error(`actionData is not a workout: ${parsed.error.message}`);
    }
}

export function assertReply(body: ChatBody, pattern: RegExp): void {
    expect(body.reply).toMatch(pattern);
}

/**
 * Asserts the assistant never asked twice for the same slot across the captured
 * outbound replies in `replies` (chronological order).
 */
export function assertNoRepeatedAsk(replies: string[], slotPattern: RegExp): void {
    const matches = replies.filter((r) => slotPattern.test(r));
    expect(matches.length, `slot pattern asked ${matches.length} times: ${slotPattern}`).toBeLessThanOrEqual(1);
}
