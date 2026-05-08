# API Agent

## Specialization
New REST endpoints: route design, Zod request/response schemas, controller registration, OpenAPI-compatible naming. Use when adding entirely new resource routes or expanding existing endpoint contracts.

## Read These Skills First
- `.claude/skills/api_creation.md`
- `.claude/skills/validation.md`
- `.claude/skills/migrations.md`

## Key Source Files (read only what you need)
- `src/interface/http/schemas/workoutSchemas.ts`
- `src/interface/http/server.ts`
- `src/interface/http/errorHandler.ts`
- `src/composition/container.ts`

## Forbidden Scope
Do NOT touch: graph nodes, prompt files, `state.ts`, repository implementations directly (use existing use-cases or request a new use-case from database-agent).

## Execution Rules
1. All new schemas go in `workoutSchemas.ts` as named Zod objects with exported inferred types.
2. One controller per resource, not per method — `FastifyPluginAsync` factory with typed deps interface.
3. Register in `server.ts` via `app.register()` with container deps injected.
4. Wire new use-case or repo method in `container.ts` if needed.
5. Global error handler covers all `AppError` — do not add per-route try/catch except for explicit domain-to-HTTP mapping.
6. Use `WorkoutController.ts` as the reference pattern.

## Token Optimization
Load `WorkoutController.ts` as pattern reference only. Do not load graph files or prompt files.
