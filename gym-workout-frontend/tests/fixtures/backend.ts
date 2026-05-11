import { test as base, type Route, type Page } from '@playwright/test';

export interface ChatResponseFixture {
    reply: string;
    intent: 'create_workout' | 'list_workouts' | 'unknown' | 'get_workout' | 'update_workout' | 'delete_workout';
    missingSlots?: string[];
    actionSuccess?: boolean;
    actionData?: unknown;
}

export interface BackendMock {
    queueChatReply(response: ChatResponseFixture): void;
    failNextChat(status?: number): void;
    delayNextChatMs(ms: number): void;
    capturedRequests(): Array<Record<string, unknown>>;
}

interface ChatStep {
    response?: ChatResponseFixture;
    status?: number;
    delayMs?: number;
}

/**
 * Playwright fixture that intercepts all /api/* calls and returns canned data.
 * Tests enqueue chat replies in the order they expect them to fire.
 */
export const test = base.extend<{ backend: BackendMock }>({
    backend: async ({ page }, use) => {
        const queue: ChatStep[] = [];
        const captured: Array<Record<string, unknown>> = [];

        await page.route('**/api/chat', async (route: Route) => {
            const req = route.request();
            try { captured.push(JSON.parse(req.postData() ?? '{}')); } catch { /* ignore */ }

            const next = queue.shift();
            if (next?.delayMs) await new Promise((r) => setTimeout(r, next.delayMs));
            if (!next || next.status && next.status >= 400) {
                await route.fulfill({ status: next?.status ?? 500, body: 'mock failure' });
                return;
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(next.response ?? {
                    reply: 'mock reply',
                    intent: 'unknown',
                    actionSuccess: false,
                }),
            });
        });

        await page.route('**/api/workouts**', async (route: Route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        });

        const mock: BackendMock = {
            queueChatReply(response) { queue.push({ response }); },
            failNextChat(status = 500) { queue.push({ status }); },
            delayNextChatMs(ms) {
                const last = queue.at(-1);
                if (last) last.delayMs = ms; else queue.push({ delayMs: ms });
            },
            capturedRequests() { return captured.slice(); },
        };

        await use(mock);
    },
});

export const expect = test.expect;

export async function gotoChat(page: Page): Promise<void> {
    await page.goto('/chat');
}
