const THREAD_KEY = "gw_thread_id";
const USER_KEY = "gw_user_id";

export function getOrCreateThreadId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  const stored = localStorage.getItem(THREAD_KEY);
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem(THREAD_KEY, id);
  return id;
}

export function saveThreadId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THREAD_KEY, id);
}

export function clearThreadId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(THREAD_KEY);
}

export function getUserId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

export function saveUserId(id: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, String(id));
}

export function clearUserId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
}

export function resetSession(): string {
  clearThreadId();
  clearUserId();
  const newId = crypto.randomUUID();
  saveThreadId(newId);
  return newId;
}
