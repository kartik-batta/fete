import { describe, expect, it } from 'vitest';
import { findCurrentIndex, isOverdue, parseTimeToMinutes, sortByDueDate, sortByTime } from './scheduleTime';

describe('parseTimeToMinutes', () => {
  it.each([
    ['4:30 PM', 16 * 60 + 30],
    ['04:30pm', 16 * 60 + 30],
    ['4 pm', 16 * 60],
    ['12:00 AM', 0],
    ['12:15 PM', 12 * 60 + 15],
    ['16:30', 16 * 60 + 30],
    ['9.15', 9 * 60 + 15],
    ['7:05 a.m.', 7 * 60 + 5],
  ])('parses %s', (text, minutes) => {
    expect(parseTimeToMinutes(text)).toBe(minutes);
  });

  it.each(['', 'soon', '25:00', '13 PM', '4:75'])('rejects %s', (text) => {
    expect(parseTimeToMinutes(text)).toBeNull();
  });
});

describe('sortByTime', () => {
  it('orders mixed 12h/24h times and puts unparseable ones last, stably', () => {
    const items = [{ time: '7:45 PM' }, { time: 'TBD' }, { time: '17:00' }, { time: '6:30 PM' }, { time: '?' }];
    expect(sortByTime(items).map((i) => i.time)).toEqual(['17:00', '6:30 PM', '7:45 PM', 'TBD', '?']);
  });
});

describe('findCurrentIndex', () => {
  const items = [{ time: '5:00 PM' }, { time: '6:30 PM' }, { time: '7:45 PM' }];
  it('returns the last started milestone', () => {
    expect(findCurrentIndex(items, 18 * 60 + 40)).toEqual({ index: 1, isUpcoming: false });
  });
  it('returns the first milestone as upcoming before the schedule starts', () => {
    expect(findCurrentIndex(items, 9 * 60)).toEqual({ index: 0, isUpcoming: true });
  });
  it('returns null with no parseable times', () => {
    expect(findCurrentIndex([{ time: 'later' }], 600)).toBeNull();
  });
});

describe('task date helpers', () => {
  it('flags only incomplete tasks due before today', () => {
    expect(isOverdue({ dueDate: '2026-10-01', completed: false }, '2026-11-01')).toBe(true);
    expect(isOverdue({ dueDate: '2026-10-01', completed: true }, '2026-11-01')).toBe(false);
    expect(isOverdue({ dueDate: '2026-11-01', completed: false }, '2026-11-01')).toBe(false);
    expect(isOverdue({ dueDate: '', completed: false }, '2026-11-01')).toBe(false);
  });

  it('sorts by due date with undated tasks last', () => {
    const tasks = [{ dueDate: '' }, { dueDate: '2026-12-01' }, { dueDate: '2026-11-05' }];
    expect(sortByDueDate(tasks).map((t) => t.dueDate)).toEqual(['2026-11-05', '2026-12-01', '']);
  });
});
