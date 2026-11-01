/*
 * Pure formatting helpers used to make curated fallback content read naturally.
 */

const MINUTES_PER_DAY = 24 * 60;

/**
 * Turns an occasion slug such as `baby_shower` into a display label (`Baby Shower`).
 * Free-text occasions keep their wording; only the first letter of each word is raised.
 */
export function humanizeOccasion(occasion: string): string {
  return occasion
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formats an ISO `YYYY-MM-DD` date as e.g. `Saturday, November 21, 2026`.
 *
 * The date is interpreted as a calendar date (no timezone conversion), so it never shifts
 * by a day depending on the server's locale. Any other input is returned unchanged.
 */
export function formatEventDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return value;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return value;
  }
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Parses a clock time (`2:30 PM`, `02:30pm`, `14:30`, `9 AM`) into minutes after midnight.
 * Returns `undefined` when the value is not a recognisable time.
 */
export function parseClockTime(value: string): number | undefined {
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(?:([ap])\.?\s*m\.?)?$/i.exec(value.trim());
  if (!match) return undefined;
  const [, hourText, minuteText = '0', meridiem] = match;
  let hours = Number(hourText);
  const minutes = Number(minuteText);
  if (minutes > 59) return undefined;
  if (meridiem) {
    if (hours < 1 || hours > 12) return undefined;
    hours = (hours % 12) + (meridiem.toLowerCase() === 'p' ? 12 : 0);
  } else if (hours > 23) {
    return undefined;
  }
  return hours * 60 + minutes;
}

/**
 * Formats minutes after midnight (wrapping past 24h) as `hh:mm AM/PM`, e.g. `02:00 PM`,
 * or `2:00 PM` when `padHour` is false.
 */
export function formatClockTime(totalMinutes: number, { padHour = true } = {}): string {
  const normalized = ((Math.round(totalMinutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const hours12 = hours24 % 12 || 12;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${padHour ? pad(hours12) : hours12}:${pad(minutes)} ${hours24 < 12 ? 'AM' : 'PM'}`;
}

/** Formats a user-entered time for display (`18:00` → `6:00 PM`); unparseable input is kept. */
export function formatDisplayTime(value: string): string {
  const minutes = parseClockTime(value);
  return minutes === undefined ? value : formatClockTime(minutes, { padHour: false });
}

/**
 * Resolves an event window in minutes. Missing or unparseable bounds use the defaults;
 * an end at or before the start is treated as running past midnight.
 */
export function resolveTimeWindow(
  start: string | undefined,
  end: string | undefined,
  defaults: { start: number; end: number },
): { start: number; end: number } {
  const parse = (value: string | undefined) => (value ? parseClockTime(value) : undefined);
  const startMinutes = parse(start) ?? defaults.start;
  let endMinutes = parse(end) ?? defaults.end;
  if (endMinutes <= startMinutes) endMinutes += MINUTES_PER_DAY;
  return { start: startMinutes, end: endMinutes };
}
