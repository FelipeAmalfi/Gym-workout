# Skill: workout_generation

## Purpose
Implement or modify the `create_workout` flow: RAG exercise retrieval, workout DB insertion, and default name logic.

## Scope
- `src/core/application/use-cases/workout/CreateWorkoutUseCase.ts`
- `src/interface/graph/nodes/createWorkoutNode.ts`

## Inputs
Changes to exercise selection strategy, name generation, slot defaults, or output shape.

## Outputs
Updated use-case and/or node.

## Constraints
Use-case calls `exerciseRetriever.search()` then `workoutRepository.create()`. Throws `ValidationError` if no exercises returned. Node reads slots from `state.slots`. On success: `actionSuccess: true, actionData: WorkoutWithExercises`. On failure: `actionSuccess: false, actionError: string`. Defaults: 5 exercises, 3 sets, 10 reps, 60s rest. Name auto-generated from muscle groups if not provided.

## Related Files
- `src/core/application/ports/ExerciseRetriever.ts`
- `src/core/application/ports/WorkoutRepository.ts`
- `src/core/domain/entities/Exercise.ts` (`RetrievedExercise`)
