/** Minimal structured logger interface so the app can be silenced or captured in tests. */
export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/** Logger that writes to the console; metadata is only printed when present. */
export const consoleLogger: Logger = {
  info: (message, meta) => (meta ? console.info(message, meta) : console.info(message)),
  warn: (message, meta) => (meta ? console.warn(message, meta) : console.warn(message)),
  error: (message, meta) => (meta ? console.error(message, meta) : console.error(message)),
};

/** Logger that discards everything (useful in tests). */
export const silentLogger: Logger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

/** Extracts a loggable message from an unknown thrown value without exposing it to clients. */
export function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return typeof error === 'string' ? error : 'Unknown error';
}
