# Skill: vector_search

## Purpose
Modify or tune the similarity search implementation in `PgVectorExerciseRetriever`.

## Scope
- `src/infrastructure/vector/PgVectorExerciseRetriever.ts` (`search` method)
- `src/core/application/ports/ExerciseRetriever.ts` (interface — read-only unless signature changes)

## Inputs
New filter fields, alternative query text strategy, score threshold change, result limit change.

## Outputs
Updated `search()` implementation.

## Constraints
Must fully implement the `ExerciseRetriever` port interface — never change return type without updating the port. `SCORE_THRESHOLD = 0.3` — add a comment with justification if changing. Filter object keys must exactly match metadata keys stored in `langchain_pg_embedding.cmetadata`. Return type is `RetrievedExercise[]`.

## Related Files
- `src/core/domain/entities/Exercise.ts` (`RetrievedExercise` type)
- `src/shared/config/modelConfig.ts` (embedding dimensions)
