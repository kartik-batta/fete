import express, { type Express } from 'express';
import path from 'node:path';
import type { ViteDevServer } from 'vite';

/** Handle to a mounted frontend, with a hook to release resources on shutdown. */
export interface Frontend {
  readonly mount: (app: Express) => void;
  readonly close: () => Promise<void>;
}

/**
 * Serves the built SPA from `distDir` with long-lived caching for hashed assets and an
 * `index.html` fallback for client-side routes.
 */
export function staticFrontend(distDir: string): Frontend {
  const indexHtml = path.join(distDir, 'index.html');
  return {
    mount: (app) => {
      app.use('/assets', express.static(path.join(distDir, 'assets'), { immutable: true, maxAge: '1y' }));
      app.use(express.static(distDir, { index: false }));
      app.get('*', (_req, res) => {
        res.setHeader('Cache-Control', 'no-cache');
        res.sendFile(indexHtml);
      });
    },
    close: async () => undefined,
  };
}

/** Starts Vite in middleware mode for development (HMR, on-the-fly TS/JSX transforms). */
export async function viteDevFrontend(): Promise<Frontend> {
  const { createServer } = await import('vite');
  const vite: ViteDevServer = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  return {
    mount: (app) => {
      app.use(vite.middlewares);
    },
    close: () => vite.close(),
  };
}
