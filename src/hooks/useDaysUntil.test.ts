import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDaysUntil } from './useDaysUntil';

describe('useDaysUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 1, 23, 0, 0)); // 1 Nov, 11pm local
  });
  afterEach(() => vi.useRealTimers());

  it('returns the day countdown', () => {
    const { result } = renderHook(() => useDaysUntil('2026-11-03'));
    expect(result.current).toBe(2);
  });

  it('returns null without a date', () => {
    const { result } = renderHook(() => useDaysUntil(''));
    expect(result.current).toBeNull();
  });

  it('ticks once at midnight rather than polling', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const { result } = renderHook(() => useDaysUntil('2026-11-03'));
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(60 * 60 * 1000 + 100));
    expect(result.current).toBe(1);
    expect(vi.getTimerCount()).toBe(1); // re-armed for the following midnight
  });

  it('clears its timer on unmount', () => {
    const { unmount } = renderHook(() => useDaysUntil('2026-11-03'));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
