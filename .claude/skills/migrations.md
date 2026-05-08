# Skill: migrations

## Purpose
Modify the PostgreSQL schema: add tables, columns, indexes, or triggers.

## Scope
- `src/infrastructure/database/schema.sql`

## Inputs
New table or column definition, constraint, index, or trigger.

## Outputs
Updated `schema.sql`.

## Constraints
Use `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for safe re-runs against an existing database. Column names in snake_case. Foreign keys use `ON DELETE CASCADE` where child rows are logically owned by the parent. Timestamps: `TIMESTAMPTZ DEFAULT NOW()`. The `updated_at` auto-update trigger pattern already exists in the file — reuse it for new tables that need it. Do not remove or modify existing columns without verifying no code depends on them.

## Related Files
- `docker-compose.yml` (PostgreSQL service version and port)
- `src/infrastructure/database/repositories/PgWorkoutRepository.ts` (verify column names match)
