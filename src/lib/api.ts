/**
 * Typed client for the Fête AI endpoints (`/api/gemini/*`).
 *
 * Responsibilities:
 * - serialise typed request bodies,
 * - enforce a per-request timeout via `AbortController` (while still honouring
 *   a caller-supplied `AbortSignal`),
 * - normalise every failure mode into a single {@link ApiError} type,
 * - validate response bodies at runtime before returning strictly typed data.
 *
 * The Gemini API key never reaches the browser: these calls go to our own
 * Express server, which talks to Gemini.
 */
import type {
  AITheme,
  CuratedIdeas,
  GeneratedInvitation,
  IdeasRequest,
  InvitationRequest,
  ThemesRequest,
  TimelineEvent,
  TimelineRequest,
} from '../types';
import {
  parseIdeasResponse,
  parseInvitationResponse,
  parseThemesResponse,
  parseTimelineResponse,
  ResponseShapeError,
} from './aiResponseParsers';

/** Default time budget for a single AI request. Model calls can be slow. */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** Base path of the AI proxy routes on our server. */
export const AI_API_BASE = '/api/gemini';

/** Every way an API call can fail, as a discriminant on {@link ApiError}. */
export type ApiErrorKind =
  | 'http' // server answered with a non-2xx status
  | 'network' // request never got a response (offline, DNS, CORS...)
  | 'timeout' // our own deadline elapsed
  | 'aborted' // the caller cancelled (e.g. component unmounted)
  | 'parse' // body was not valid JSON
  | 'invalid_response'; // JSON did not match the expected contract

const USER_MESSAGES: Record<ApiErrorKind, string> = {
  http: 'The AI concierge is unavailable right now. Please try again shortly.',
  network: 'We could not reach the server. Check your connection and try again.',
  timeout: 'The AI concierge took too long to respond. Please try again.',
  aborted: 'The request was cancelled.',
  parse: 'The AI concierge sent an unreadable reply. Please try again.',
  invalid_response: 'The AI concierge sent an unexpected reply. Please try again.',
};

/** Normalised error thrown by every function in this module. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP status code, present only when `kind === 'http'`. */
  readonly status?: number;

  constructor(kind: ApiErrorKind, message?: string, options?: { status?: number; cause?: unknown }) {
    super(message ?? USER_MESSAGES[kind], { cause: options?.cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options?.status;
  }
}

/** Type guard for {@link ApiError}. */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Returns true when an error represents a deliberate cancellation. */
export function isAbortError(error: unknown): boolean {
  return isApiError(error) && error.kind === 'aborted';
}

/** Options accepted by every endpoint function. */
export interface RequestOptions {
  /** Caller-controlled cancellation (e.g. on unmount or a newer request). */
  signal?: AbortSignal;
  /** Overrides {@link DEFAULT_TIMEOUT_MS}. */
  timeoutMs?: number;
  /** Injectable fetch implementation, mainly for tests. Defaults to global `fetch`. */
  fetchImpl?: typeof fetch;
}

/** Extracts a human-readable message from an error body like `{ error: "..." }`. */
function messageFromErrorBody(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const { error, message } = body as { error?: unknown; message?: unknown };
  if (typeof error === 'string' && error.trim()) return error;
  if (typeof message === 'string' && message.trim()) return message;
  return undefined;
}

/**
 * POSTs `body` as JSON to `path`, then validates the reply with `parse`.
 *
 * @throws {ApiError} for any transport, status, JSON or shape failure.
 */
export async function postJson<TBody, TResult>(
  path: string,
  body: TBody,
  parse: (json: unknown) => TResult,
  { signal, timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch }: RequestOptions = {},
): Promise<TResult> {
  if (signal?.aborted) throw new ApiError('aborted');

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const forwardAbort = () => controller.abort();
  signal?.addEventListener('abort', forwardAbort, { once: true });

  try {
    let response: Response;
    try {
      response = await fetchImpl(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (cause) {
      if (timedOut) throw new ApiError('timeout', undefined, { cause });
      if (controller.signal.aborted) throw new ApiError('aborted', undefined, { cause });
      throw new ApiError('network', undefined, { cause });
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch (cause) {
      if (timedOut) throw new ApiError('timeout', undefined, { cause });
      if (controller.signal.aborted) throw new ApiError('aborted', undefined, { cause });
      if (!response.ok) throw new ApiError('http', undefined, { status: response.status, cause });
      throw new ApiError('parse', undefined, { cause });
    }

    if (!response.ok) {
      throw new ApiError('http', messageFromErrorBody(json), { status: response.status });
    }

    try {
      return parse(json);
    } catch (cause) {
      if (cause instanceof ResponseShapeError) {
        throw new ApiError('invalid_response', undefined, { cause });
      }
      throw cause;
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}

/** Requests three AI-styled theme concepts for the celebration. */
export function generateThemes(request: ThemesRequest, options?: RequestOptions): Promise<AITheme[]> {
  return postJson(`${AI_API_BASE}/themes`, request, parseThemesResponse, options);
}

/** Requests invitation or thank-you wording in the chosen tone. */
export function generateInvitation(
  request: InvitationRequest,
  options?: RequestOptions,
): Promise<GeneratedInvitation> {
  return postJson(`${AI_API_BASE}/invitation`, request, parseInvitationResponse, options);
}

/** Requests an ordered day-of run-of-show. */
export function generateTimeline(
  request: TimelineRequest,
  options?: RequestOptions,
): Promise<TimelineEvent[]> {
  return postJson(`${AI_API_BASE}/timeline`, request, parseTimelineResponse, options);
}

/** Requests curated décor, menu and activity ideas. */
export function generateIdeas(request: IdeasRequest, options?: RequestOptions): Promise<CuratedIdeas> {
  return postJson(`${AI_API_BASE}/ideas`, request, parseIdeasResponse, options);
}
