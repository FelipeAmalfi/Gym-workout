import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import type { ChatMessage, WorkoutWithExercises } from '@/lib/types';

const baseAssistant: Omit<ChatMessage, 'content' | 'intent' | 'actionData' | 'actionSuccess'> = {
    id: '1',
    role: 'assistant',
    timestamp: new Date(),
};

describe('MessageBubble', () => {
    it('renders user message text', () => {
        render(
            <MessageBubble
                message={{ id: 'u', role: 'user', content: 'Hello', timestamp: new Date() }}
            />,
        );
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('renders a WorkoutCard when actionSuccess + create_workout + workout shape', () => {
        const workout: WorkoutWithExercises = {
            id: 1,
            userId: 1,
            name: 'Push Day',
            description: null,
            goal: null,
            difficulty: 'Intermediate',
            createdAt: '',
            updatedAt: '',
            exercises: [
                { id: 1, title: 'Bench Press', description: null, bodyPart: 'Chest', equipment: 'Barbell', level: 'Intermediate', sets: 3, reps: 10, restTimeSec: 60, position: 1 },
            ],
        };
        render(
            <MessageBubble
                message={{
                    ...baseAssistant,
                    content: 'Workout created!',
                    intent: 'create_workout',
                    actionSuccess: true,
                    actionData: workout,
                }}
            />,
        );
        expect(screen.getByText('Push Day')).toBeInTheDocument();
        expect(screen.getByText('Bench Press')).toBeInTheDocument();
    });

    it('does not render a WorkoutCard when actionSuccess is false', () => {
        render(
            <MessageBubble
                message={{
                    ...baseAssistant,
                    content: 'oops',
                    intent: 'create_workout',
                    actionSuccess: false,
                }}
            />,
        );
        // Plain text only — no exercise names rendered.
        expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
    });
});
