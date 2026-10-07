import type { ContributionDay, ContributionWeek } from '@/types/github';

/** YYYY-MM-DD for a Date in the viewer's local time zone (not UTC). */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string as a local-time midnight Date. */
export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, days: number): string {
  const d = parseDateStr(s);
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
}

export function todayStr(): string {
  return toLocalDateStr(new Date());
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(s: string): number {
  return parseDateStr(s).getDay();
}

/** Every date from start to end inclusive, with counts from `counts` (0 when missing). */
export function fillDateRange(
  counts: Map<string, number>,
  start: string,
  end: string
): ContributionDay[] {
  const days: ContributionDay[] = [];
  for (let cur = start; cur <= end; cur = addDays(cur, 1)) {
    days.push({ date: cur, contributionCount: counts.get(cur) ?? 0, color: '' });
  }
  return days;
}

/** Group a sorted, gap-free list of days into Sunday-started weeks. */
export function groupIntoWeeks(days: ContributionDay[]): ContributionWeek[] {
  const weeks: ContributionWeek[] = [];
  let current: ContributionDay[] = [];
  for (const day of days) {
    if (weekdayOf(day.date) === 0 && current.length > 0) {
      weeks.push({ contributionDays: current });
      current = [];
    }
    current.push(day);
  }
  if (current.length > 0) weeks.push({ contributionDays: current });
  return weeks;
}

export function flattenWeeks(weeks: ContributionWeek[]): ContributionDay[] {
  return weeks
    .flatMap((w) => w.contributionDays)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface StreakInfo {
  current: number;
  longest: number;
  longestStart: string | null;
}

/**
 * Streaks over a sorted list of days. Days are treated as consecutive by date,
 * so a gap in the data breaks a streak. Today having zero contributions does
 * not break the current streak (the day isn't over yet).
 */
export function computeStreaks(days: ContributionDay[], today = todayStr()): StreakInfo {
  let longest = 0;
  let longestStart: string | null = null;
  let run = 0;
  let runStart = '';
  let prevDate: string | null = null;

  for (const day of days) {
    if (day.date > today) break;
    const contiguous = prevDate !== null && addDays(prevDate, 1) === day.date;
    if (day.contributionCount > 0) {
      if (run === 0 || !contiguous) {
        run = 0;
        runStart = day.date;
      }
      run++;
      if (run > longest) {
        longest = run;
        longestStart = runStart;
      }
    } else {
      run = 0;
    }
    prevDate = day.date;
  }

  const byDate = new Map(days.map((d) => [d.date, d.contributionCount]));
  let current = 0;
  let cursor = today;
  if (!byDate.get(cursor)) cursor = addDays(cursor, -1);
  while ((byDate.get(cursor) ?? 0) > 0) {
    current++;
    cursor = addDays(cursor, -1);
  }

  return { current, longest, longestStart };
}

/** First date on which the running total of contributions reaches each threshold. */
export function milestoneDates(
  days: ContributionDay[],
  thresholds: number[]
): Map<number, string> {
  const result = new Map<number, string>();
  const pending = [...thresholds].sort((a, b) => a - b);
  let total = 0;
  for (const day of days) {
    total += day.contributionCount;
    while (pending.length > 0 && total >= pending[0]) {
      result.set(pending.shift()!, day.date);
    }
    if (pending.length === 0) break;
  }
  return result;
}
