import { test, expect, gotoChat } from '../fixtures/backend';

test('renders a friendly error bubble on 500', async ({ page, backend }) => {
    backend.failNextChat(500);

    await gotoChat(page);
    await page.getByPlaceholder(/Message your AI trainer/i).fill('hi');
    await page.getByPlaceholder(/Message your AI trainer/i).press('Enter');

    await expect(page.getByText(/couldn't connect|try again/i)).toBeVisible();
});

test('renders error bubble on 400 validation error', async ({ page, backend }) => {
    backend.failNextChat(400);

    await gotoChat(page);
    await page.getByPlaceholder(/Message your AI trainer/i).fill('hi');
    await page.getByPlaceholder(/Message your AI trainer/i).press('Enter');

    await expect(page.getByText(/couldn't connect|try again/i)).toBeVisible();
});
