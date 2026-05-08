import type { WorkoutWithExercises, WorkoutSummary } from '../../core/domain/entities/Workout.ts';
import type { WorkoutExercisePrescription } from '../../core/domain/entities/Exercise.ts';

export function formatExerciseCanonical(exercise: WorkoutExercisePrescription): string {
    const sets = exercise.sets || 3;
    const reps = exercise.reps || 10;
    const rest = exercise.restTimeSec || 60;
    return [
        `Name: ${exercise.title}`,
        `Description: ${exercise.description ?? '-'}`,
        `Repetitions: ${sets} sets x ${reps} reps`,
        `Rest Time: ${rest}s`,
        `Used muscles: ${exercise.bodyPart ?? '-'}`,
        `Exercise Level: ${exercise.level ?? '-'}`,
    ].join('\n');
}

export function formatWorkout(workout: WorkoutWithExercises): string {
    const lines: string[] = [];
    lines.push(`Workout: ${workout.name}`);
    if (workout.description) lines.push(`Workout Description: ${workout.description}`);
    if (workout.goal) lines.push(`Goal: ${workout.goal}`);
    if (workout.difficulty) lines.push(`Difficulty: ${workout.difficulty}`);
    lines.push('');

    if (!workout.exercises || workout.exercises.length === 0) {
        lines.push('(No exercises in this workout yet.)');
        return lines.join('\n');
    }

    workout.exercises.forEach((ex, idx) => {
        lines.push(`Exercise ${idx + 1}`);
        lines.push(formatExerciseCanonical(ex));
        lines.push('');
    });

    return lines.join('\n').trimEnd();
}

export function formatWorkoutSummaryList(
    workouts: WorkoutSummary[],
    filterMuscleGroups?: string[],
): string {
    const lines: string[] = [];
    if (filterMuscleGroups && filterMuscleGroups.length > 0) {
        lines.push(`Workouts matching ${filterMuscleGroups.join(', ')}:`);
    } else {
        lines.push('Your workouts:');
    }
    lines.push('');

    if (workouts.length === 0) {
        lines.push('You have no workouts yet. Ask me to create one!');
        return lines.join('\n');
    }

    workouts.forEach((w, idx) => {
        const muscles = w.muscleGroups.length > 0 ? ` (${w.muscleGroups.join(', ')})` : '';
        const difficulty = w.difficulty ? ` — ${w.difficulty}` : '';
        const goal = w.goal ? ` — ${w.goal}` : '';
        lines.push(`${idx + 1}. ${w.name}${muscles}${difficulty}${goal}`);
    });

    lines.push('');
    lines.push('Which one would you like to open? You can say "the second one" or use the workout name.');

    return lines.join('\n');
}
