# Skill: create_intent

## Purpose
Add a new intent end-to-end: prompt schema, state enum, slot requirements, routing, graph node, use-case, DI wiring.

## Scope (all 7 files must be updated)
- `src/shared/prompts/v1/identifyIntent.ts` — add to `IntentSchema` enum, `intents` object, `examples`
- `src/interface/graph/state.ts` — add to intent enum
- `src/interface/graph/nodes/identifyIntentNode.ts` — add to `REQUIRED_SLOTS_BY_INTENT`
- `src/interface/graph/router.ts` — add routing branch
- `src/interface/graph/builder.ts` — add node + edge
- `src/interface/graph/dependencies.ts` — add use-case type field
- `src/composition/container.ts` — instantiate and wire use-case

## Inputs
New intent name (snake_case), required slot names, intended behavior description.

## Outputs
New file `src/interface/graph/nodes/<intent>Node.ts`. Updated versions of all 7 files above.

## Constraints
Intent enum value must be identical in `state.ts` and `identifyIntent.ts`. All 7 files must be updated atomically — a partial update leaves the graph in a broken state. New node factory must follow the standard pattern from `CONVENTIONS.md`.

## Related Files
- `.claude/CONVENTIONS.md` (node factory pattern)
- `src/core/domain/errors/AppError.ts` (error types for use-case)
