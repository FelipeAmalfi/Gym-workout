import { test, expect, gotoChat } from '../fixtures/backend';

test.describe('mobile viewport', () => {
    test('composer is visible and usable on small viewport', async ({ page, backend }, testInfo) => {
        test.skip(testInfo.project.name !== 'mobile-chrome', 'only runs on mobile-chrome project');
        backend.queueChatReply({ reply: 'mobile reply', intent: 'unknown', actionSuccess: false });

        await gotoChat(page);

        const composer = page.getByPlaceholder(/Message your AI trainer/i);
        await expect(composer).toBeVisible();

        const box = await composer.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThan(150);

        await composer.fill('hello');
        await composer.press('Enter');
        await expect(page.getByText('mobile reply')).toBeVisible();
    });
});
