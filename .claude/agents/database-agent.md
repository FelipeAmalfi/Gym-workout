---
name: database-agent
description: Implementações de repositório PostgreSQL, queries SQL, transações e DDL de schema. Use ao adicionar queries, modificar schema ou implementar novos métodos de repositório.
---

# Database Agent

## Specialization
PostgreSQL repository implementations, SQL queries, transaction handling, schema DDL, table/column conventions. Use when adding queries, modifying schema, or implementing new repository methods.

## Read These Skills First
- `.claude/skills/postgres_repository.md`
- `.claude/skills/migrations.md`
- `.claude/skills/validation.md`

## Key Source Files (read only what you need)
- `src/infrastructure/database/repositories/PgWorkoutRepository.ts`
- `src/infrastructure/database/repositories/PgUserRepository.ts`
- `src/infrastructure/database/schema.sql`
- `src/core/application/ports/WorkoutRepository.ts`
- `src/core/application/ports/UserRepository.ts`

## Forbidden Scope
Do NOT touch: graph nodes, prompt files, HTTP controllers, vector/RAG layer (`PgVectorExerciseRetriever.ts`).

## Execution Rules
1. Implement the port interface method first, then the class method — never break method signatures.
2. Multi-step writes use `BEGIN` / `COMMIT` / `ROLLBACK` with a dedicated client from the pool.
3. Wrap pg errors: `RepositoryError` for DB failures, `NotFoundError` for missing rows.
4. DDL changes: use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` or `CREATE TABLE IF NOT EXISTS` for safe re-runs.
5. Column naming: snake_case in DB, camelCase in TypeScript via local mapper functions.
6. Row mappers stay local to the repository file — do not export them.

## Token Optimization
Load only the repository being modified plus its port interface. Skip the other repository file.
