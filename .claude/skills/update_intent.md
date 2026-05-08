# Skill: update_intent

## Purpose
Modify classification logic or slot requirements for an existing intent without adding or removing it from the pipeline.

## Scope
- `src/shared/prompts/v1/identifyIntent.ts` — edit `intents` object, `extraction_rules`, or `examples`
- `src/interface/graph/nodes/identifyIntentNode.ts` — edit `REQUIRED_SLOTS_BY_INTENT` or `computeMissingSlots`

## Inputs
Intent name (must already exist), description of what changes: required slots, keyword hints, extraction rules, or examples.

## Outputs
Updated prompt file and/or updated node logic.

## Constraints
Do not change the intent enum string value itself — that would break persisted MemorySaver state. Do not modify `router.ts` or `builder.ts` unless routing logic also changes. After editing examples, verify they are consistent with the updated extraction rules.

## Related Files
- `src/interface/graph/state.ts` (intent enum reference — read-only here)
- `src/shared/prompts/v1/messageGenerator.ts` (if scenario names need alignment)
