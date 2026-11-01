import type { z } from 'zod';
import { HttpError, type ValidationIssue } from './errors';

/**
 * Validates an untrusted request body against `schema`.
 * Throws a 400 {@link HttpError} listing each invalid field (without echoing input values).
 */
export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body ?? {});
  if (result.success) return result.data;
  const details: ValidationIssue[] = result.error.issues.map((issue) => ({
    path: issue.path.map(String).join('.') || '(body)',
    message: issue.message,
  }));
  throw new HttpError(400, 'Invalid request body', details);
}
