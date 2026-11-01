import helmet from 'helmet';
import type { RequestHandler } from 'express';

const GOOGLE_FONTS_CSS = 'https://fonts.googleapis.com';
const GOOGLE_FONTS_FILES = 'https://fonts.gstatic.com';

/**
 * Builds the Content-Security-Policy directives.
 *
 * Production is strict: scripts only from our origin, fonts/styles only from Google Fonts.
 * Development additionally allows inline/eval scripts and websocket connections, which
 * Vite's HMR client and React Refresh preamble require.
 */
export function buildCspDirectives(isProduction: boolean): Record<string, string[] | null> {
  const devScript = isProduction ? [] : ["'unsafe-inline'", "'unsafe-eval'"];
  const devConnect = isProduction ? [] : ['ws:', 'wss:'];
  return {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    scriptSrc: ["'self'", ...devScript],
    // Inline style attributes are used by motion/React for animations.
    styleSrc: ["'self'", "'unsafe-inline'", GOOGLE_FONTS_CSS],
    fontSrc: ["'self'", 'data:', GOOGLE_FONTS_FILES],
    imgSrc: ["'self'", 'data:', 'blob:'],
    connectSrc: ["'self'", ...devConnect],
    // canvas-confetti renders in a Web Worker created from a blob: URL.
    workerSrc: ["'self'", 'blob:'],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: isProduction ? [] : null,
  };
}

/** Helmet configured with the app's CSP; HSTS is only sent in production. */
export function securityHeaders(isProduction: boolean): RequestHandler {
  return helmet({
    contentSecurityPolicy: { useDefaults: false, directives: buildCspDirectives(isProduction) },
    strictTransportSecurity: isProduction,
    crossOriginEmbedderPolicy: false,
  });
}

/** Marks API responses as non-cacheable since they are personalised and generated. */
export const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
};
