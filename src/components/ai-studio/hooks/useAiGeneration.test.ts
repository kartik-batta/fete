import { act, renderHook, waitFor } from '@testing-library/react';
import { ApiError, type RequestOptions } from '../../../lib/api';
import { useAiGeneration } from './useAiGeneration';

/** A request function whose promises the test resolves/rejects by hand. */
function deferredRequest<T>() {
  const calls: {
    signal?: AbortSignal;
    resolve: (value: T) => void;
    reject: (err: unknown) => void;
  }[] = [];
  const fn = vi.fn(
    (_req: string, { signal }: RequestOptions) =>
      new Promise<T>((resolve, reject) => {
        calls.push({ signal, resolve, reject });
        signal?.addEventListener('abort', () => reject(new ApiError('aborted')));
      }),
  );
  return { fn, calls };
}

describe('useAiGeneration', () => {
  it('moves idle -> loading -> success and resolves with the data', async () => {
    const { fn, calls } = deferredRequest<number>();
    const { result } = renderHook(() => useAiGeneration(fn));
    expect(result.current.state).toEqual({ status: 'idle' });

    let promise!: Promise<number | undefined>;
    act(() => {
      promise = result.current.generate('req');
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => calls[0].resolve(42));
    await expect(promise).resolves.toBe(42);
    expect(result.current.state).toEqual({ status: 'success', data: 42 });
    expect(fn).toHaveBeenCalledWith('req', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('exposes normalised errors and resolves undefined', async () => {
    const { fn, calls } = deferredRequest<number>();
    const { result } = renderHook(() => useAiGeneration(fn));
    let promise!: Promise<number | undefined>;
    act(() => {
      promise = result.current.generate('req');
    });
    await act(async () => calls[0].reject(new ApiError('http', 'Boom', { status: 500 })));
    await expect(promise).resolves.toBeUndefined();
    expect(result.current.error?.message).toBe('Boom');
    expect(result.current.isLoading).toBe(false);
  });

  it('wraps unknown errors in ApiError', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('weird'));
    const { result } = renderHook(() => useAiGeneration(fn));
    await act(async () => {
      await result.current.generate('req');
    });
    expect(result.current.error).toBeInstanceOf(ApiError);
  });

  it('aborts a superseded request and only applies the latest result', async () => {
    const { fn, calls } = deferredRequest<string>();
    const { result } = renderHook(() => useAiGeneration(fn));
    let first!: Promise<string | undefined>;
    act(() => {
      first = result.current.generate('one');
    });
    act(() => {
      void result.current.generate('two');
    });
    expect(calls[0].signal?.aborted).toBe(true);
    await expect(first).resolves.toBeUndefined();

    await act(async () => calls[1].resolve('second'));
    expect(result.current.state).toEqual({ status: 'success', data: 'second' });
  });

  it('cancel() aborts and returns to idle without an error', async () => {
    const { fn, calls } = deferredRequest<string>();
    const { result } = renderHook(() => useAiGeneration(fn));
    act(() => {
      void result.current.generate('one');
    });
    act(() => result.current.cancel());
    expect(calls[0].signal?.aborted).toBe(true);
    await waitFor(() => expect(result.current.state).toEqual({ status: 'idle' }));
  });

  it('aborts the in-flight request on unmount', () => {
    const { fn, calls } = deferredRequest<string>();
    const { result, unmount } = renderHook(() => useAiGeneration(fn));
    act(() => {
      void result.current.generate('one');
    });
    unmount();
    expect(calls[0].signal?.aborted).toBe(true);
  });

  it('reset() clears an error', async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError('network'));
    const { result } = renderHook(() => useAiGeneration(fn));
    await act(async () => {
      await result.current.generate('req');
    });
    expect(result.current.error).not.toBeNull();
    act(() => result.current.reset());
    expect(result.current.state).toEqual({ status: 'idle' });
  });
});
