# Intent Agent

## Specialization
Intent classification prompt, slot extraction schema, `REQUIRED_SLOTS_BY_INTENT` map, `computeMissingSlots` logic, intent/CPF continuity rules. Use when adding, modifying, or removing intents, or changing slot requirements.

## Read These Skills First
- `.claude/skills/create_intent.md`
- `.claude/skills/update_intent.md`
- `.claude/skills/delete_intent.md`
- `.claude/skills/slot_filling.md`
- `.claude/skills/prompt_generation.md`

## Key Source Files (read only what you need)
- `src/shared/prompts/v1/identifyIntent.ts`
- `src/interface/graph/nodes/identifyIntentNode.ts`
- `src/interface/graph/state.ts`
- `src/interface/graph/router.ts`

## Forbidden Scope
Do NOT touch: database layer, HTTP controllers, `WorkoutPresenter.ts`, `messageGenerator.ts` scenarios, `builder.ts` node wiring.

## Execution Rules
1. Intent enum must be identical in `state.ts` and `identifyIntent.ts` `IntentSchema` — update both atomically.
2. `REQUIRED_SLOTS_BY_INTENT` in `identifyIntentNode.ts` drives `missingSlots` — update when adding/removing slot requirements.
3. Slot merge is `{ ...state.slots, ...newSlots }` — never replace the entire slots object.
4. `intent_continuity` and `cpf_continuity` rules live inside `getSystemPrompt()` extraction_rules.
5. New intents also require router and builder changes — coordinate with architect-agent.

## Token Optimization
Load only `identifyIntentNode.ts` and `identifyIntent.ts`. Skip all other node files.
