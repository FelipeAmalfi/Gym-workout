# Skill: delete_intent

## Purpose
Cleanly remove an intent from the entire pipeline with no dangling references.

## Scope (all 7 files must be cleaned)
- `src/shared/prompts/v1/identifyIntent.ts` — remove from `IntentSchema` enum, `intents` object, `examples`
- `src/interface/graph/state.ts` — remove from intent enum
- `src/interface/graph/nodes/identifyIntentNode.ts` — remove from `REQUIRED_SLOTS_BY_INTENT`
- `src/interface/graph/router.ts` — remove routing branch
- `src/interface/graph/builder.ts` — remove node registration and edge
- `src/interface/graph/dependencies.ts` — remove use-case type field
- `src/composition/container.ts` — remove instantiation and wiring

## Inputs
Intent name to remove.

## Outputs
Deleted node file `src/interface/graph/nodes/<intent>Node.ts`. All 7 files cleaned of references.

## Constraints
After removal, grep for the intent string across all `src/` files to confirm no dangling references. Check `messageGenerator.ts` for scenario entries tied to the removed intent and remove those too. Verify `router.ts` switch/if-else is still exhaustive.

## Related Files
- `src/shared/prompts/v1/messageGenerator.ts` (remove associated scenarios)
