import { test, expect, gotoChat } from '../fixtures/backend';

test('thread_id persists across reload', async ({ page, backend, context }) => {
    backend.queueChatReply({ reply: 'first', intent: 'unknown', actionSuccess: false });
    backend.queueChatReply({ reply: 'second', intent: 'unknown', actionSuccess: false });

    await gotoChat(page);
    await page.getByPlaceholder(/Message your AI trainer/i).fill('hi');
    await page.getByPlaceholder(/Message your AI trainer/i).press('Enter');
    await expect(page.getByText('first')).toBeVisible();

    const firstThreadId = await page.evaluate(() => localStorage.getItem('gw_thread_id'));
    expect(firstThreadId).toBeTruthy();

    await page.reload();
    await page.getByPlaceholder(/Message your AI trainer/i).fill('again');
    await page.getByPlaceholder(/Message your AI trainer/i).press('Enter');
    await expect(page.getByText('second')).toBeVisible();

    const reqs = backend.capturedRequests();
    expect(reqs[0]!.thread_id).toBe(firstThreadId);
    expect(reqs[1]!.thread_id).toBe(firstThreadId);
});

test('New session button rotates the thread_id', async ({ page, backend }) => {
    backend.queueChatReply({ reply: 'a', intent: 'unknown', actionSuccess: false });
    backend.queueChatReply({ reply: 'b', intent: 'unknown', actionSuccess: false });

    await gotoChat(page);
    await page.getByPlaceholder(/Message your AI trainer/i).fill('hi');
    await page.getByPlaceholder(/Message your AI trainer/i).press('Enter');
    await expect(page.getByText('a')).toBeVisible();
    const before = await page.evaluate(() => localStorage.getItem('gw_thread_id'));

    await page.getByRole('button', { name: /new session/i }).click();
    await page.getByPlaceholder(/Message your AI trainer/i).fill('hi again');
    await page.getByPlaceholder(/Message your AI trainer/i).press('Enter');
    await expect(page.getByText('b')).toBeVisible();

    const reqs = backend.capturedRequests();
    expect(reqs[1]!.thread_id).not.toBe(before);
});
