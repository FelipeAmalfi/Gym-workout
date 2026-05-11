import { test, expect, gotoChat } from '../fixtures/backend';

test('shows typing indicator while waiting for assistant', async ({ page, backend }) => {
    backend.delayNextChatMs(1000);
    backend.queueChatReply({ reply: 'done', intent: 'unknown', actionSuccess: false });

    await gotoChat(page);
    await page.getByPlaceholder(/Message your AI trainer/i).fill('hi');
    await page.getByPlaceholder(/Message your AI trainer/i).press('Enter');

    // TypingIndicator renders 3 dots inside a bubble. The container is unique by structure.
    await expect(page.locator('.dot-1')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('done')).toBeVisible({ timeout: 5000 });
});

test('shows the cold-start banner after 5 seconds', async ({ page, backend }) => {
    backend.delayNextChatMs(6500);
    backend.queueChatReply({ reply: 'awake', intent: 'unknown', actionSuccess: false });

    await gotoChat(page);
    await page.getByPlaceholder(/Message your AI trainer/i).fill('hi');
    await page.getByPlaceholder(/Message your AI trainer/i).press('Enter');

    await expect(page.getByText(/server is waking up/i)).toBeVisible({ timeout: 6500 });
});
