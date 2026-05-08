# Skill: response_formatting

## Purpose
Format workout data into user-facing strings for deterministic (non-LLM) responses.

## Scope
- `src/shared/formatting/WorkoutPresenter.ts` — formatter functions
- `src/interface/graph/nodes/messageGeneratorNode.ts` — `deterministicResponse()`, `resolveScenario()`

## Inputs
New data shape to format, new scenario that should bypass LLM with a deterministic response.

## Outputs
New or updated presenter function, updated `deterministicResponse()` switch case.

## Constraints
`formatExerciseCanonical` outputs exactly 6 fields: Name, Description, Repetitions, Rest Time, Used muscles, Exercise Level. Deterministic responses are preferred over LLM for structured data (workout details, lists). Add new deterministic responses to the `deterministicResponse()` switch in `messageGeneratorNode.ts`. Never expose numeric IDs in formatted output.

## Related Files
- `src/core/domain/entities/Workout.ts` (`WorkoutWithExercises`, `WorkoutSummary`)
- `src/core/domain/entities/Exercise.ts` (`WorkoutExercisePrescription`)
