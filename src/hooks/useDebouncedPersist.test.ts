import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedPersist } from './useDebouncedPersist';

describe('useDebouncedPersist', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const setup = (persist = vi.fn()) =>
    renderHook(({ value }) => useDebouncedPersist(value, persist, 300), { initialProps: { value: 0 } });

  it('skips the initial value', () => {
    const persist = vi.fn();
    setup(persist);
    act(() => vi.advanceTimersByTime(1000));
    expect(persist).not.toHaveBeenCalled();
  });

  it('coalesces rapid changes into one write of the latest value', () => {
    const persist = vi.fn();
    const { rerender } = setup(persist);
    rerender({ value: 1 });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: 2 });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: 3 });
    expect(persist).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith(3);
  });

  it('flushes immediately on pagehide', () => {
    const persist = vi.fn();
    const { rerender } = setup(persist);
    rerender({ value: 7 });
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(persist).toHaveBeenCalledWith(7);
    act(() => vi.advanceTimersByTime(1000));
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('flushes when the document becomes hidden', () => {
    const persist = vi.fn();
    const { rerender } = setup(persist);
    rerender({ value: 4 });
    const spy = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    spy.mockRestore();
    expect(persist).toHaveBeenCalledWith(4);
  });

  it('flushes a pending write on unmount and removes listeners', () => {
    const persist = vi.fn();
    const { rerender, unmount } = setup(persist);
    rerender({ value: 9 });
    unmount();
    expect(persist).toHaveBeenCalledWith(9);
    window.dispatchEvent(new Event('pagehide'));
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('does not write on pagehide when nothing is pending', () => {
    const persist = vi.fn();
    setup(persist);
    window.dispatchEvent(new Event('pagehide'));
    expect(persist).not.toHaveBeenCalled();
  });
});
