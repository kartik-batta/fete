import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useHashTab } from './useHashTab';

const TABS = ['overview', 'budget', 'guests'] as const;

describe('useHashTab', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('uses the fallback when the hash is empty or unknown', () => {
    window.history.replaceState(null, '', '/#not-a-tab');
    const { result } = renderHook(() => useHashTab(TABS, 'overview'));
    expect(result.current[0]).toBe('overview');
  });

  it('reads a valid tab from the hash', () => {
    window.history.replaceState(null, '', '/#budget');
    const { result } = renderHook(() => useHashTab(TABS, 'overview'));
    expect(result.current[0]).toBe('budget');
  });

  it('updates state and the URL on select, ignoring unknown tabs', () => {
    const { result } = renderHook(() => useHashTab(TABS, 'overview'));
    act(() => result.current[1]('guests'));
    expect(result.current[0]).toBe('guests');
    expect(window.location.hash).toBe('#guests');
    act(() => result.current[1]('javascript:alert(1)'));
    expect(result.current[0]).toBe('guests');
  });

  it('follows browser hash changes', () => {
    const { result } = renderHook(() => useHashTab(TABS, 'overview'));
    act(() => {
      window.history.replaceState(null, '', '/#budget');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(result.current[0]).toBe('budget');
  });
});
