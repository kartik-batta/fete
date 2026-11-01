import { formatClockTime, formatLongDate, parseClockTime, shiftIsoDate, spreadTimes } from './time';

describe('parseClockTime', () => {
  it.each([
    ['4:00 PM', 16 * 60],
    ['04:15pm', 16 * 60 + 15],
    ['12:00 AM', 0],
    ['12:30 PM', 12 * 60 + 30],
    ['9 PM', 21 * 60],
    ['16:30', 16 * 60 + 30],
    ['  7:05 a.m. ', 7 * 60 + 5],
  ])('parses %s', (input, expected) => {
    expect(parseClockTime(input)).toBe(expected);
  });

  it.each(['', 'noon', '13:00 PM', '9', '10:75', '25:00'])('rejects %j', (input) => {
    expect(parseClockTime(input)).toBeNull();
  });
});

describe('formatClockTime', () => {
  it('formats zero-padded 12-hour times', () => {
    expect(formatClockTime(0)).toBe('12:00 AM');
    expect(formatClockTime(16 * 60 + 5)).toBe('04:05 PM');
    expect(formatClockTime(12 * 60)).toBe('12:00 PM');
  });

  it('wraps past midnight', () => {
    expect(formatClockTime(25 * 60)).toBe('01:00 AM');
    expect(formatClockTime(-60)).toBe('11:00 PM');
  });
});

describe('spreadTimes', () => {
  it('spreads times evenly inside the window', () => {
    expect(spreadTimes(15 * 60, 21 * 60, 2)).toEqual(['05:00 PM', '07:00 PM']);
  });

  it('handles windows that cross midnight', () => {
    expect(spreadTimes(22 * 60, 2 * 60, 1)).toEqual(['12:00 AM']);
  });

  it('rounds to five minutes and returns nothing for zero items', () => {
    expect(spreadTimes(16 * 60, 17 * 60, 2)).toEqual(['04:20 PM', '04:40 PM']);
    expect(spreadTimes(16 * 60, 17 * 60, 0)).toEqual([]);
  });
});

describe('shiftIsoDate', () => {
  it('shifts across month and year boundaries', () => {
    expect(shiftIsoDate('2026-11-21', -30)).toBe('2026-10-22');
    expect(shiftIsoDate('2026-01-10', -30)).toBe('2025-12-11');
  });

  it('returns invalid input unchanged', () => {
    expect(shiftIsoDate('', -30)).toBe('');
    expect(shiftIsoDate('next week', -30)).toBe('next week');
  });
});

describe('formatLongDate', () => {
  it('formats ISO dates in long US form', () => {
    expect(formatLongDate('2026-11-21')).toBe('Saturday, November 21, 2026');
  });

  it('falls back for empty or invalid input', () => {
    expect(formatLongDate('')).toBe('Upcoming Date');
    expect(formatLongDate('garbage', 'TBD')).toBe('TBD');
  });
});
