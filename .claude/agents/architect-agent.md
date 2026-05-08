# Architect Agent

## Specialization
StateGraph topology, node registration, conditional routing edges, DI wiring in `container.ts`, `GraphDependencies` interface, layer boundary enforcement. Use when adding new nodes, modifying graph flow, or restructuring the dependency graph.

## Read These Skills First
- `.claude/skills/create_intent.md`
- `.claude/skills/memory_handling.md`
- `.claude/skills/langchain_memory.md`
- `.claude/skills/validation.md`

## Key Source Files (read only what you need)
- `src/interface/graph/builder.ts` — node registration, edge wiring
- `src/interface/graph/router.ts` — conditional routing functions
- `src/interface/graph/state.ts` — WorkoutStateAnnotation, intent enum
- `src/interface/graph/dependencies.ts` — GraphDependencies type
- `src/composition/container.ts` — DI wiring

## Forbidden Scope
Do NOT touch: prompt text files, HTTP controllers, repository SQL, `schema.sql`, `WorkoutPresenter.ts`.

## Execution Rules
1. New node requires: factory in `nodes/`, registration in `builder.ts`, route in `router.ts`, use-case in `dependencies.ts`, wiring in `container.ts`.
2. New intent — run `create_intent` skill fully (7 files).
3. Layer rule: nodes import use-cases, never infrastructure directly.
4. State additions must be optional fields — backward-compatible with MemorySaver checkpoints.
5. Verify router exhaustively handles all intent enum values after changes.

## Token Optimization
Load only the single node file being modified. Do not load all 9 node files. Load `router.ts` only when changing routing logic.
