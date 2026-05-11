import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// jsdom does not implement scrollIntoView.
if (typeof window !== 'undefined') {
    Element.prototype.scrollIntoView = function () { /* no-op */ };
}

// crypto.randomUUID exists in modern jsdom; fall back if not.
if (typeof crypto === 'undefined' || !crypto.randomUUID) {
    (globalThis as unknown as { crypto: { randomUUID: () => string } }).crypto = {
        randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2),
    };
}

// Node 25 ships an experimental global `localStorage` whose methods only work
// when `--localstorage-file=PATH` is supplied. Replace it with an in-memory
// Storage so tests stay isolated and the API matches the browser shape.
class MemoryStorage implements Storage {
    private map = new Map<string, string>();
    get length(): number { return this.map.size; }
    key(i: number): string | null { return Array.from(this.map.keys())[i] ?? null; }
    getItem(k: string): string | null { return this.map.get(k) ?? null; }
    setItem(k: string, v: string): void { this.map.set(k, String(v)); }
    removeItem(k: string): void { this.map.delete(k); }
    clear(): void { this.map.clear(); }
}

const memStorage = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', { value: memStorage, configurable: true, writable: true });
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: memStorage, configurable: true, writable: true });
}

beforeEach(() => { memStorage.clear(); });
