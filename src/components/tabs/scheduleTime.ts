/**
 * Pure time helpers for the Day-of schedule and checklist.
 */

const TIME_PATTERN = /^\s*(\d{1,2})(?:[:.](\d{2}))?\s*([ap])?\.?\s*m?\.?\s*$/i;

/**
 * Parses "4:30 PM", "04:30pm", "4 pm", "16:30" or "9.15" into minutes after
 * midnight. Returns `null` when the text is not a recognisable time.
 */
export function parseTimeToMinutes(text: string): number | null {
  const match = TIME_PATTERN.exec(text ?? '');
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3]?.toLowerCase();
  if (minutes > 59) return null;
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (hours === 12) hours = 0;
    if (meridiem === 'p') hours += 12;
  } else if (hours > 23) {
    return null;
  }
  return hours * 60 + minutes;
}

/**
 * Returns a new array sorted chronologically. Unparseable times keep their
 * relative order and go last (stable sort).
 */
export function sortByTime<T extends { time: string }>(items: readonly T[]): T[] {
  return items
    .map((item, index) => ({ item, index, minutes: parseTimeToMinutes(item.time) }))
    .sort((a, b) => {
      if (a.minutes === null && b.minutes === null) return a.index - b.index;
      if (a.minutes === null) return 1;
      if (b.minutes === null) return -1;
      return a.minutes - b.minutes || a.index - b.index;
    })
    .map(({ item }) => item);
}

/**
 * Index (into chronologically sorted `items`) of the milestone happening now:
 * the last one whose start time has passed. Before the first milestone, the
 * first one is "up next" and returned with `isUpcoming: true`.
 */
export function findCurrentIndex(
  items: readonly { time: string }[],
  nowMinutes: number,
): { index: number; isUpcoming: boolean } | null {
  let current = -1;
  let firstTimed = -1;
  items.forEach((item, i) => {
    const m = parseTimeToMinutes(item.time);
    if (m === null) return;
    if (firstTimed === -1) firstTimed = i;
    if (m <= nowMinutes) current = i;
  });
  if (current !== -1) return { index: current, isUpcoming: false };
  if (firstTimed !== -1) return { index: firstTimed, isUpcoming: true };
  return null;
}

/** Local calendar date as YYYY-MM-DD. */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** True when an incomplete task's YYYY-MM-DD due date is before `todayIso`. */
export function isOverdue(task: { dueDate?: string; completed: boolean }, todayIso: string): boolean {
  return Boolean(task.dueDate) && !task.completed && (task.dueDate as string) < todayIso;
}

/** Sorts tasks by due date ascending; tasks without a date go last (stable). */
export function sortByDueDate<T extends { dueDate?: string }>(items: readonly T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const da = a.item.dueDate || '';
      const db = b.item.dueDate || '';
      if (da === db) return a.index - b.index;
      if (!da) return 1;
      if (!db) return -1;
      return da < db ? -1 : 1;
    })
    .map(({ item }) => item);
}
