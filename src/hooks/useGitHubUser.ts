import { useQuery } from '@tanstack/react-query';
import { graphqlQuery } from '@/api/graphql';
import { restGet, userPath } from '@/api/github';
import { GitHubApiError, withTokenCheck } from '@/api/errors';
import { getCached, setCache, tokenFingerprint } from '@/api/cache';
import { buildContributionsQuery, USER_PROFILE_QUERY } from '@/api/queries';
import {
  calendarFromDays,
  contributionWindows,
  mergeCollections,
  summarizeEvents,
  type DateWindow,
  type GitHubEvent,
} from '@/api/contributions';
import { CACHE_TTL_MS } from '@/utils/constants';
import { addDays, todayStr } from '@/utils/dates';
import type { ContributionsCollection, UserProfileData } from '@/types/github';

interface RestUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  company: string | null;
  blog: string | null;
  location: string | null;
  created_at: string;
  html_url: string;
}

type Profile = Omit<UserProfileData['user'], 'contributionsCollection'>;

// The public events API only returns the last 90 days, capped at 300 events.
const EVENTS_MAX_PAGES = 3;
const RECENT_DAYS = 90;
// Contribution windows fetched per GraphQL request (batches run in parallel).
const WINDOWS_PER_REQUEST = 4;

async function fetchFullHistory(login: string, token: string): Promise<UserProfileData> {
  const { user: profile } = await graphqlQuery<{ user: Profile | null }>(
    USER_PROFILE_QUERY,
    { login },
    token
  );
  if (!profile) throw new GitHubApiError('not_found', 'User not found');

  const windows = contributionWindows(new Date(), new Date(profile.createdAt));
  const batches: DateWindow[][] = [];
  for (let i = 0; i < windows.length; i += WINDOWS_PER_REQUEST) {
    batches.push(windows.slice(i, i + WINDOWS_PER_REQUEST));
  }

  const results = await Promise.all(
    batches.map((batch) => {
      const variables: Record<string, unknown> = { login };
      batch.forEach((w, i) => {
        variables[`from${i}`] = w.from;
        variables[`to${i}`] = w.to;
      });
      return graphqlQuery<{ user: Record<string, ContributionsCollection> }>(
        buildContributionsQuery(batch.length),
        variables,
        token
      );
    })
  );

  const collections = results.flatMap((r) => Object.values(r.user));
  const merged = mergeCollections(collections);

  return {
    user: { ...profile, contributionsCollection: merged },
    coverage: {
      mode: 'full',
      from: windows[windows.length - 1].from.substring(0, 10),
      to: todayStr(),
    },
  };
}

async function fetchEvents(login: string): Promise<GitHubEvent[]> {
  const events: GitHubEvent[] = [];
  for (let page = 1; page <= EVENTS_MAX_PAGES; page++) {
    const batch = await restGet<GitHubEvent[]>(
      userPath(login, `/events/public?per_page=100&page=${page}`)
    );
    events.push(...batch);
    if (batch.length < 100) break;
  }
  return events;
}

async function fetchRecentActivity(login: string): Promise<UserProfileData> {
  const [rest, events] = await Promise.all([
    restGet<RestUser>(userPath(login)),
    fetchEvents(login),
  ]);

  const summary = summarizeEvents(events);
  const to = todayStr();
  const from = addDays(to, -(RECENT_DAYS - 1));
  const calendar = calendarFromDays(summary.counts, from, to);

  return {
    user: {
      name: rest.name,
      login: rest.login,
      avatarUrl: rest.avatar_url,
      bio: rest.bio,
      followers: { totalCount: rest.followers },
      following: { totalCount: rest.following },
      repositories: { totalCount: rest.public_repos },
      company: rest.company,
      websiteUrl: rest.blog || null,
      location: rest.location,
      createdAt: rest.created_at,
      url: rest.html_url,
      contributionsCollection: {
        contributionCalendar: calendar,
        totalCommitContributions: summary.commits,
        totalIssueContributions: summary.issues,
        totalPullRequestContributions: summary.pullRequests,
        totalPullRequestReviewContributions: summary.reviews,
        restrictedContributionsCount: 0,
      },
    },
    coverage: { mode: 'recent', from, to },
  };
}

/**
 * `onInvalidToken` is called if GitHub rejects the token, so the caller can drop it.
 */
export function useGitHubUser(login: string, token?: string, onInvalidToken?: () => void) {
  const fingerprint = tokenFingerprint(token);
  const cacheKey = `user:v4:${login.toLowerCase()}:${fingerprint}`;

  return useQuery({
    queryKey: ['user', login.toLowerCase(), fingerprint],
    queryFn: async () => {
      const data = await withTokenCheck(
        () => (token ? fetchFullHistory(login, token) : fetchRecentActivity(login)),
        onInvalidToken
      );
      setCache(cacheKey, data);
      return data;
    },
    // Persisted data seeds the query; refetch() always goes to the network.
    initialData: () => getCached<UserProfileData>(cacheKey)?.data,
    initialDataUpdatedAt: () => getCached<UserProfileData>(cacheKey)?.timestamp,
    staleTime: CACHE_TTL_MS,
    enabled: !!login,
    retry: false,
  });
}
