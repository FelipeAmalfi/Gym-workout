# Skill: embeddings

## Purpose
Configure or change the embedding model, vector dimensions, or API routing for pgvector operations.

## Scope
- `src/shared/config/modelConfig.ts` — `embeddingModel`, `embeddingDimensions` fields
- `src/shared/config/env.ts` — env var parsing for embedding config
- `src/infrastructure/vector/PgVectorExerciseRetriever.ts` (constructor — reads `ModelConfig`)

## Inputs
New embedding model name, new dimension count, env var name changes.

## Outputs
Updated `ModelConfig` type, env loader, and retriever constructor.

## Constraints
`embeddingModel` and `embeddingDimensions` always come from `ModelConfig` — never hardcode in retriever. OpenAI-compatible embeddings are routed through `https://openrouter.ai/api/v1`. Changing dimensions requires dropping and re-ingesting all vectors in `langchain_pg_embedding`. Current defaults: `text-embedding-3-small`, 1536 dims.

## Related Files
- `.env.example` (env var names)
- `scripts/ingest.ts` (uses embedding config during ingestion)
