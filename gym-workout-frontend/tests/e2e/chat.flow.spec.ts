import { test, expect, gotoChat } from '../fixtures/backend';

test('happy path: type a message and see assistant reply', async ({ page, backend }) => {
    backend.queueChatReply({
        reply: 'Sure! Which muscles would you like to target?',
        intent: 'create_workout',
        missingSlots: ['muscleGroups_or_goal'],
        actionSuccess: false,
    });

    await gotoChat(page);

    const composer = page.getByPlaceholder(/Message your AI trainer/i);
    await composer.fill('Create me a workout');
    await composer.press('Enter');

    await expect(page.getByText('Create me a workout')).toBeVisible();
    await expect(page.getByText(/Which muscles/i)).toBeVisible();
});

test('renders a WorkoutCard when the backend returns actionSuccess', async ({ page, backend }) => {
    backend.queueChatReply({
        reply: 'Workout created!',
        intent: 'create_workout',
        actionSuccess: true,
        actionData: {
            id: 1,
            userId: 1,
            name: 'Beginner Chest Workout',
            description: null,
            goal: null,
            difficulty: 'Beginner',
            createdAt: '',
            updatedAt: '',
            exercises: [
                { id: 1, title: 'Push-Up', description: null, bodyPart: 'Chest', equipment: 'Body Only', level: 'Beginner', sets: 3, reps: 10, restTimeSec: 60, position: 1 },
            ],
        },
    });

    await gotoChat(page);
    await page.getByPlaceholder(/Message your AI trainer/i).fill('Create a beginner chest workout');
    await page.getByPlaceholder(/Message your AI trainer/i).press('Enter');

    await expect(page.getByText('Beginner Chest Workout')).toBeVisible();
    await expect(page.getByText('Push-Up')).toBeVisible();
});

test('disables the send button while a request is inflight', async ({ page, backend }) => {
    backend.delayNextChatMs(1500);
    backend.queueChatReply({ reply: 'ok', intent: 'unknown', actionSuccess: false });

    await gotoChat(page);
    const composer = page.getByPlaceholder(/Message your AI trainer/i);
    await composer.fill('hi');
    await composer.press('Enter');

    // Composer is disabled during inflight
    await expect(composer).toBeDisabled();
    await expect(composer).toBeEnabled({ timeout: 5_000 });
});
