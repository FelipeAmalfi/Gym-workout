# Skill: api_creation

## Purpose
Add a new REST endpoint: Zod schema, controller factory, server registration, DI wiring.

## Scope
- `src/interface/http/schemas/workoutSchemas.ts` — new Zod request/response schemas
- `src/interface/http/controllers/<Resource>Controller.ts` — new controller file
- `src/interface/http/server.ts` — `app.register()` call
- `src/composition/container.ts` — wire new use-case or repo method if needed

## Inputs
Resource name, HTTP method(s), request/response shape, required use-case.

## Outputs
New Zod schema with inferred type export, new controller file, updated `server.ts`, updated `container.ts`.

## Constraints
Controller is a `FastifyPluginAsync` factory function that accepts a typed deps interface. All inputs parsed via `.parse()` from Zod schemas. Register with `app.register()` — never call controller directly. Error handling is global — no per-route try/catch except for explicit domain-to-HTTP mapping. Use `WorkoutController.ts` as the structural reference.

## Related Files
- `src/interface/http/errorHandler.ts` (global error handling — do not duplicate)
- `src/core/domain/errors/AppError.ts` (error types that may be thrown)
