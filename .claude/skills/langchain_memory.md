# Skill: langchain_memory

## Purpose
Configure `MemorySaver` checkpointing, `thread_id` wiring, and state persistence between graph invocations.

## Scope
- `src/composition/container.ts` — `MemorySaver` instantiation and passing to graph builder
- `src/interface/graph/builder.ts` — `compile({ checkpointer })` call
- `src/interface/http/controllers/ChatController.ts` — `thread_id` extraction from request body

## Inputs
Checkpointing strategy changes, `thread_id` source changes, alternative checkpointer implementations.

## Outputs
Updated container wiring and/or graph compilation options.

## Constraints
`MemorySaver` is instantiated once per app process in `container.ts`. It is passed as argument to `buildWorkoutGraph(deps, checkpointer)`. `thread_id` must come from `body.thread_id` in HTTP requests. Do not replace `MemorySaver` with `InMemoryStore` — they serve different purposes. Do not instantiate a new checkpointer per request.

## Related Files
- `src/interface/graph/state.ts` (state shape that gets checkpointed)
