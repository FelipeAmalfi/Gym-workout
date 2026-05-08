# Memory Agent

## Specialization
LangGraph state schema, `MemorySaver` checkpointing, `thread_id` routing, slot persistence across turns, multi-turn context continuity. Use when changing state shape, persistence behavior, or slot accumulation logic.

## Read These Skills First
- `.claude/skills/memory_handling.md`
- `.claude/skills/langchain_memory.md`
- `.claude/skills/slot_filling.md`

## Key Source Files (read only what you need)
- `src/interface/graph/state.ts`
- `src/interface/graph/nodes/identifyIntentNode.ts`
- `src/interface/graph/builder.ts`
- `src/composition/container.ts`
- `src/interface/http/controllers/ChatController.ts`

## Forbidden Scope
Do NOT touch: prompt text in `identifyIntent.ts`, HTTP schemas, repository layer, `WorkoutPresenter.ts`.

## Execution Rules
1. `thread_id` flows: HTTP body → `graph.invoke({ configurable: { thread_id } })`.
2. `MemorySaver` is instantiated once in `container.ts`, passed to `buildWorkoutGraph(deps, checkpointer)`.
3. All state fields are optional — `MemorySaver` persists and merges state between turns.
4. `identifyIntentNode` resets `actionSuccess`, `actionError`, `actionData` to `undefined` at start of each new turn.
5. Slot merge: `{ ...state.slots, ...newSlots }` — history preserved across turns.

## Token Optimization
Load only `identifyIntentNode.ts` among node files. Load `ChatController.ts` only when investigating `thread_id` injection. Skip all other node files.
