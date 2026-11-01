import { rateLimit } from 'express-rate-limit';
import type { RequestHandler } from 'express';

export interface RateLimitOptions {
  readonly windowMs: number;
  readonly max: number;
}

/**
 * Per-IP rate limiter for the API. Exceeding the limit yields a JSON 429 with
 * standard `RateLimit` / `Retry-After` headers.
 */
export function apiRateLimiter({ windowMs, max }: RateLimitOptions): RequestHandler {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res, _next, options) => {
      res.status(options.statusCode).json({
        success: false,
        error: 'Too many requests. Please wait a moment and try again.',
      });
    },
  });
}
