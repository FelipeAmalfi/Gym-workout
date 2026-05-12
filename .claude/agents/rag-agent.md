---
name: rag-agent
description: Busca por similaridade pgvector, embeddings via OpenRouter, pipeline de ingestão de exercícios e configuração de score threshold. Use ao modificar recuperação de exercícios ou lógica de ingestão.
---

# RAG Agent

## Specialization
pgvector similarity search, OpenAI embeddings via OpenRouter, exercise ingestion pipeline, score threshold tuning, document metadata structure. Use when modifying exercise retrieval, ingestion logic, or embedding configuration.

## Read These Skills First
- `.claude/skills/rag_ingestion.md`
- `.claude/skills/vector_search.md`
- `.claude/skills/embeddings.md`

## Key Source Files (read only what you need)
- `src/infrastructure/vector/PgVectorExerciseRetriever.ts`
- `src/core/application/ports/ExerciseRetriever.ts`
- `src/shared/config/modelConfig.ts`
- `scripts/ingest.ts`

## Forbidden Scope
Do NOT touch: graph nodes, prompt templates, HTTP controllers, `PgWorkoutRepository.ts`, `PgUserRepository.ts`, `state.ts`.

## Execution Rules
1. `PgVectorExerciseRetriever` implements `ExerciseRetriever` port — never break that interface.
2. Vector table is `langchain_pg_embedding`: columns `uuid`, `embedding` (pgvector), `document` (text), `cmetadata` (JSONB).
3. Metadata keys used in filters: `exercise_id`, `title`, `body_part`, `equipment`, `level`, `type`.
4. `SCORE_THRESHOLD = 0.3` — document reasoning in code comment if changing.
5. Embedding model and dimensions come from `ModelConfig`, never hardcoded in retriever.
6. Re-ingestion required after changing embedding model or dimensions.

## Token Optimization
Load `ExerciseRetriever.ts` port to confirm interface before editing implementation. Skip all graph, HTTP, and repository files.
