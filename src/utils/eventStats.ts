/**
 * Pure, side-effect-free derivations over event data.
 *
 * Every dashboard surface (hero, overview, budget) used to recompute these
 * inline on each render with slightly different formulas. Centralising them
 * keeps the numbers consistent across tabs, makes them trivially unit-testable,
 * and lets components memoise on the relevant slice of state.
 */
import type { ChecklistTask, EventData, Expense, ExpenseCategory, Guest, Vendor, VendorCategory } from '../types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Budget utilisation above this percentage is flagged as "getting tight". */
export const BUDGET_WARNING_THRESHOLD = 85;

export const EXPENSE_CATEGORY_LABELS: Readonly<Record<ExpenseCategory, string>> = {
  venue: 'Venue & Location',
  catering: 'Catering & Drinks',
  decor: 'Décor & Florals',
  entertainment: 'Music & Entertainment',
  photo: 'Photography & Video',
  favors: 'Favors & Stationery',
  apparel: 'Attire & Styling',
  other: 'Miscellaneous',
};

export const EXPENSE_CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[];

/** Coerces possibly-missing / NaN / negative amounts to a safe non-negative number. */
function amount(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/** Integer percentage of `part / whole`, or 0 when `whole` is not positive. */
export function percentOf(part: number, whole: number): number {
  // Multiply first so e.g. 1130/2000 is exactly 56.5 (rounds to 57), not 56.4999…
  return whole > 0 ? Math.round((part * 100) / whole) : 0;
}

/** Clamps a percentage into the 0–100 range for progress-bar widths. */
export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

// ---------------------------------------------------------------------------
// Countdown
// ---------------------------------------------------------------------------

/**
 * Whole calendar days from `now` until an ISO `YYYY-MM-DD` date, in local time.
 * Returns `null` for missing or unparseable dates; negative once the date has passed.
 */
export function getDaysUntil(isoDate: string | undefined, now: Date = new Date()): number | null {
  if (!isoDate) return null;
  const target = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}

/**
 * Human label for an event's countdown badge. The event's own status wins:
 * only an event marked `celebrated` reads "Celebrated!"; a past date that was
 * never marked as such is flagged instead of silently congratulated.
 */
export function formatCountdown(daysLeft: number, status?: EventData['status']): string {
  if (status === 'celebrated') return 'Celebrated!';
  if (daysLeft > 1) return `${daysLeft} days to go`;
  if (daysLeft === 1) return '1 day to go';
  if (daysLeft === 0) return 'Today is celebration day!';
  const ago = Math.abs(daysLeft);
  return `Date passed ${ago} day${ago === 1 ? '' : 's'} ago`;
}

/** Milliseconds until the next local midnight — when a day countdown changes. */
export function msUntilNextMidnight(now: Date = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

// ---------------------------------------------------------------------------
// Guests
// ---------------------------------------------------------------------------

export interface GuestStats {
  /** Number of invitations (one per guest record). */
  invited: number;
  attending: number;
  pending: number;
  declined: number;
  /** Attending guests plus their plus-ones — the real catering headcount. */
  headcount: number;
}

export function getGuestStats(guests: readonly Guest[]): GuestStats {
  const stats: GuestStats = { invited: guests.length, attending: 0, pending: 0, declined: 0, headcount: 0 };
  for (const guest of guests) {
    if (guest.rsvp === 'attending') {
      stats.attending += 1;
      stats.headcount += 1 + amount(guest.plusOnes);
    } else if (guest.rsvp === 'pending') {
      stats.pending += 1;
    } else if (guest.rsvp === 'declined') {
      stats.declined += 1;
    }
  }
  return stats;
}

export interface DietaryNote {
  name: string;
  dietary: string;
}

/** Guests with a meaningful dietary requirement (ignores blank and "none"). */
export function getDietaryNotes(guests: readonly Guest[]): DietaryNote[] {
  return guests
    .filter((g) => g.dietary && g.dietary.trim() && g.dietary.trim().toLowerCase() !== 'none')
    .map((g) => ({ name: g.name, dietary: g.dietary.trim() }));
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

/** What an expense currently commits: the actual paid amount once known, else the estimate. */
export function getCommittedAmount(expense: Pick<Expense, 'actual' | 'budgeted'>): number {
  const actual = amount(expense.actual);
  return actual > 0 ? actual : amount(expense.budgeted);
}

/** Expense statuses where money has actually changed hands. */
const PAID_STATUSES: ReadonlySet<Expense['status']> = new Set(['deposit_paid', 'paid_in_full']);

/** Amount actually paid out for an expense: its actual cost once a deposit or full payment is made. */
export function getPaidAmount(expense: Pick<Expense, 'actual' | 'status'>): number {
  return PAID_STATUSES.has(expense.status) ? amount(expense.actual) : 0;
}

export type BudgetHealth = 'healthy' | 'warning' | 'over';
/** Where committed spend sits relative to the total budget. */
export type BudgetPosition = 'under' | 'on' | 'over';

export interface BudgetStats {
  totalBudget: number;
  /** Sum of the original estimates. */
  totalBudgeted: number;
  /** Sum of recorded actual costs, regardless of payment status. */
  totalActual: number;
  /** Sum of {@link getCommittedAmount} over all expenses. */
  totalCommitted: number;
  /** Money already paid (deposit or full) — see {@link getPaidAmount}. */
  totalPaid: number;
  /** Committed but not yet paid. */
  outstanding: number;
  /** Funds left, floored at zero. */
  remaining: number;
  /** How far committed spend exceeds the budget (0 when within it). */
  overBy: number;
  position: BudgetPosition;
  /** Committed as a percentage of the total budget (may exceed 100). */
  percentCommitted: number;
  isOverBudget: boolean;
  health: BudgetHealth;
}

export function getBudgetHealth(percentCommitted: number): BudgetHealth {
  if (percentCommitted > 100) return 'over';
  if (percentCommitted > BUDGET_WARNING_THRESHOLD) return 'warning';
  return 'healthy';
}

export function getBudgetStats(expenses: readonly Expense[], totalBudget: number): BudgetStats {
  const budget = amount(totalBudget);
  let totalBudgeted = 0;
  let totalActual = 0;
  let totalCommitted = 0;
  let totalPaid = 0;
  for (const exp of expenses) {
    totalBudgeted += amount(exp.budgeted);
    totalActual += amount(exp.actual);
    totalCommitted += getCommittedAmount(exp);
    totalPaid += getPaidAmount(exp);
  }
  const balance = budget - totalCommitted;
  const position: BudgetPosition = balance > 0 ? 'under' : balance === 0 ? 'on' : 'over';
  const percentCommitted = percentOf(totalCommitted, budget);
  return {
    totalBudget: budget,
    totalBudgeted,
    totalActual,
    totalCommitted,
    totalPaid,
    outstanding: Math.max(0, totalCommitted - totalPaid),
    remaining: Math.max(0, balance),
    overBy: Math.max(0, -balance),
    position,
    percentCommitted,
    isOverBudget: position === 'over',
    health: position === 'over' ? 'over' : getBudgetHealth(percentCommitted),
  };
}

export interface CategoryTotal {
  budgeted: number;
  actual: number;
  committed: number;
  count: number;
  /** How much recorded actual costs exceed the estimates for this category (0 if not). */
  overBy: number;
}

/** Per-category sums. Every category is present, even when empty. */
export function getCategoryTotals(expenses: readonly Expense[]): Record<ExpenseCategory, CategoryTotal> {
  const totals = Object.fromEntries(
    EXPENSE_CATEGORIES.map((cat) => [cat, { budgeted: 0, actual: 0, committed: 0, count: 0, overBy: 0 }])
  ) as Record<ExpenseCategory, CategoryTotal>;
  for (const exp of expenses) {
    const bucket = totals[exp.category] ?? totals.other;
    bucket.budgeted += amount(exp.budgeted);
    bucket.actual += amount(exp.actual);
    bucket.committed += getCommittedAmount(exp);
    bucket.count += 1;
  }
  for (const bucket of Object.values(totals)) {
    bucket.overBy = Math.max(0, bucket.actual - bucket.budgeted);
  }
  return totals;
}

/** Categories whose actual costs have run past their estimates, worst first. */
export function getOverAllocatedCategories(
  totals: Record<ExpenseCategory, CategoryTotal>
): { category: ExpenseCategory; overBy: number }[] {
  return EXPENSE_CATEGORIES.filter((cat) => totals[cat].overBy > 0)
    .map((category) => ({ category, overBy: totals[category].overBy }))
    .sort((a, b) => b.overBy - a.overBy);
}

/** The `limit` expenses with the highest committed amount, largest first. */
export function getLargestExpenses(expenses: readonly Expense[], limit = 3): Expense[] {
  return [...expenses]
    .sort((a, b) => getCommittedAmount(b) - getCommittedAmount(a))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export interface TaskStats {
  total: number;
  completed: number;
  /** Integer completion percentage, 0–100. */
  percent: number;
}

export function getTaskStats(tasks: readonly ChecklistTask[]): TaskStats {
  const completed = tasks.reduce((n, t) => (t.completed ? n + 1 : n), 0);
  return { total: tasks.length, completed, percent: percentOf(completed, tasks.length) };
}

const PRIORITY_RANK: Record<ChecklistTask['priority'], number> = { high: 0, medium: 1, low: 2 };

/**
 * Next open tasks to surface on the dashboard: incomplete only, high priority
 * first, then earliest due date. Stable for equal keys.
 */
export function getUpcomingTasks(tasks: readonly ChecklistTask[], limit = 4): ChecklistTask[] {
  return tasks
    .filter((t) => !t.completed)
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      const byPriority = (PRIORITY_RANK[a.task.priority] ?? 3) - (PRIORITY_RANK[b.task.priority] ?? 3);
      if (byPriority !== 0) return byPriority;
      const byDue = (a.task.dueDate || '9999').localeCompare(b.task.dueDate || '9999');
      return byDue !== 0 ? byDue : a.index - b.index;
    })
    .slice(0, limit)
    .map(({ task }) => task);
}

/** Incomplete tasks whose ISO due date is before today (local time). */
export function getOverdueTasks(tasks: readonly ChecklistTask[], now: Date = new Date()): ChecklistTask[] {
  return tasks.filter((t) => {
    if (t.completed) return false;
    const days = getDaysUntil(t.dueDate, now);
    return days !== null && days < 0;
  });
}

// ---------------------------------------------------------------------------
// Vendors & "needs attention"
// ---------------------------------------------------------------------------

/** Vendor categories nearly every celebration needs locked in. */
export const ESSENTIAL_VENDOR_CATEGORIES: readonly VendorCategory[] = ['venue', 'catering'];

const SECURED_VENDOR_STATUSES: ReadonlySet<Vendor['status']> = new Set(['booked', 'paid']);

/** Essential categories with no vendor booked or paid yet. */
export function getUnbookedEssentialVendors(vendors: readonly Vendor[]): VendorCategory[] {
  return ESSENTIAL_VENDOR_CATEGORIES.filter(
    (cat) => !vendors.some((v) => v.category === cat && SECURED_VENDOR_STATUSES.has(v.status))
  );
}

export type AttentionKind = 'overdue_tasks' | 'pending_rsvps' | 'budget' | 'vendors';

export interface AttentionItem {
  kind: AttentionKind;
  severity: 'high' | 'medium';
  message: string;
  /** Tab that resolves this item. */
  tab: 'tasks' | 'guests' | 'budget' | 'vendors';
}

const VENDOR_CATEGORY_NAMES: Partial<Record<VendorCategory, string>> = { venue: 'venue', catering: 'caterer' };

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

/**
 * Actionable planning risks for the dashboard, most severe first. Skipped
 * entirely once an event is marked celebrated.
 */
export function getAttentionItems(event: EventData, now: Date = new Date()): AttentionItem[] {
  if (event.status === 'celebrated') return [];
  const items: AttentionItem[] = [];

  const overdue = getOverdueTasks(event.tasks, now).length;
  if (overdue > 0) {
    items.push({ kind: 'overdue_tasks', severity: 'high', tab: 'tasks', message: `${plural(overdue, 'task')} overdue` });
  }

  const budget = getBudgetStats(event.expenses, event.totalBudget);
  if (budget.position === 'over') {
    items.push({
      kind: 'budget',
      severity: 'high',
      tab: 'budget',
      message: `Over budget by $${budget.overBy.toLocaleString()}`,
    });
  } else if (budget.health === 'warning' || budget.position === 'on') {
    items.push({
      kind: 'budget',
      severity: 'medium',
      tab: 'budget',
      message: `${budget.percentCommitted}% of budget committed`,
    });
  }

  const missing = getUnbookedEssentialVendors(event.vendors);
  if (missing.length > 0) {
    const names = missing.map((c) => VENDOR_CATEGORY_NAMES[c] ?? c).join(' & ');
    items.push({ kind: 'vendors', severity: 'high', tab: 'vendors', message: `No ${names} booked yet` });
  }

  const pending = getGuestStats(event.guests).pending;
  if (pending > 0) {
    items.push({
      kind: 'pending_rsvps',
      severity: 'medium',
      tab: 'guests',
      message: `${plural(pending, 'RSVP')} still pending`,
    });
  }

  return items.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'high' ? -1 : 1));
}

// ---------------------------------------------------------------------------
// Sharing
// ---------------------------------------------------------------------------

/** Plain-text event summary for pasting into a message or email. */
export function buildEventShareSummary(event: EventData, now: Date = new Date()): string {
  const guests = getGuestStats(event.guests);
  const lines = [`🎉 ${event.title}`];
  if (event.date) {
    const when = new Date(`${event.date}T00:00:00`);
    const dateLabel = Number.isNaN(when.getTime())
      ? event.date
      : when.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    lines.push(`📅 ${dateLabel}${event.time ? ` at ${event.time}` : ''}`);
    const days = getDaysUntil(event.date, now);
    if (days !== null && event.status !== 'celebrated' && days >= 0) lines.push(`⏳ ${formatCountdown(days)}`);
  }
  const place = [event.venueName, event.location].filter(Boolean).join(', ');
  if (place) lines.push(`📍 ${place}`);
  lines.push(
    `💌 RSVPs: ${guests.attending} attending (${guests.headcount} incl. plus-ones), ${guests.pending} pending, ${guests.declined} declined`
  );
  if (event.hostName) lines.push(`Hosted by ${event.hostName}`);
  return lines.join('\n');
}
