import { describe, expect, it } from 'vitest';
import type { ChecklistTask, EventData, Expense, Guest, Vendor } from '../types';
import {
  buildEventShareSummary,
  clampPercent,
  formatCountdown,
  getAttentionItems,
  getBudgetHealth,
  getBudgetStats,
  getCategoryTotals,
  getCommittedAmount,
  getDaysUntil,
  getDietaryNotes,
  getGuestStats,
  getLargestExpenses,
  getOverAllocatedCategories,
  getOverdueTasks,
  getPaidAmount,
  getTaskStats,
  getUnbookedEssentialVendors,
  getUpcomingTasks,
  msUntilNextMidnight,
  percentOf,
} from './eventStats';

const guest = (over: Partial<Guest>): Guest => ({
  id: Math.random().toString(36),
  name: 'Guest',
  email: '',
  phone: '',
  rsvp: 'pending',
  plusOnes: 0,
  dietary: '',
  group: 'friends',
  ...over,
});

const expense = (over: Partial<Expense>): Expense => ({
  id: Math.random().toString(36),
  category: 'other',
  name: 'Item',
  budgeted: 0,
  actual: 0,
  status: 'planned',
  ...over,
});

const task = (over: Partial<ChecklistTask>): ChecklistTask => ({
  id: Math.random().toString(36),
  title: 'Task',
  phase: '1_month_before',
  dueDate: '',
  completed: false,
  priority: 'medium',
  assignedTo: 'Me',
  ...over,
});

const vendor = (over: Partial<Vendor>): Vendor => ({
  id: Math.random().toString(36),
  name: 'Vendor',
  category: 'other',
  contactPerson: '',
  phone: '',
  email: '',
  website: '',
  costQuote: 0,
  status: 'researching',
  notes: '',
  ...over,
});

const baseEvent = (over: Partial<EventData> = {}): EventData => ({
  id: 'e1',
  title: 'Garden Party',
  occasion: 'birthday',
  date: '2026-11-21',
  time: '4:00 PM',
  location: 'Napa',
  venueName: 'The Grove',
  hostName: 'Maya',
  hostEmail: '',
  totalBudget: 1000,
  themeTitle: '',
  themeDescription: '',
  themePalette: [],
  coverEmoji: '',
  coverColor: '',
  status: 'planning',
  guests: [],
  expenses: [],
  tasks: [],
  vendors: [
    vendor({ category: 'venue', status: 'booked' }),
    vendor({ category: 'catering', status: 'paid' }),
  ],
  timeline: [],
  notes: '',
  ...over,
});

// Local-time noon avoids DST/midnight edge cases.
const NOW = new Date(2026, 10, 1, 12, 0, 0); // 1 Nov 2026

describe('percent helpers', () => {
  it('percentOf rounds and guards against zero totals', () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(5, 0)).toBe(0);
  });
  it('clampPercent keeps values in 0–100', () => {
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(42)).toBe(42);
  });
});

describe('countdown', () => {
  it('counts whole calendar days in local time', () => {
    expect(getDaysUntil('2026-11-21', NOW)).toBe(20);
    expect(getDaysUntil('2026-11-01', NOW)).toBe(0);
    expect(getDaysUntil('2026-10-30', NOW)).toBe(-2);
  });
  it('returns null for missing or invalid dates', () => {
    expect(getDaysUntil('', NOW)).toBeNull();
    expect(getDaysUntil(undefined, NOW)).toBeNull();
    expect(getDaysUntil('not-a-date', NOW)).toBeNull();
  });
  it('formats labels, letting a celebrated status win', () => {
    expect(formatCountdown(5)).toBe('5 days to go');
    expect(formatCountdown(1)).toBe('1 day to go');
    expect(formatCountdown(0)).toBe('Today is celebration day!');
    expect(formatCountdown(-1)).toBe('Date passed 1 day ago');
    expect(formatCountdown(-3, 'planning')).toBe('Date passed 3 days ago');
    expect(formatCountdown(-3, 'celebrated')).toBe('Celebrated!');
    expect(formatCountdown(10, 'celebrated')).toBe('Celebrated!');
  });
  it('computes time until next local midnight', () => {
    expect(msUntilNextMidnight(new Date(2026, 10, 1, 23, 59, 0))).toBe(60_000);
  });
});

