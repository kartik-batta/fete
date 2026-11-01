import { useEffect, useRef } from 'react';

/**
 * Persists `value` with `persist` at most once per `delayMs` of inactivity.
 *
 * Typing into a form or toggling several checklist items in a row would
 * otherwise serialise the whole event list to localStorage on every
 * keystroke. Pending writes are flushed synchronously when the page is being
 * hidden/unloaded (`pagehide`, `visibilitychange` → hidden) and on unmount,
 * so no edit is lost when the tab closes.
 *
 * The first render is skipped: the initial value came from storage already.
 */
export function useDebouncedPersist<T>(value: T, persist: (value: T) => void, delayMs = 400): void {
  const persistRef = useRef(persist);
  const pendingRef = useRef<{ value: T } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRunRef = useRef(true);

  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);

  // Flush + listeners live for the component's lifetime.
  useEffect(() => {
    const flush = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const pending = pendingRef.current;
      if (pending) {
        pendingRef.current = null;
        persistRef.current(pending.value);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      flush();
    };
  }, []);

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    pendingRef.current = { value };
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) persistRef.current(pending.value);
    }, delayMs);
  }, [value, delayMs]);
}
