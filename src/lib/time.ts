/** Minutes in a day, used to wrap clock arithmetic past midnight. */
const MINUTES_PER_DAY = 24 * 60;

/**
 * Parses a human clock time into minutes after midnight.
 * Accepts "4:00 PM", "04:15pm", "16:30", "9 PM". Returns `null` if unparseable.
 */
export function parseClockTime(value: string): number | null {
  const match = /^\s*(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?\s*$/i.exec(value);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const meridiem = match[3]?.[0].toLowerCase();
  if (minutes > 59) return null;
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (meridiem === 'p' ? 12 : 0);
  } else if (hours > 23 || match[2] === undefined) {
    // A bare number without AM/PM ("9") is too ambiguous to trust.
    return null;
  }
  return hours * 60 + minutes;
}

/** Formats minutes after midnight as a zero-padded 12-hour time, e.g. "04:15 PM". */
export function formatClockTime(totalMinutes: number): string {
  const wrapped = ((Math.round(totalMinutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours24 = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  const hours12 = hours24 % 12 || 12;
  const meridiem = hours24 < 12 ? 'AM' : 'PM';
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`;
}

/**
 * Spreads `count` evenly spaced times strictly inside the window
 * (`start`, `end`), rounded to 5 minutes. Windows that cross midnight are
 * supported; an empty or invalid window falls back to `fallbackMinutes`.
 */
export function spreadTimes(
  startMinutes: number,
  endMinutes: number,
  count: number,
  fallbackMinutes = 6 * 60,
): string[] {
  let span = endMinutes - startMinutes;
  if (span < 0) span += MINUTES_PER_DAY;
  if (span === 0) span = fallbackMinutes;
  const step = span / (count + 1);
  return Array.from({ length: count }, (_, i) =>
    formatClockTime(Math.round((startMinutes + step * (i + 1)) / 5) * 5),
  );
}

/**
 * Shifts an ISO `YYYY-MM-DD` date by whole days (UTC-safe, no DST drift).
 * Returns the input unchanged if it is not a valid date.
 */
export function shiftIsoDate(isoDate: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Formats an ISO `YYYY-MM-DD` date as e.g. "Saturday, November 21, 2026".
 * Returns `fallback` for empty or unparseable input.
 */
export function formatLongDate(isoDate: string, fallback = 'Upcoming Date'): string {
  if (!isoDate) return fallback;
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