describe('getGuestStats', () => {
  it('counts RSVP buckets and headcount including plus-ones', () => {
    const stats = getGuestStats([
      guest({ rsvp: 'attending', plusOnes: 2 }),
      guest({ rsvp: 'attending' }),
      guest({ rsvp: 'pending', plusOnes: 5 }),
      guest({ rsvp: 'declined' }),
    ]);
    expect(stats).toEqual({ invited: 4, attending: 2, pending: 1, declined: 1, headcount: 4 });
  });
  it('ignores invalid plus-one values', () => {
    expect(getGuestStats([guest({ rsvp: 'attending', plusOnes: NaN })]).headcount).toBe(1);
  });
});

describe('getDietaryNotes', () => {
  it('skips blank and "none" entries', () => {
    const notes = getDietaryNotes([
      guest({ name: 'A', dietary: 'Vegan ' }),
      guest({ name: 'B', dietary: 'None' }),
      guest({ name: 'C', dietary: '  ' }),
    ]);
    expect(notes).toEqual([{ name: 'A', dietary: 'Vegan' }]);
  });
});

describe('budget', () => {
  const expenses = [
    expense({ category: 'venue', budgeted: 500, actual: 550, status: 'paid_in_full' }),
    expense({ category: 'catering', budgeted: 300, actual: 0, status: 'planned' }),
    expense({ category: 'decor', budgeted: 100, actual: 80, status: 'planned' }),
    expense({ category: 'photo', budgeted: 200, actual: 200, status: 'deposit_paid' }),
  ];

  it('committed uses actual once known, else the estimate', () => {
    expect(getCommittedAmount({ actual: 0, budgeted: 300 })).toBe(300);
    expect(getCommittedAmount({ actual: 120, budgeted: 300 })).toBe(120);
  });

  it('paid only counts deposit/paid statuses', () => {
    expect(getPaidAmount({ actual: 80, status: 'planned' })).toBe(0);
    expect(getPaidAmount({ actual: 80, status: 'deposit_paid' })).toBe(80);
  });

  it('aggregates budgeted, actual, committed, paid and outstanding', () => {
    const stats = getBudgetStats(expenses, 2000);
    expect(stats.totalBudgeted).toBe(1100);
    expect(stats.totalActual).toBe(830);
    expect(stats.totalCommitted).toBe(1130);
    expect(stats.totalPaid).toBe(750);
    expect(stats.outstanding).toBe(380);
    expect(stats.remaining).toBe(870);
    expect(stats.overBy).toBe(0);
    expect(stats.position).toBe('under');
    expect(stats.percentCommitted).toBe(57);
    expect(stats.health).toBe('healthy');
  });

  it('reports how far over budget instead of clamping to zero', () => {
    const stats = getBudgetStats(expenses, 1000);
    expect(stats.position).toBe('over');
    expect(stats.isOverBudget).toBe(true);
    expect(stats.remaining).toBe(0);
    expect(stats.overBy).toBe(130);
    expect(stats.health).toBe('over');
  });

  it('treats exactly $0 left as on budget, not over', () => {
    const stats = getBudgetStats([expense({ budgeted: 1000 })], 1000);
    expect(stats.position).toBe('on');
    expect(stats.isOverBudget).toBe(false);
    expect(stats.overBy).toBe(0);
  });

  it('handles a zero budget and bad numbers', () => {
    const stats = getBudgetStats([expense({ budgeted: -50, actual: NaN })], 0);
    expect(stats.totalCommitted).toBe(0);
    expect(stats.percentCommitted).toBe(0);
  });

  it('classifies health thresholds', () => {
    expect(getBudgetHealth(50)).toBe('healthy');
    expect(getBudgetHealth(90)).toBe('warning');
    expect(getBudgetHealth(101)).toBe('over');
  });

  it('builds per-category totals and over-allocation warnings', () => {
    const totals = getCategoryTotals(expenses);
    expect(totals.venue).toEqual({ budgeted: 500, actual: 550, committed: 550, count: 1, overBy: 50 });
    expect(totals.favors.count).toBe(0);
    expect(getOverAllocatedCategories(totals)).toEqual([{ category: 'venue', overBy: 50 }]);
  });

  it('buckets unknown categories into "other"', () => {
    const totals = getCategoryTotals([expense({ category: 'bogus' as Expense['category'], budgeted: 10 })]);
    expect(totals.other.budgeted).toBe(10);
  });

  it('returns the largest expenses by committed amount', () => {
    expect(getLargestExpenses(expenses, 2).map((e) => e.category)).toEqual(['venue', 'catering']);
  });
});

