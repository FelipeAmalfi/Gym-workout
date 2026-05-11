import { test, expect, gotoChat } from '../fixtures/backend';

test('retry after a transient error succeeds', async ({ page, backend }) => {
    backend.failNextChat(500);
    backend.queueChatReply({ reply: 'recovered', intent: 'unknown', actionSuccess: false });

    await gotoChat(page);
    const composer = page.getByPlaceholder(/Message your AI trainer/i);
    await composer.fill('first attempt');
    await composer.press('Enter');
    await expect(page.getByText(/couldn't connect|try again/i)).toBeVisible();

    await composer.fill('second attempt');
    await composer.press('Enter');
    await expect(page.getByText('recovered')).toBeVisible();
});
