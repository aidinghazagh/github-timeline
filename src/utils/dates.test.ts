import { describe, expect, it } from 'vitest';
import {
  addDays,
  computeStreaks,
  fillDateRange,
  groupIntoWeeks,
  milestoneDates,
  toLocalDateStr,
} from './dates';
import { clampDateRange, toDate } from './formatters';
import { isValidUsername } from './validation';
import type { ContributionDay } from '@/types/github';

const day = (date: string, contributionCount: number): ContributionDay => ({
  date,
  contributionCount,
  color: '',
});

describe('date helpers', () => {
  it('formats local dates without shifting to UTC', () => {
    expect(toLocalDateStr(new Date(2026, 9, 1, 0, 30))).toBe('2026-10-01');
    expect(toLocalDateStr(new Date(2026, 9, 1, 23, 59))).toBe('2026-10-01');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('fills a range inclusively, including the end date', () => {
    const days = fillDateRange(new Map([['2026-10-02', 3]]), '2026-10-01', '2026-10-03');
    expect(days.map((d) => [d.date, d.contributionCount])).toEqual([
      ['2026-10-01', 0],
      ['2026-10-02', 3],
      ['2026-10-03', 0],
    ]);
  });

  it('starts each week on Sunday', () => {
    // 2026-10-01 is a Thursday; 2026-10-04 is a Sunday.
    const weeks = groupIntoWeeks(fillDateRange(new Map(), '2026-10-01', '2026-10-10'));
    expect(weeks.map((w) => w.contributionDays.length)).toEqual([3, 7]);
    expect(weeks[1].contributionDays[0].date).toBe('2026-10-04');
  });

  it('parses date-only strings as local dates', () => {
    const d = toDate('2026-10-07');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 7]);
  });
});

describe('computeStreaks', () => {
  it('counts the current streak ending today', () => {
    const days = [day('2026-10-04', 0), day('2026-10-05', 2), day('2026-10-06', 1), day('2026-10-07', 4)];
    expect(computeStreaks(days, '2026-10-07')).toMatchObject({ current: 3, longest: 3, longestStart: '2026-10-05' });
  });

  it('does not break the current streak when today has no contributions yet', () => {
    const days = [day('2026-10-05', 2), day('2026-10-06', 1), day('2026-10-07', 0)];
    expect(computeStreaks(days, '2026-10-07').current).toBe(2);
  });

  it('is zero when yesterday had no contributions', () => {
    const days = [day('2026-10-05', 2), day('2026-10-06', 0), day('2026-10-07', 0)];
    expect(computeStreaks(days, '2026-10-07').current).toBe(0);
  });

  it('treats gaps in the data as breaks', () => {
    const days = [day('2026-10-01', 1), day('2026-10-02', 1), day('2026-10-05', 1)];
    expect(computeStreaks(days, '2026-10-07')).toMatchObject({ longest: 2, longestStart: '2026-10-01' });
  });

  it('ignores days after today', () => {
    const days = [day('2026-10-07', 1), day('2026-10-08', 1)];
    expect(computeStreaks(days, '2026-10-07')).toMatchObject({ current: 1, longest: 1 });
  });
});

describe('milestoneDates', () => {
  it('returns the first date each running total is reached', () => {
    const days = [day('2026-01-01', 60), day('2026-01-02', 50), day('2026-01-03', 500)];
    const result = milestoneDates(days, [500, 100, 5000]);
    expect(result.get(100)).toBe('2026-01-02');
    expect(result.get(500)).toBe('2026-01-03');
    expect(result.has(5000)).toBe(false);
  });
});

describe('clampDateRange', () => {
  it('keeps "all" untouched', () => {
    const days = [{ date: '2000-01-01' }];
    expect(clampDateRange(days, 'all')).toBe(days);
  });

  it('keeps exactly 90 days for the 90d range', () => {
    const today = toLocalDateStr(new Date());
    const days = fillDateRange(new Map(), addDays(today, -120), today);
    const clamped = clampDateRange(days, '90d');
    expect(clamped).toHaveLength(90);
    expect(clamped[clamped.length - 1].date).toBe(today);
  });
});

describe('isValidUsername', () => {
  it.each(['torvalds', 'a', 'some-user', 'A1-b2', 'x'.repeat(39)])('accepts %s', (name) => {
    expect(isValidUsername(name)).toBe(true);
  });

  it.each(['', '-leading', 'has space', '../repos/x', 'a/b', 'x'.repeat(40), 'name?x=1'])(
    'rejects %s',
    (name) => {
      expect(isValidUsername(name)).toBe(false);
    }
  );
});