describe('tasks', () => {
  it('computes completion percentage', () => {
    expect(getTaskStats([task({ completed: true }), task({}), task({})])).toEqual({
      total: 3,
      completed: 1,
      percent: 33,
    });
    expect(getTaskStats([]).percent).toBe(0);
  });

  it('orders upcoming tasks by priority then due date', () => {
    const tasks = [
      task({ id: 'low', priority: 'low', dueDate: '2026-11-02' }),
      task({ id: 'med-late', priority: 'medium', dueDate: '2026-12-01' }),
      task({ id: 'done', priority: 'high', completed: true }),
      task({ id: 'high', priority: 'high', dueDate: '2026-12-10' }),
      task({ id: 'med-early', priority: 'medium', dueDate: '2026-11-05' }),
    ];
    expect(getUpcomingTasks(tasks, 3).map((t) => t.id)).toEqual(['high', 'med-early', 'med-late']);
  });

  it('finds overdue incomplete tasks', () => {
    const tasks = [
      task({ id: 'late', dueDate: '2026-10-20' }),
      task({ id: 'late-done', dueDate: '2026-10-20', completed: true }),
      task({ id: 'today', dueDate: '2026-11-01' }),
      task({ id: 'no-date' }),
    ];
    expect(getOverdueTasks(tasks, NOW).map((t) => t.id)).toEqual(['late']);
  });
});

describe('attention items', () => {
  it('flags unbooked essential vendors', () => {
    expect(getUnbookedEssentialVendors([vendor({ category: 'venue', status: 'contacted' })])).toEqual([
      'venue',
      'catering',
    ]);
    expect(getUnbookedEssentialVendors(baseEvent().vendors)).toEqual([]);
  });

  it('is empty for a healthy event', () => {
    expect(getAttentionItems(baseEvent(), NOW)).toEqual([]);
  });

  it('lists risks with high severity first', () => {
    const items = getAttentionItems(
      baseEvent({
        guests: [guest({ rsvp: 'pending' }), guest({ rsvp: 'pending' })],
        tasks: [task({ dueDate: '2026-10-01' })],
        expenses: [expense({ budgeted: 1200 })],
        vendors: [],
      }),
      NOW
    );
    expect(items.map((i) => i.kind)).toEqual(['overdue_tasks', 'budget', 'vendors', 'pending_rsvps']);
    expect(items[1].message).toBe('Over budget by $200');
    expect(items[2].message).toBe('No venue & caterer booked yet');
    expect(items[3]).toMatchObject({ severity: 'medium', message: '2 RSVPs still pending', tab: 'guests' });
  });

  it('warns when the budget is nearly used', () => {
    const items = getAttentionItems(baseEvent({ expenses: [expense({ budgeted: 900 })] }), NOW);
    expect(items).toEqual([expect.objectContaining({ kind: 'budget', severity: 'medium' })]);
  });

  it('is silent once the event is celebrated', () => {
    expect(getAttentionItems(baseEvent({ status: 'celebrated', vendors: [] }), NOW)).toEqual([]);
  });
});

describe('buildEventShareSummary', () => {
  it('includes name, date, venue and RSVP counts', () => {
    const text = buildEventShareSummary(
      baseEvent({ guests: [guest({ rsvp: 'attending', plusOnes: 1 }), guest({ rsvp: 'pending' })] }),
      NOW
    );
    expect(text).toContain('Garden Party');
    expect(text).toContain('Saturday, November 21, 2026 at 4:00 PM');
    expect(text).toContain('20 days to go');
    expect(text).toContain('The Grove, Napa');
    expect(text).toContain('1 attending (2 incl. plus-ones), 1 pending, 0 declined');
    expect(text).not.toContain('http');
  });
});
