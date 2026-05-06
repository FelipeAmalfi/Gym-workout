import type { WorkoutRow, WorkoutWithExercises } from './workoutService.ts';

export interface WorkoutSummary extends Pick<WorkoutRow, 'name' | 'goal' | 'difficulty'> {
    id: number;
    muscleGroups?: string[];
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
        const sets = ex.sets ?? 0;
        const reps = ex.reps ?? 0;
        const rest = ex.rest_time_sec ?? 60;
        lines.push(`Exercise ${idx + 1}`);
        lines.push(`Name: ${ex.title}`);
        lines.push(`Description: ${ex.description ?? '-'}`);
        lines.push(`Repetitions: ${sets} sets x ${reps} reps`);
        lines.push(`Rest Time: ${rest}s`);
        lines.push(`Used muscles: ${ex.body_part ?? '-'}`);
        lines.push(`Exercise Level: ${ex.level ?? '-'}`);
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
        const muscles = w.muscleGroups && w.muscleGroups.length > 0
            ? ` (${w.muscleGroups.join(', ')})`
            : '';
        const difficulty = w.difficulty ? ` — ${w.difficulty}` : '';
        const goal = w.goal ? ` — ${w.goal}` : '';
        lines.push(`${idx + 1}. ${w.name}${muscles}${difficulty}${goal}`);
    });

    lines.push('');
    lines.push('Which one would you like to open? You can say "the second one" or use the workout name.');

    return lines.join('\n');
}
