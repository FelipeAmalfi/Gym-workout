# Skill: rag_ingestion

## Purpose
Run or modify the exercise CSV ingestion pipeline into PostgreSQL and pgvector.

## Scope
- `scripts/ingest.ts`
- `src/infrastructure/vector/PgVectorExerciseRetriever.ts` (document construction, `addDocuments`)

## Inputs
CSV source path changes, batch size changes, metadata field additions.

## Outputs
Updated ingestion script and/or retriever document methods.

## Constraints
Metadata keys must match what `search()` filters on: `exercise_id`, `title`, `body_part`, `equipment`, `level`, `type`. Default batch size is 50. Call `ensureTable()` before `addDocuments()`. Use `ON CONFLICT DO NOTHING` for exercise row inserts to allow safe re-runs. Changing metadata schema requires re-ingestion of all vectors.

## Related Files
- `megaGymDataset.csv` (source dataset — 2918 exercises)
- `src/shared/config/modelConfig.ts` (embedding config)
- `src/infrastructure/database/schema.sql` (`exercises` table schema)
