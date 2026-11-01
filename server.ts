/**
 * Fête server entrypoint: loads configuration, wires the Gemini client and frontend,
 * starts listening, and shuts down gracefully on SIGTERM/SIGINT.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './server/app';
import { loadConfig } from './server/config';
import { staticFrontend, viteDevFrontend } from './server/frontend';
import { createGeminiGenerator } from './server/gemini/client';
import { consoleLogger as logger, describeError } from './server/logger';

dotenv.config({ quiet: true });

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const SHUTDOWN_GRACE_MS = 10_000;

async function main(): Promise<void> {
  const config = loadConfig();
  const generator = config.geminiApiKey ? createGeminiGenerator(config.geminiApiKey, config.geminiModel) : null;
  if (!generator) logger.warn('GEMINI_API_KEY not set: AI endpoints will serve curated fallback content.');

  const frontend = config.isProduction ? staticFrontend(path.join(rootDir, 'dist')) : await viteDevFrontend();

  const app = createApp({
    generator,
    isProduction: config.isProduction,
    geminiTimeoutMs: config.geminiTimeoutMs,
    bodyLimit: config.bodyLimit,
    rateLimit: config.rateLimit,
    trustProxy: config.trustProxy,
    logger,
    mountFrontend: frontend.mount,
  });

  const server = app.listen(config.port, '0.0.0.0', () => {
    logger.info(`Fête server running on http://0.0.0.0:${config.port} (${config.isProduction ? 'production' : 'development'})`);
  });

  const shutdown = (signal: NodeJS.Signals): void => {
    logger.info(`${signal} received, shutting down gracefully...`);
    setTimeout(() => {
      logger.error('Forced shutdown after grace period.');
      process.exit(1);
    }, SHUTDOWN_GRACE_MS).unref();
    server.closeIdleConnections();
    server.close(() => {
      frontend.close().finally(() => process.exit(0));
    });
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

main().catch((error: unknown) => {
  logger.error('Failed to start server', { error: describeError(error) });
  process.exit(1);
});
