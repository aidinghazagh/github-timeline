import type {
  ContributionCalendar,
  ContributionDay,
  ContributionsCollection,
} from '@/types/github';
import { fillDateRange, groupIntoWeeks, toLocalDateStr } from '@/utils/dates';

export interface DateWindow {
  from: string; // ISO timestamp
  to: string; // ISO timestamp
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Non-overlapping windows of at most one year (GitHub's limit for
 * contributionsCollection), newest first, back to account creation.
 * Boundaries fall on UTC midnight so no calendar day is split between windows.
 */
export function contributionWindows(now: Date, created: Date): DateWindow[] {
  // GitHub launched in 2008; also guards against an unparseable date.
  const floor = new Date(Date.UTC(2007, 0, 1));
  const accountCreated = Number.isNaN(created.getTime()) || created < floor ? floor : created;

  // B(k) = UTC midnight of (tomorrow − k years)
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + DAY_MS
  );
  const boundary = (k: number) =>
    new Date(
      Date.UTC(
        tomorrow.getUTCFullYear() - k,
        tomorrow.getUTCMonth(),
        tomorrow.getUTCDate()
      )
    );

  const windows: DateWindow[] = [];
  for (let k = 0; ; k++) {
    const upper = boundary(k);
    if (upper <= accountCreated) break;
    const to = k === 0 ? now : new Date(upper.getTime() - 1000);
    const lower = boundary(k + 1);
    const from = lower < accountCreated ? accountCreated : lower;
    windows.push({ from: from.toISOString(), to: to.toISOString() });
    if (from.getTime() === accountCreated.getTime()) break;
  }
  return windows;
}

/** Combine per-window collections into one, summing totals and de-duplicating days. */
export function mergeCollections(collections: ContributionsCollection[]): ContributionsCollection {
  const byDate = new Map<string, ContributionDay>();
  const totals = {
    totalCommitContributions: 0,
    totalIssueContributions: 0,
    totalPullRequestContributions: 0,
    totalPullRequestReviewContributions: 0,
    restrictedContributionsCount: 0,
  };

  for (const c of collections) {
    for (const key of Object.keys(totals) as (keyof typeof totals)[]) {
      totals[key] += c[key];
    }
    for (const week of c.contributionCalendar.weeks) {
      for (const day of week.contributionDays) {
        const existing = byDate.get(day.date);
        if (!existing || day.contributionCount > existing.contributionCount) {
          byDate.set(day.date, day);
        }
      }
    }
  }

  const sorted = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  const calendar: ContributionCalendar = sorted.length
    ? calendarFromDays(
        new Map(sorted.map((d) => [d.date, d.contributionCount])),
        sorted[0].date,
        sorted[sorted.length - 1].date
      )
    : { weeks: [], totalContributions: 0 };

  return { contributionCalendar: calendar, ...totals };
}

/** A gap-free calendar for [start, end], grouped into Sunday-started weeks. */
export function calendarFromDays(
  counts: Map<string, number>,
  start: string,
  end: string
): ContributionCalendar {
  const days = fillDateRange(counts, start, end);
  return {
    weeks: groupIntoWeeks(days),
    totalContributions: days.reduce((s, d) => s + d.contributionCount, 0),
  };
}

export interface GitHubEvent {
  type: string;
  created_at: string;
  payload: Record<string, unknown>;
}

export interface EventsSummary {
  counts: Map<string, number>;
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
}

function pushCommitCount(payload: Record<string, unknown>): number {
  // `size` is the full number of commits; the `commits` array is capped at 20
  // and may be omitted entirely.
  if (typeof payload.size === 'number') return payload.size;
  if (Array.isArray(payload.commits)) return payload.commits.length;
  return 1;
}

/**
 * Approximate GitHub-style contribution counts from public events.
 * Only "opened" PRs/issues count, matching how GitHub credits contributions.
 */
export function summarizeEvents(events: GitHubEvent[]): EventsSummary {
  const counts = new Map<string, number>();
  let commits = 0;
  let pullRequests = 0;
  let issues = 0;
  let reviews = 0;

  const bump = (date: string, n: number) => counts.set(date, (counts.get(date) ?? 0) + n);

  for (const event of events) {
    const date = toLocalDateStr(new Date(event.created_at));
    const action = event.payload.action;

    switch (event.type) {
      case 'PushEvent': {
        const n = pushCommitCount(event.payload);
        commits += n;
        bump(date, n);
        break;
      }
      case 'PullRequestEvent':
        if (action === 'opened') {
          pullRequests++;
          bump(date, 1);
        }
        break;
      case 'IssuesEvent':
        if (action === 'opened') {
          issues++;
          bump(date, 1);
        }
        break;
      case 'PullRequestReviewEvent':
        reviews++;
        bump(date, 1);
        break;
      case 'CreateEvent':
        if (event.payload.ref_type === 'repository') bump(date, 1);
        break;
    }
  }

  return { counts, commits, pullRequests, issues, reviews };
}
