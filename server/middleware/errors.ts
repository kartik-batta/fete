import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import { describeError, type Logger } from '../logger';

/** A single field-level validation problem safe to show to clients. */
export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

/** An error with an HTTP status and a client-safe message. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: readonly ValidationIssue[],
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Wraps an async route handler so rejected promises reach Express' error middleware. */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

/** JSON 404 for unmatched `/api` routes (prevents the SPA fallback from answering them). */
export const apiNotFound: RequestHandler = (_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
};

/** Maps errors raised by body-parser to client-safe HTTP errors. */
function fromBodyParserError(error: unknown): HttpError | undefined {
  if (typeof error !== 'object' || error === null || !('type' in error)) return undefined;
  switch ((error as { type: unknown }).type) {
    case 'entity.parse.failed':
      return new HttpError(400, 'Malformed JSON body');
    case 'entity.too.large':
      return new HttpError(413, 'Request body too large');
    case 'encoding.unsupported':
    case 'charset.unsupported':
      return new HttpError(415, 'Unsupported request encoding');
    default:
      return undefined;
  }
}

/**
 * Final error handler. Known {@link HttpError}s are returned as-is; anything else is
 * logged server-side and reported to the client as a generic 500 with no internals.
 */
export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    const httpError = error instanceof HttpError ? error : fromBodyParserError(error);
    if (httpError) {
      res.status(httpError.status).json({
        success: false,
        error: httpError.message,
        ...(httpError.details ? { details: httpError.details } : {}),
      });
      return;
    }
    logger.error('Unhandled request error', { method: req.method, path: req.path, error: describeError(error) });
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  };
}
