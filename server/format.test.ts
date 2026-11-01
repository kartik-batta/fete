// @vitest-environment node
import './test/nodeEnv';
import { describe, expect, it } from 'vitest';
import {
  formatClockTime,
  formatDisplayTime,
  formatEventDate,
  humanizeOccasion,
  parseClockTime,
  resolveTimeWindow,
} from './format';

describe('humanizeOccasion', () => {
  it.each([
    ['birthday', 'Birthday'],
    ['baby_shower', 'Baby Shower'],
    ['office-party', 'Office Party'],
    ['retirement bash', 'Retirement Bash'],
  ])('%s -> %s', (input, expected) => {
    expect(humanizeOccasion(input)).toBe(expected);
  });
});

describe('formatEventDate', () => {
  it('formats ISO dates as calendar dates regardless of server timezone', () => {
    const original = process.env.TZ;
    try {
      for (const tz of ['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
        process.env.TZ = tz;
        expect(formatEventDate('2026-11-21')).toBe('Saturday, November 21, 2026');
      }
    } finally {
      process.env.TZ = original;
    }
  });

  it.each([['next Saturday'], ['2026-02-30'], ['2026-13-01']])('leaves %s unchanged', (value) => {
    expect(formatEventDate(value)).toBe(value);
  });
});

describe('parseClockTime', () => {
  it.each([
    ['2:00 PM', 840],
    ['02:30pm', 870],
    ['12:00 AM', 0],
    ['12:15 PM', 735],
    ['9 a.m.', 540],
    ['14:45', 885],
    ['00:00', 0],
  ])('%s -> %i', (value, minutes) => {
    expect(parseClockTime(value)).toBe(minutes);
  });

  it.each([['25:00'], ['13:00 PM'], ['10:75'], ['noon'], ['']])('rejects %s', (value) => {
    expect(parseClockTime(value)).toBeUndefined();
  });
});

describe('formatClockTime / formatDisplayTime', () => {
  it('pads hours by default and wraps past midnight', () => {
    expect(formatClockTime(840)).toBe('02:00 PM');
    expect(formatClockTime(0)).toBe('12:00 AM');
    expect(formatClockTime(24 * 60 + 30)).toBe('12:30 AM');
    expect(formatClockTime(-30)).toBe('11:30 PM');
  });

  it('formats display times without padding and keeps unknown text', () => {
    expect(formatDisplayTime('18:00')).toBe('6:00 PM');
    expect(formatDisplayTime('after lunch')).toBe('after lunch');
  });
});

describe('resolveTimeWindow', () => {
  const defaults = { start: 840, end: 1200 };

  it('uses defaults for missing or invalid bounds', () => {
    expect(resolveTimeWindow(undefined, 'soon', defaults)).toEqual(defaults);
  });

  it('treats an end before the start as crossing midnight', () => {
    expect(resolveTimeWindow('9:00 PM', '1:00 AM', defaults)).toEqual({ start: 1260, end: 1500 });
  });
});
