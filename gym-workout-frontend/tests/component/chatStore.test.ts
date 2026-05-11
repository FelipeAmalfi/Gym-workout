import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
    vi.resetModules();
});

describe('chatStore', () => {
    it('initSession populates threadId from localStorage helpers', async () => {
        const { useChatStore } = await import('@/store/chatStore');
        const store = useChatStore.getState();
        store.initSession();
        expect(useChatStore.getState().threadId.length).toBeGreaterThan(0);
    });

    it('addUserMessage appends with role=user', async () => {
        const { useChatStore } = await import('@/store/chatStore');
        useChatStore.getState().initSession();
        useChatStore.getState().addUserMessage('hello');
        const msgs = useChatStore.getState().messages;
        expect(msgs).toHaveLength(1);
        expect(msgs[0]!.role).toBe('user');
        expect(msgs[0]!.content).toBe('hello');
    });

    it('addAssistantMessage stores intent + actionData', async () => {
        const { useChatStore } = await import('@/store/chatStore');
        useChatStore.getState().initSession();
        useChatStore.getState().addAssistantMessage({
            reply: 'done',
            intent: 'create_workout',
            actionSuccess: true,
            actionData: { id: 1, exercises: [] } as never,
        });
        const m = useChatStore.getState().messages[0]!;
        expect(m.role).toBe('assistant');
        expect(m.intent).toBe('create_workout');
        expect(m.actionSuccess).toBe(true);
    });

    it('resolveUserId persists to localStorage and updates state', async () => {
        const { useChatStore } = await import('@/store/chatStore');
        useChatStore.getState().initSession();
        useChatStore.getState().resolveUserId(42);
        expect(useChatStore.getState().userId).toBe(42);
        expect(localStorage.getItem('gw_user_id')).toBe('42');
    });

    it('resetSession clears messages and rotates threadId', async () => {
        const { useChatStore } = await import('@/store/chatStore');
        useChatStore.getState().initSession();
        const before = useChatStore.getState().threadId;
        useChatStore.getState().addUserMessage('m');
        useChatStore.getState().resetSession();
        const state = useChatStore.getState();
        expect(state.messages).toHaveLength(0);
        expect(state.userId).toBeNull();
        expect(state.threadId).not.toBe(before);
    });
});
