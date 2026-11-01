/**
 * Shared form helpers: input limits, sanitisation and validators used by the
 * modal forms. Kept framework-free so they are trivially unit-testable.
 */

/** Maximum lengths for free-text inputs (defence against runaway payloads). */
export const LIMITS = {
  name: 100,
  title: 150,
  short: 80,
  email: 254,
  phone: 32,
  url: 2048,
  notes: 1000,
  amount: 10_000_000,
} as const;

// C0/C1 control characters, excluding tab (\u0009), newline (\u000A) and carriage return (\u000D).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

/** Trim, strip control characters and clamp a user-entered string. */
export function sanitizeText(value: string | undefined | null, maxLength: number = LIMITS.notes): string {
  return (value ?? '').replace(CONTROL_CHARS, '').trim().slice(0, maxLength);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return value.length <= LIMITS.email && EMAIL_PATTERN.test(value);
}

const PHONE_PATTERN = /^[+()\d\s.-]{5,32}$/;

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(value);
}

/**
 * Normalise a user-supplied website into an absolute http(s) URL.
 * Returns `null` for anything that is not http/https (e.g. `javascript:`),
 * so the value can never become a script-executing link.
 */
export function toSafeHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/** Parse a currency amount; returns `null` when not a finite number within range. */
export function parseAmount(value: string, max: number = LIMITS.amount): number | null {
  if (value.trim() === '') return 0;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  return Math.round(n * 100) / 100;
}

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

export function isValidHex(value: string): boolean {
  return HEX_PATTERN.test(value);
}

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}
