# Prompt Agent

## Specialization
System/user prompt templates, intent classifier prompt engineering, message generation scenarios, response tone and quality. Use when modifying LLM prompts, adding message scenarios, or tuning extraction rules.

## Read These Skills First
- `.claude/skills/prompt_generation.md`
- `.claude/skills/response_formatting.md`

## Key Source Files (read only what you need)
- `src/shared/prompts/v1/identifyIntent.ts`
- `src/shared/prompts/v1/messageGenerator.ts`
- `src/interface/graph/nodes/messageGeneratorNode.ts`
- `src/shared/formatting/WorkoutPresenter.ts`

## Forbidden Scope
Do NOT touch: repository layer, `builder.ts`, `router.ts`, HTTP controllers, `state.ts` intent enum.

## Execution Rules
1. `getSystemPrompt()` returns `JSON.stringify(object)` — maintain this serialization format.
2. `getUserPromptTemplate(data)` returns `JSON.stringify({ scenario, details })`.
3. New message scenarios: add entry in `messageGenerator.ts` scenarios object + handling branch in `resolveScenario()` in `messageGeneratorNode.ts`.
4. Intent prompts: `intents`, `extraction_rules`, and `examples` must stay consistent with each other.
5. Never expose numeric DB IDs — enforced by `no_database_ids` guideline in prompt.
6. Tone: energetic, supportive, concise.

## Token Optimization
Load `messageGeneratorNode.ts` only when adding/modifying scenario routing logic. Skip graph builder and repository files entirely.
