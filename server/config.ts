import { z } from 'zod';

/** Default Gemini model; override with the `GEMINI_MODEL` environment variable. */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

/** Fully-resolved, validated runtime configuration for the server. */
export interface AppConfig {
  readonly port: number;
  readonly isProduction: boolean;
  readonly geminiApiKey: string | undefined;
  readonly geminiModel: string;
  /** Upper bound for a single Gemini call before falling back to curated content. */
  readonly geminiTimeoutMs: number;
  readonly bodyLimit: string;
  readonly rateLimit: { readonly windowMs: number; readonly max: number };
  /** Passed to Express' `trust proxy` setting so rate limiting keys on the real client IP. */
  readonly trustProxy: number | boolean;
}

const intInRange = (min: number, max: number, fallback: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, 'must be a whole number')
    .transform(Number)
    .pipe(z.number().int().min(min).max(max))
    .optional()
    .transform((value) => value ?? fallback);

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: intInRange(1, 65_535, 3000),
  GEMINI_API_KEY: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  GEMINI_MODEL: z
    .string()
    .trim()
    .regex(/^[\w.-]{1,64}$/, 'must be a valid model identifier')
    .optional(),
  GEMINI_TIMEOUT_MS: intInRange(1_000, 120_000, 20_000),
  RATE_LIMIT_WINDOW_MS: intInRange(1_000, 3_600_000, 60_000),
  RATE_LIMIT_MAX: intInRange(1, 10_000, 20),
  TRUST_PROXY: intInRange(0, 10, 0),
});

/**
 * Parses and validates configuration from environment variables.
 * Throws an `Error` listing every invalid variable so misconfiguration fails fast at boot.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${problems}`);
  }
  const vars = result.data;
  return {
    port: vars.PORT,
    isProduction: vars.NODE_ENV === 'production',
    geminiApiKey: vars.GEMINI_API_KEY,
    geminiModel: vars.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    geminiTimeoutMs: vars.GEMINI_TIMEOUT_MS,
    bodyLimit: '50kb',
    rateLimit: { windowMs: vars.RATE_LIMIT_WINDOW_MS, max: vars.RATE_LIMIT_MAX },
    trustProxy: vars.TRUST_PROXY,
  };
}
