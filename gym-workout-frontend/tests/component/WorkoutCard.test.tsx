import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkoutCard } from '@/components/workout/WorkoutCard';
import type { WorkoutWithExercises } from '@/lib/types';

const workout: WorkoutWithExercises = {
    id: 1,
    userId: 1,
    name: 'Push Day',
    description: 'Upper body push session',
    goal: 'muscle_gain',
    difficulty: 'Expert',
    createdAt: '',
    updatedAt: '',
    exercises: [
        { id: 2, title: 'Incline Press', description: null, bodyPart: 'Chest', equipment: 'Dumbbell', level: 'Expert', sets: 4, reps: 8, restTimeSec: 90, position: 2 },
        { id: 1, title: 'Bench Press', description: null, bodyPart: 'Chest', equipment: 'Barbell', level: 'Expert', sets: 4, reps: 6, restTimeSec: 120, position: 1 },
    ],
};

describe('WorkoutCard', () => {
    it('renders name, difficulty and goal', () => {
        render(<WorkoutCard workout={workout} />);
        expect(screen.getByText('Push Day')).toBeInTheDocument();
        // Difficulty badge appears once at workout level + once per exercise → at least one.
        expect(screen.getAllByText('Expert').length).toBeGreaterThan(0);
        expect(screen.getByText(/muscle gain/i)).toBeInTheDocument();
    });

    it('orders exercises by position', () => {
        render(<WorkoutCard workout={workout} />);
        // Exercise titles are the only place these strings appear.
        const bench = screen.getByText('Bench Press');
        const incline = screen.getByText('Incline Press');
        expect(
            bench.compareDocumentPosition(incline) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });

    it('shows the exercise count', () => {
        render(<WorkoutCard workout={workout} />);
        expect(screen.getByText(/2 exercises/i)).toBeInTheDocument();
    });

    it('renders the description when provided', () => {
        render(<WorkoutCard workout={workout} />);
        expect(screen.getByText('Upper body push session')).toBeInTheDocument();
    });
});
