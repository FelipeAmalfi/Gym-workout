import { describe, it, expect } from 'vitest';
import {
    formatExerciseCanonical,
    formatWorkout,
    formatWorkoutSummaryList,
} from '../../src/shared/formatting/WorkoutPresenter.ts';
import type { WorkoutWithExercises, WorkoutSummary } from '../../src/core/domain/entities/Workout.ts';

const exercise = {
    id: 1, title: 'Bench Press', description: 'Chest builder',
    bodyPart: 'Chest', equipment: 'Barbell', level: 'Intermediate',
    sets: 3, reps: 10, restTimeSec: 60, position: 1,
};

describe('formatExerciseCanonical', () => {
    it('includes the six required fields', () => {
        const out = formatExerciseCanonical(exercise);
        expect(out).toContain('Name: Bench Press');
        expect(out).toContain('Description: Chest builder');
        expect(out).toContain('Repetitions: 3 sets x 10 reps');
        expect(out).toContain('Rest Time: 60s');
        expect(out).toContain('Used muscles: Chest');
        expect(out).toContain('Exercise Level: Intermediate');
    });

    it('falls back to defaults when sets/reps/rest missing', () => {
        const out = formatExerciseCanonical({ ...exercise, sets: 0, reps: 0, restTimeSec: 0 });
        expect(out).toContain('Repetitions: 3 sets x 10 reps');
        expect(out).toContain('Rest Time: 60s');
    });
});

describe('formatWorkout', () => {
    const workout: WorkoutWithExercises = {
        id: 1, userId: 1, name: 'Push Day', description: 'Upper body push',
        goal: 'strength', difficulty: 'Intermediate',
        createdAt: new Date(), updatedAt: new Date(),
        exercises: [exercise],
    };

    it('includes header, goal, difficulty, and exercise details', () => {
        const out = formatWorkout(workout);
        expect(out).toContain('Workout: Push Day');
        expect(out).toContain('Goal: strength');
        expect(out).toContain('Difficulty: Intermediate');
        expect(out).toContain('Exercise 1');
        expect(out).toContain('Name: Bench Press');
    });

    it('handles empty exercises', () => {
        const out = formatWorkout({ ...workout, exercises: [] });
        expect(out).toContain('No exercises');
    });
});

describe('formatWorkoutSummaryList', () => {
    const summaries: WorkoutSummary[] = [
        { id: 1, name: 'Push Day', goal: 'strength', difficulty: 'Intermediate', muscleGroups: ['Chest', 'Triceps'] },
        { id: 2, name: 'Pull Day', goal: null, difficulty: 'Beginner', muscleGroups: ['Lats', 'Biceps'] },
    ];

    it('renders a numbered list with muscle groups and difficulty', () => {
        const out = formatWorkoutSummaryList(summaries);
        expect(out).toContain('1. Push Day (Chest, Triceps) — Intermediate — strength');
        expect(out).toContain('2. Pull Day (Lats, Biceps) — Beginner');
    });

    it('mentions the filter when provided', () => {
        const out = formatWorkoutSummaryList(summaries, ['Chest']);
        expect(out).toMatch(/matching Chest/i);
    });

    it('shows an empty message when no workouts', () => {
        const out = formatWorkoutSummaryList([]);
        expect(out).toMatch(/no workouts yet/i);
    });
});
