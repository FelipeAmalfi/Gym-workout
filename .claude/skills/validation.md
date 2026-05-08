# Skill: validation

## Purpose
Add or modify Zod schemas, `AppError` subclasses, or value-object validators.

## Scope
- `src/interface/http/schemas/workoutSchemas.ts` — HTTP request/response schemas
- `src/core/domain/errors/AppError.ts` — error class hierarchy
- `src/core/domain/value-objects/Cpf.ts` — CPF validation logic
- `src/core/domain/value-objects/Difficulty.ts` — difficulty enum and valid value lists

## Inputs
New HTTP schema, new error class, new value-object constraint or valid-values list.

## Outputs
New or updated Zod schema with exported inferred type, or new `AppError` subclass.

## Constraints
Import Zod from `zod/v3`. Always export both the schema constant and `z.infer<typeof Schema>` as a named type. New `AppError` subclasses require a `code` property (SCREAMING_SNAKE_CASE string) and `httpStatus` (number). `Cpf` uses a modulo-11 check-digit algorithm — do not simplify. Valid muscle group and equipment lists live in `Difficulty.ts` — update them there only.

## Related Files
- `src/interface/http/errorHandler.ts` (maps AppError.httpStatus to HTTP responses)
