# Skill: postgres_repository

## Purpose
Add or modify methods in `PgWorkoutRepository` or `PgUserRepository`.

## Scope
- `src/infrastructure/database/repositories/PgWorkoutRepository.ts`
- `src/infrastructure/database/repositories/PgUserRepository.ts`
- `src/core/application/ports/WorkoutRepository.ts` (update if signature changes)
- `src/core/application/ports/UserRepository.ts` (update if signature changes)

## Inputs
New query method, updated SQL, new return type, authorization logic.

## Outputs
Updated repository class and port interface if method signatures change.

## Constraints
Implement new method in the port interface first, then in the class. Wrap pg errors: `RepositoryError` for DB failures, `NotFoundError` for missing rows. Multi-step writes use `BEGIN` / `COMMIT` / `ROLLBACK` with a dedicated client. Row mapper functions stay local to the repository file — do not export. Column names are snake_case in SQL, mapped to camelCase in TypeScript.

## Related Files
- `src/infrastructure/database/pgPool.ts` (pool for acquiring clients)
- `src/core/domain/errors/AppError.ts` (RepositoryError, NotFoundError)
