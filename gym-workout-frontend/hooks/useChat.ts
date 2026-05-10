"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/store/chatStore";
import { sendChat } from "@/lib/api";

const WAKING_THRESHOLD_MS = 5_000;

export function useChat() {
  const store = useChatStore();
  const wakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    store.initSession();
  }, []);

  async function sendMessage(text: string) {
    if (!text.trim() || store.isLoading) return;

    store.addUserMessage(text.trim());
    store.setLoading(true);

    wakingTimerRef.current = setTimeout(() => {
      store.setServerWaking(true);
    }, WAKING_THRESHOLD_MS);

    try {
      const response = await sendChat({
        message: text.trim(),
        thread_id: store.threadId,
        user_id: store.userId ?? undefined,
      });

      // If the backend resolved the user, persist the userId.
      // actionData for create_workout/get_workout contains userId.
      if (response.actionData && !Array.isArray(response.actionData)) {
        const data = response.actionData as { userId?: number };
        if (data.userId && !store.userId) {
          store.resolveUserId(data.userId);
        }
      }

      store.addAssistantMessage(response);
    } catch (err) {
      store.addAssistantMessage({
        reply:
          "Sorry, I couldn't connect to the server. Please check your connection and try again.",
        intent: "unknown",
        actionSuccess: false,
      });
    } finally {
      if (wakingTimerRef.current) clearTimeout(wakingTimerRef.current);
      store.setLoading(false);
      store.setServerWaking(false);
    }
  }

  return {
    messages: store.messages,
    isLoading: store.isLoading,
    isServerWaking: store.isServerWaking,
    sendMessage,
    resetSession: store.resetSession,
  };
}
