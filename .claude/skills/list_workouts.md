# Skill: list_workouts

## Purpose
Implement or modify the `list_workouts` flow: use-case result kinds and node state mapping.

## Scope
- `src/core/application/use-cases/workout/ListWorkoutsUseCase.ts`
- `src/interface/graph/nodes/listWorkoutsNode.ts`

## Inputs
Filter logic changes, new result discriminants, state output shape changes.

## Outputs
Updated use-case and/or node.

## Constraints
Use-case output uses a discriminated union with `kind`: `empty | single | multiple`. Node maps `multiple` → `workoutCandidates` in state. `single` → `actionData` as full `WorkoutWithExercises`. `empty` → `actionError: 'no_match'`. Do not collapse the `kind` discriminant — the node routing depends on it. Optional muscle group filter comes from `state.slots.muscleGroups`.

## Related Files
- `src/core/application/ports/WorkoutRepository.ts` (`findByUserId`, `findByUserIdAndMuscleGroups`)
- `src/shared/formatting/WorkoutPresenter.ts` (for summary formatting)
- `src/core/domain/entities/Workout.ts` (`WorkoutSummary` type)
