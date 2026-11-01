import express, { type Express } from 'express';
import type { JsonGenerator } from './gemini/client';
import { consoleLogger, type Logger } from './logger';
import { apiNotFound, errorHandler } from './middleware/errors';
import { apiRateLimiter, type RateLimitOptions } from './middleware/rateLimit';
import { noStore, securityHeaders } from './middleware/security';
import { createGeminiRouter } from './routes/gemini';

export interface AppDeps {
  /** LLM client; pass `null` to always serve curated fallback content. */
  readonly generator: JsonGenerator | null;
  readonly isProduction?: boolean;
  readonly geminiTimeoutMs?: number;
  readonly bodyLimit?: string;
  readonly rateLimit?: RateLimitOptions;
  readonly trustProxy?: number | boolean;
  readonly logger?: Logger;
  /**
   * Mounts frontend handlers (Vite dev middleware or static `dist`) after the API routes
   * but before the error handler.
   */
  readonly mountFrontend?: (app: Express) => void;
}

/**
 * Builds the Express application without binding a port, so it can be exercised
 * directly by tests (e.g. with supertest) or wrapped by the production entrypoint.
 */
export function createApp(deps: AppDeps): Express {
  const logger = deps.logger ?? consoleLogger;
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', deps.trustProxy ?? 0);
  app.use(securityHeaders(deps.isProduction ?? true));

  app.use(
    '/api',
    noStore,
    apiRateLimiter(deps.rateLimit ?? { windowMs: 60_000, max: 20 }),
    express.json({ limit: deps.bodyLimit ?? '50kb' }),
  );
  app.use(
    '/api/gemini',
    createGeminiRouter({ generator: deps.generator, timeoutMs: deps.geminiTimeoutMs ?? 20_000, logger }),
  );
  app.use('/api', apiNotFound);

  deps.mountFrontend?.(app);

  app.use(errorHandler(logger));
  return app;
}
