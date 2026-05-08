# Skill: memory_handling

## Purpose
Manage slot persistence, per-turn state resets, and multi-turn context accumulation in `identifyIntentNode`.

## Scope
- `src/interface/graph/nodes/identifyIntentNode.ts` — slot merge logic, `computeMissingSlots`, turn reset
- `src/interface/graph/state.ts` — `WorkoutStateAnnotation` field definitions

## Inputs
New slots to persist, changes to reset behavior, adjustments to turn context logic.

## Outputs
Updated node logic and/or updated state schema.

## Constraints
Slot merge must always be `{ ...state.slots, ...newSlots }` — never replace the entire slots object. At the start of each new user turn, `identifyIntentNode` must reset `actionSuccess`, `actionError`, and `actionData` to `undefined`. All new fields added to `WorkoutStateAnnotation` must be optional (no required fields) to remain compatible with existing MemorySaver checkpoints.

## Related Files
- `src/interface/http/controllers/ChatController.ts` (`thread_id` injection — read-only reference)
