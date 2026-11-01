import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, isAbortError, isApiError, type RequestOptions } from '../../../lib/api';

/** Lifecycle of a single AI generation, as a discriminated union. */
export type AiGenerationState<TResult> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: TResult }
  | { status: 'error'; error: ApiError };

/** Any typed API function from `lib/api` (request + options -> promise). */
export type AiRequestFn<TRequest, TResult> = (
  request: TRequest,
  options: RequestOptions,
) => Promise<TResult>;

export interface UseAiGenerationResult<TRequest, TResult> {
  state: AiGenerationState<TResult>;
  isLoading: boolean;
  /** The current error, if the last attempt failed. */
  error: ApiError | null;
  /**
   * Starts a generation, cancelling any request already in flight.
   * Resolves with the data on success, or `undefined` if the request failed,
   * was superseded, or the component unmounted — so callers can safely set
   * state with the result without extra guards.
   */
  generate: (request: TRequest) => Promise<TResult | undefined>;
  /** Cancels the in-flight request (if any) and returns to `idle`. */
  cancel: () => void;
  /** Clears any error/success state without cancelling. */
  reset: () => void;
}

function toApiError(error: unknown): ApiError {
  return isApiError(error) ? error : new ApiError('network', undefined, { cause: error });
}

/**
 * Wraps an AI API call with loading/error state and cancellation.
 *
 * - Only the latest request may update state; earlier ones are aborted.
 * - The in-flight request is aborted automatically on unmount.
 * - Deliberate cancellations never surface as errors.
 *
 * @example
 * const themes = useAiGeneration(generateThemes);
 * const result = await themes.generate(buildThemesRequest(event, vibe, notes));
 */
export function useAiGeneration<TRequest, TResult>(
  requestFn: AiRequestFn<TRequest, TResult>,
): UseAiGenerationResult<TRequest, TResult> {
  const [state, setState] = useState<AiGenerationState<TResult>>({ status: 'idle' });
  const controllerRef = useRef<AbortController | null>(null);
  const requestFnRef = useRef(requestFn);
  requestFnRef.current = requestFn;

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    },
    [],
  );

  const generate = useCallback(async (request: TRequest) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ status: 'loading' });

    try {
      const data = await requestFnRef.current(request, { signal: controller.signal });
      if (controllerRef.current !== controller) return undefined;
      controllerRef.current = null;
      setState({ status: 'success', data });
      return data;
    } catch (err) {
      if (controllerRef.current !== controller || isAbortError(err)) return undefined;
      controllerRef.current = null;
      setState({ status: 'error', error: toApiError(err) });
      return undefined;
    }
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState({ status: 'idle' });
  }, []);

  const reset = useCallback(() => {
    setState((prev) => (prev.status === 'loading' ? prev : { status: 'idle' }));
  }, []);

  return {
    state,
    isLoading: state.status === 'loading',
    error: state.status === 'error' ? state.error : null,
    generate,
    cancel,
    reset,
  };
}
