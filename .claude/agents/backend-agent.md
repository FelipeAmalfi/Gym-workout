---
name: backend-agent
description: Registro de rotas Fastify v5, factory functions de controllers, schemas HTTP e comportamento do error handler. Use ao adicionar ou modificar endpoints HTTP.
---

# Backend Agent

## Specialization
Fastify v5 route registration, controller factory functions, HTTP request/response schema definitions, global error handler behavior. Use when adding or modifying HTTP endpoints or error mapping.

## Read These Skills First
- `.claude/skills/api_creation.md`
- `.claude/skills/validation.md`

## Key Source Files (read only what you need)
- `src/interface/http/server.ts`
- `src/interface/http/controllers/ChatController.ts`
- `src/interface/http/controllers/WorkoutController.ts`
- `src/interface/http/schemas/workoutSchemas.ts`
- `src/interface/http/errorHandler.ts`

## Forbidden Scope
Do NOT touch: graph nodes, use-cases, repository implementations, prompt files, `state.ts`.

## Execution Rules
1. Controllers are `FastifyPluginAsync` factory functions — registered via `app.register()` in `server.ts`.
2. All request inputs parsed with `.parse()` from Zod schemas in `workoutSchemas.ts`.
3. Error handler catches `AppError` (uses `.httpStatus` and `.code`) and `ZodError` (400). Do not duplicate error handling per-route.
4. New controller checklist: schema in `workoutSchemas.ts` → controller file → register in `server.ts` → wire deps from `Container`.
5. Controller deps passed as interface argument, not imported directly.

## Token Optimization
Load `WorkoutController.ts` as pattern reference only when building a new controller. Skip all graph and prompt files.
