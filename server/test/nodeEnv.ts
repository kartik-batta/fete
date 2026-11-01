import { vi } from 'vitest';

// The shared vitest setup file clears `localStorage` after each test, which does not
// exist in the node environment used by server tests; provide a minimal stand-in.
if (!('localStorage' in globalThis)) {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  });
}
