# Skill: slot_filling

## Purpose
Add new slot fields or modify slot extraction logic, validation, and required-slot mapping.

## Scope
- `src/shared/prompts/v1/identifyIntent.ts` — `SlotsSchema` Zod definition, `extraction_rules`
- `src/interface/graph/state.ts` — `slots` object shape inside `WorkoutStateAnnotation`
- `src/interface/graph/nodes/identifyIntentNode.ts` — `REQUIRED_SLOTS_BY_INTENT`, `computeMissingSlots`

## Inputs
New slot name, data type, extraction rule, list of intents that require it.

## Outputs
Updated `SlotsSchema`, updated state slots type, updated required-slots map and extraction rules.

## Constraints
All three files must stay in sync. Slot names are camelCase. New required slots need a corresponding `ask_for_<slot>` scenario in `src/shared/prompts/v1/messageGenerator.ts`. Optional slots that are never required need no router changes. Do not mark a slot as required in `REQUIRED_SLOTS_BY_INTENT` without also adding extraction guidance in `identifyIntent.ts`.

## Related Files
- `src/shared/prompts/v1/messageGenerator.ts` (add `ask_for_<slot>` scenario)
