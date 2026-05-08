# Project Conventions

## Language & Runtime
TypeScript ESM. All imports use `.ts` extensions. Import Zod as `zod/v3` (not `zod`). Node.js >=24. Use `langchain` package for `AIMessage`/`HumanMessage`.

## Layer Boundaries
```
interface/graph/nodes → core/application/use-cases → core/application/ports ← infrastructure
```
Nodes import use-case instances injected via factory. No direct infra imports in nodes or use-cases.

## DI Pattern
All `new` calls and wiring live in `src/composition/container.ts`. Use-cases and nodes receive deps via constructor or factory argument.

## Error Handling
Throw typed subclasses of `AppError` from `src/core/domain/errors/AppError.ts` only. Never throw raw `Error` from domain or use-cases. HTTP error handler in `src/interface/http/errorHandler.ts` maps them to status codes.

## Node Factory Pattern
```ts
export function createXNode(dep: XUseCase) {
  return async (state: GraphState): Promise<Partial<GraphState>> => { ... }
}
```

## State Rules
- Nodes return `Partial<GraphState>`.
- Slot merge: `{ ...state.slots, ...newSlots }` — never replace entire slots.
- `identifyIntentNode` resets `actionSuccess`, `actionError`, `actionData` to `undefined` each new turn.
- New state fields must be optional in `WorkoutStateAnnotation`.

## HTTP
Fastify v5. Controllers are `FastifyPluginAsync` factory functions registered via `app.register()` in `server.ts`. All request bodies parsed with `.parse()` from Zod schemas in `workoutSchemas.ts`. Global error handler handles all `AppError` and `ZodError`.

## Intent Enum
Must be identical in `src/interface/graph/state.ts` and `src/shared/prompts/v1/identifyIntent.ts` `IntentSchema`.
Values: `create_workout | update_workout | delete_workout | get_workout | list_workouts | unknown`.

## File Naming
camelCase for files. PascalCase for classes/types. `create` prefix for node factories. `Pg` prefix for PostgreSQL adapter classes.

## Zod Schemas
Defined in: prompt files for LLM output schemas, `workoutSchemas.ts` for HTTP, `state.ts` for graph state. Always export `z.infer<typeof Schema>` as named type alongside schema.

## No Hardcoded IDs in Responses
Never expose numeric DB IDs in user-facing messages (enforced in `messageGenerator.ts` guidelines).
