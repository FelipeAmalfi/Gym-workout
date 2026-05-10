"use client";

import { create } from "zustand";
import type { ChatMessage, Intent, ChatResponse } from "@/lib/types";
import {
  getOrCreateThreadId,
  getUserId,
  saveUserId,
  resetSession as clearSession,
} from "@/lib/session";

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  isServerWaking: boolean;
  threadId: string;
  userId: number | null;

  initSession: () => void;
  addUserMessage: (text: string) => ChatMessage;
  addAssistantMessage: (response: ChatResponse) => void;
  setLoading: (v: boolean) => void;
  setServerWaking: (v: boolean) => void;
  resolveUserId: (id: number) => void;
  resetSession: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  isServerWaking: false,
  threadId: "",
  userId: null,

  initSession: () => {
    const threadId = getOrCreateThreadId();
    const userId = getUserId();
    set({ threadId, userId });
  },

  addUserMessage: (text: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    set((s) => ({ messages: [...s.messages, msg] }));
    return msg;
  },

  addAssistantMessage: (response: ChatResponse) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: response.reply,
      intent: response.intent,
      actionData: response.actionData,
      actionSuccess: response.actionSuccess,
      timestamp: new Date(),
    };
    set((s) => ({ messages: [...s.messages, msg] }));
  },

  setLoading: (v: boolean) => set({ isLoading: v }),
  setServerWaking: (v: boolean) => set({ isServerWaking: v }),

  resolveUserId: (id: number) => {
    saveUserId(id);
    set({ userId: id });
  },

  resetSession: () => {
    const newThreadId = clearSession();
    set({ messages: [], threadId: newThreadId, userId: null, isLoading: false, isServerWaking: false });
  },
}));
