import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

beforeEach(() => {
    vi.resetModules();
});

describe('useChat', () => {
    it('adds an optimistic user message before the response resolves', async () => {
        vi.doMock('@/lib/api', () => ({
            sendChat: vi.fn().mockResolvedValue({
                reply: 'hi',
                intent: 'unknown',
                actionSuccess: false,
            }),
        }));

        const { useChat } = await import('@/hooks/useChat');
        const { result } = renderHook(() => useChat());

        await act(async () => {
            await result.current.sendMessage('hello');
        });

        const roles = result.current.messages.map((m) => m.role);
        expect(roles).toEqual(['user', 'assistant']);
        expect(result.current.isLoading).toBe(false);
    });

    it('surfaces the cold-start banner after the 5s threshold', async () => {
        vi.useFakeTimers();
        let resolveSend: (v: unknown) => void = () => {};
        vi.doMock('@/lib/api', () => ({
            sendChat: vi.fn().mockImplementation(
                () => new Promise((r) => { resolveSend = r; }),
            ),
        }));

        const { useChat } = await import('@/hooks/useChat');
        const { result } = renderHook(() => useChat());

        const inflight = act(async () => { result.current.sendMessage('hi'); });
        await vi.advanceTimersByTimeAsync(5_100);
        expect(result.current.isServerWaking).toBe(true);

        resolveSend({ reply: 'ok', intent: 'unknown', actionSuccess: false });
        await inflight;
        await act(async () => { await Promise.resolve(); });

        expect(result.current.isServerWaking).toBe(false);
        vi.useRealTimers();
    });

    it('renders a fallback assistant message when the API throws', async () => {
        vi.doMock('@/lib/api', () => ({
            sendChat: vi.fn().mockRejectedValue(new Error('boom')),
        }));

        const { useChat } = await import('@/hooks/useChat');
        const { result } = renderHook(() => useChat());

        await act(async () => { await result.current.sendMessage('hi'); });

        const last = result.current.messages.at(-1)!;
        expect(last.role).toBe('assistant');
        expect(last.content).toMatch(/couldn't connect|try again/i);
    });
});
