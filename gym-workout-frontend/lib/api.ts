import type { ChatRequest, ChatResponse, Workout, WorkoutWithExercises } from "@/lib/types";

const API_BASE = "/api";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function sendChat(payload: ChatRequest): Promise<ChatResponse> {
  return request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(90_000),
  });
}

export async function listWorkouts(userId: number): Promise<Workout[]> {
  return request<Workout[]>(`/workouts?user_id=${userId}`);
}

export async function getWorkout(id: number): Promise<WorkoutWithExercises> {
  return request<WorkoutWithExercises>(`/workouts/${id}`);
}

export async function deleteWorkout(id: number, userId: number): Promise<void> {
  return request<void>(`/workouts/${id}?user_id=${userId}`, { method: "DELETE" });
}
