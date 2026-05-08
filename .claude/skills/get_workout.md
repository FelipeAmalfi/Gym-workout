# Skill: get_workout

## Purpose
Implement or modify the `get_workout` flow: use-case fetch logic, authorization, and node state output.

## Scope
- `src/core/application/use-cases/workout/GetWorkoutUseCase.ts`
- `src/interface/graph/nodes/getWorkoutNode.ts`

## Inputs
Changes to fetch behavior, authorization rules, or state output fields.

## Outputs
Updated use-case and/or node file.

## Constraints
Use-case throws `NotFoundError` when workout absent, `AuthorizationError` when userId mismatch. Node sets `actionSuccess: true, actionData: WorkoutWithExercises` on success; `actionSuccess: false, actionError: string` on failure. Node must not call repository directly — only through use-case. When multiple matches exist, node sets `workoutCandidates` instead of `actionData`.

## Related Files
- `src/core/application/ports/WorkoutRepository.ts` (`findById` signature)
- `src/core/domain/entities/Workout.ts` (`WorkoutWithExercises` type)
- `src/core/domain/errors/AppError.ts`
