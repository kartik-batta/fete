import type { Schema } from '@google/genai';
import type { z } from 'zod';
import { describeError, type Logger } from '../logger';
import type { JsonGenerator } from './client';

/** Where a response's content came from; surfaced to clients via the `X-Content-Source` header. */
export type ContentSource = 'ai' | 'fallback';

export interface GenerationResult<T> {
  readonly data: T;
  readonly source: ContentSource;
}

export interface GenerateWithFallbackOptions<T> {
  readonly generator: JsonGenerator | null;
  readonly label: string;
  readonly systemInstruction: string;
  readonly prompt: string;
  readonly responseSchema: Schema;
  /** Validates (and types) the model's JSON output. */
  readonly outputSchema: z.ZodType<T>;
  readonly fallback: () => T;
  readonly timeoutMs: number;
  readonly logger: Logger;
}

/** Thrown when a model call exceeds its time budget. */
export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Runs `task` with an `AbortSignal` that fires after `ms`, and rejects with a
 * {@link TimeoutError} even if the task ignores the signal.
 */
export async function withTimeout<T>(task: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(ms));
    }, ms);
  });
  try {
    return await Promise.race([task(controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Parses JSON without throwing; returns `undefined` for empty or malformed text. */
export function safeJsonParse(text: string | undefined): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Asks the model for structured JSON and validates it against `outputSchema`.
 *
 * Any failure (no client configured, network/API error, timeout, malformed JSON, or
 * schema mismatch) is logged server-side and the curated `fallback` is returned instead,
 * so the endpoint always answers with content of the documented shape.
 */
export async function generateWithFallback<T>(options: GenerateWithFallbackOptions<T>): Promise<GenerationResult<T>> {
  const { generator, label, logger } = options;
  const useFallback = (): GenerationResult<T> => ({ data: options.fallback(), source: 'fallback' });

  if (!generator) return useFallback();

  let raw: string | undefined;
  try {
    raw = await withTimeout(
      (signal) =>
        generator.generateJson({
          systemInstruction: options.systemInstruction,
          prompt: options.prompt,
          responseSchema: options.responseSchema,
          signal,
        }),
      options.timeoutMs,
    );
  } catch (error) {
    logger.warn(`[${label}] model call failed; serving curated fallback`, { error: describeError(error) });
    return useFallback();
  }

  const validated = options.outputSchema.safeParse(safeJsonParse(raw));
  if (!validated.success) {
    logger.warn(`[${label}] model output failed validation; serving curated fallback`, {
      issues: validated.error.issues.slice(0, 5).map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    });
    return useFallback();
  }
  return { data: validated.data, source: 'ai' };
}
