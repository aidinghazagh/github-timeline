import { describe, expect, it } from 'vitest';
import {
  contributionWindows,
  mergeCollections,
  summarizeEvents,
  type GitHubEvent,
} from './contributions';
import { buildContributionsQuery } from './queries';
import { tokenFingerprint } from './cache';
import type { ContributionsCollection } from '@/types/github';

const YEAR_MS = 366 * 24 * 60 * 60 * 1000;

describe('contributionWindows', () => {
  const now = new Date('2026-10-07T15:30:00Z');

  it('covers the whole history back to account creation, newest first', () => {
    const created = new Date('2015-03-10T08:00:00Z');
    const windows = contributionWindows(now, created);
    expect(windows[0].to).toBe(now.toISOString());
    expect(windows[windows.length - 1].from).toBe(created.toISOString());
    expect(windows).toHaveLength(12);
  });

  it('never exceeds one year per window and never overlaps', () => {
    const windows = contributionWindows(now, new Date('2008-04-01T00:00:00Z'));
    for (let i = 0; i < windows.length; i++) {
      const from = Date.parse(windows[i].from);
      const to = Date.parse(windows[i].to);
      expect(to - from).toBeLessThanOrEqual(YEAR_MS);
      expect(to).toBeGreaterThan(from);
      if (i > 0) {
        // Previous (newer) window starts exactly one second after this one ends.
        expect(Date.parse(windows[i - 1].from) - to).toBe(1000);
      }
    }
  });

  it('places boundaries on UTC midnight so no day is split', () => {
    const windows = contributionWindows(now, new Date('2020-01-01T00:00:00Z'));
    for (const w of windows.slice(0, -1)) {
      expect(w.from).toMatch(/T00:00:00\.000Z$/);
    }
  });

  it('returns a single window for a new account', () => {
    const created = new Date('2026-09-01T00:00:00Z');
    expect(contributionWindows(now, created)).toEqual([
      { from: created.toISOString(), to: now.toISOString() },
    ]);
  });

  it('does not loop forever on an invalid creation date', () => {
    const windows = contributionWindows(now, new Date('not a date'));
    expect(windows.length).toBeGreaterThan(0);
    expect(windows.length).toBeLessThan(25);
  });
});

function collection(
  days: [string, number][],
  totals: Partial<ContributionsCollection> = {}
): ContributionsCollection {
  return {
    contributionCalendar: {
      weeks: [{ contributionDays: days.map(([date, contributionCount]) => ({ date, contributionCount, color: '' })) }],
      totalContributions: days.reduce((s, [, n]) => s + n, 0),
    },
    totalCommitContributions: 0,
    totalIssueContributions: 0,
    totalPullRequestContributions: 0,
    totalPullRequestReviewContributions: 0,
    restrictedContributionsCount: 0,
    ...totals,
  };
}

describe('mergeCollections', () => {
  it('sums the per-type totals across windows', () => {
    const merged = mergeCollections([
      collection([], { totalCommitContributions: 10, totalPullRequestContributions: 2, totalIssueContributions: 1 }),
      collection([], { totalCommitContributions: 5, totalPullRequestContributions: 3, totalPullRequestReviewContributions: 4 }),
    ]);
    expect(merged).toMatchObject({
      totalCommitContributions: 15,
      totalPullRequestContributions: 5,
      totalIssueContributions: 1,
      totalPullRequestReviewContributions: 4,
    });
  });

  it('counts a day that appears in two windows only once', () => {
    const merged = mergeCollections([
      collection([['2026-01-01', 3], ['2026-01-02', 5]]),
      collection([['2026-01-02', 5], ['2026-01-03', 1]]),
    ]);
    expect(merged.contributionCalendar.totalContributions).toBe(9);
  });

  it('fills gaps between days so the calendar is continuous', () => {
    const merged = mergeCollections([collection([['2026-01-01', 1], ['2026-01-05', 1]])]);
    const dates = merged.contributionCalendar.weeks.flatMap((w) => w.contributionDays.map((d) => d.date));
    expect(dates).toEqual(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05']);
  });
});

describe('summarizeEvents', () => {
  const at = '2026-10-06T12:00:00Z';
  const event = (type: string, payload: Record<string, unknown> = {}): GitHubEvent => ({
    type,
    created_at: at,
    payload,
  });

  it('uses the full push size rather than the capped commits array', () => {
    const s = summarizeEvents([event('PushEvent', { size: 42, commits: new Array(20).fill({}) })]);
    expect(s.commits).toBe(42);
  });

  it('falls back to the commits array, then to 1', () => {
    const s = summarizeEvents([
      event('PushEvent', { commits: [{}, {}] }),
      event('PushEvent', {}),
    ]);
    expect(s.commits).toBe(3);
  });

  it('only counts opened pull requests and issues', () => {
    const s = summarizeEvents([
      event('PullRequestEvent', { action: 'opened' }),
      event('PullRequestEvent', { action: 'closed' }),
      event('IssuesEvent', { action: 'opened' }),
      event('IssuesEvent', { action: 'reopened' }),
      event('PullRequestReviewEvent', { action: 'created' }),
    ]);
    expect(s).toMatchObject({ pullRequests: 1, issues: 1, reviews: 1 });
    expect(Array.from(s.counts.values()).reduce((a, b) => a + b, 0)).toBe(3);
  });

  it('ignores comments and other non-contribution events', () => {
    const s = summarizeEvents([event('IssueCommentEvent'), event('WatchEvent'), event('CreateEvent', { ref_type: 'branch' })]);
    expect(s.counts.size).toBe(0);
  });
});

describe('buildContributionsQuery', () => {
  it('declares one aliased collection per window', () => {
    const q = buildContributionsQuery(3);
    expect(q).toContain('$from2: DateTime!, $to2: DateTime!');
    expect(q).toContain('w2: contributionsCollection(from: $from2, to: $to2)');
    expect(q).not.toContain('w3:');
  });
});

describe('tokenFingerprint', () => {
  it('distinguishes tokens without exposing them', () => {
    const a = tokenFingerprint('github_pat_aaaaaaaa');
    expect(a).not.toContain('github_pat');
    expect(a).not.toBe(tokenFingerprint('github_pat_bbbbbbbb'));
    expect(tokenFingerprint(undefined)).toBe('public');
  });
});
