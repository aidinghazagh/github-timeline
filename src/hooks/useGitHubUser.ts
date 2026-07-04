import { useQuery } from '@tanstack/react-query';
import { graphqlQuery } from '@/api/graphql';
import { getCached, setCache } from '@/api/cache';
import { USER_CONTRIBUTIONS_QUERY } from '@/api/queries';
import { TOKEN_KEY } from '@/utils/constants';
import type { UserProfileData, ContributionDay, ContributionWeek } from '@/types/github';

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

interface GitHubEvent {
  type: string;
  created_at: string;
  payload: Record<string, unknown>;
}

interface EventsResult {
  contributions: ContributionDay[];
  pullRequests: number;
  issues: number;
  reviews: number;
}

function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

async function fetchContributionsFromEvents(
  username: string,
  token?: string
): Promise<EventsResult> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const dateCountMap = new Map<string, number>();
  let pullRequests = 0;
  let issues = 0;
  let reviews = 0;
  const maxPages = 10;

  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(
      `https://api.github.com/users/${username}/events/public?per_page=100&page=${page}`,
      { headers }
    );

    if (!res.ok) break;

    const events: GitHubEvent[] = await res.json();
    if (events.length === 0) break;

    for (const event of events) {
      const date = event.created_at.substring(0, 10);

      switch (event.type) {
        case 'PushEvent': {
          const commits = Array.isArray(event.payload.commits)
            ? event.payload.commits.length
            : 1;
          dateCountMap.set(date, (dateCountMap.get(date) || 0) + commits);
          break;
        }
        case 'PullRequestEvent':
          pullRequests++;
          dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
          break;
        case 'IssuesEvent':
          issues++;
          dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
          break;
        case 'PullRequestReviewEvent':
          reviews++;
          dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
          break;
        case 'CreateEvent':
        case 'IssueCommentEvent':
        case 'ReleaseEvent':
        case 'PublicEvent':
        case 'GollumEvent':
          dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
          break;
      }
    }

    if (events.length < 100) break;
  }

  const contributions = Array.from(dateCountMap.entries())
    .map(([date, count]) => ({ date, contributionCount: count, color: '' }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { contributions, pullRequests, issues, reviews };
}

function buildFullCalendar(
  contributions: ContributionDay[],
  startDate: string,
  endDate: string
): { weeks: ContributionWeek[]; totalContributions: number } {
  const countMap = new Map<string, number>();
  for (const d of contributions) {
    countMap.set(d.date, d.contributionCount);
  }

  const allDays: ContributionDay[] = [];
  const current = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  while (current <= end) {
    const dateStr = current.toISOString().substring(0, 10);
    allDays.push({
      date: dateStr,
      contributionCount: countMap.get(dateStr) || 0,
      color: '',
    });
    current.setDate(current.getDate() + 1);
  }

  const weeks: ContributionWeek[] = [];
  let currentWeek: ContributionDay[] = [];

  for (const day of allDays) {
    const dayOfWeek = new Date(day.date + 'T00:00:00').getDay();
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push({ contributionDays: currentWeek });
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) {
    weeks.push({ contributionDays: currentWeek });
  }

  const totalContributions = allDays.reduce((s, d) => s + d.contributionCount, 0);
  return { weeks, totalContributions };
}

function mergeCalendars(
  calendars: { weeks: ContributionWeek[]; totalContributions: number }[]
): { weeks: ContributionWeek[]; totalContributions: number } {
  const allContributions: ContributionDay[] = [];
  let total = 0;

  for (const cal of calendars) {
    for (const week of cal.weeks) {
      allContributions.push(...week.contributionDays);
    }
    total += cal.totalContributions;
  }

  // Deduplicate by date (keep highest count)
  const deduped = new Map<string, ContributionDay>();
  for (const d of allContributions) {
    const existing = deduped.get(d.date);
    if (!existing || d.contributionCount > existing.contributionCount) {
      deduped.set(d.date, d);
    }
  }

  const sorted = Array.from(deduped.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Rebuild weeks
  const weeks: ContributionWeek[] = [];
  let currentWeek: ContributionDay[] = [];
  for (const day of sorted) {
    const dayOfWeek = new Date(day.date + 'T00:00:00').getDay();
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push({ contributionDays: currentWeek });
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) {
    weeks.push({ contributionDays: currentWeek });
  }

  return { weeks, totalContributions: total };
}

async function fetchMultiYearContributions(
  login: string,
  token: string,
  accountCreated: string
): Promise<{ weeks: ContributionWeek[]; totalContributions: number }> {
  const now = new Date();
  const createdDate = new Date(accountCreated);
  const maxYears = Math.min(
    Math.ceil((now.getTime() - createdDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
    5
  );

  const calendars: { weeks: ContributionWeek[]; totalContributions: number }[] = [];

  for (let i = 0; i < maxYears; i++) {
    const to = i === 0
      ? now
      : new Date(now.getFullYear() - i, now.getMonth(), now.getDate());
    const from = new Date(
      to.getFullYear() - 1,
      to.getMonth(),
      to.getDate()
    );

    // Don't go before account creation
    const effectiveFrom = from < createdDate ? createdDate : from;

    const data = await graphqlQuery<UserProfileData>(
      USER_CONTRIBUTIONS_QUERY,
      {
        login,
        from: effectiveFrom.toISOString(),
        to: to.toISOString(),
      },
      token
    );

    if (data.user) {
      calendars.push(data.user.contributionsCollection.contributionCalendar);
    }

    // If we've reached account creation, stop
    if (effectiveFrom <= createdDate) break;
  }

  return calendars.length > 0
    ? mergeCalendars(calendars)
    : { weeks: [], totalContributions: 0 };
}

function convertRestToGraphQLUser(
  rest: RestUser,
  calendar: { weeks: ContributionWeek[]; totalContributions: number },
  events: EventsResult
): UserProfileData {
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
        totalCommitContributions: calendar.totalContributions,
        totalIssueContributions: events.issues,
        totalPullRequestContributions: events.pullRequests,
        totalPullRequestReviewContributions: events.reviews,
        restrictedContributionsCount: 0,
      },
    },
  };
}

export function useGitHubUser(login: string, token?: string) {
  return useQuery({
    queryKey: ['user', login, token ? 'auth' : 'public'],
    queryFn: async () => {
      const cacheKey = `user:v3:${login}:${token ? 'auth' : 'public'}`;
      const cached = getCached<UserProfileData>(cacheKey);
      if (cached) return cached;

      let data: UserProfileData;

      if (token) {
        try {
          // First get user profile for createdAt
          const restUser = await fetch(
            `https://api.github.com/users/${login}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ).then((r) => {
            if (!r.ok) throw new Error('User not found');
            return r.json() as Promise<RestUser>;
          });

          // Fetch contributions for multiple years
          const calendar = await fetchMultiYearContributions(
            login,
            token,
            restUser.created_at
          );

          // Also fetch recent events for PR/issue/review counts
          const events = await fetchContributionsFromEvents(login, token);

          data = convertRestToGraphQLUser(restUser, calendar, events);
        } catch (err) {
          if (err instanceof Error && err.message === 'INVALID_TOKEN') {
            clearToken();
            throw new Error(
              'Invalid or expired token. The token has been cleared — please add a new one.'
            );
          }
          throw err;
        }
      } else {
        // Public: use REST API + Events API
        const [restUser, events] = await Promise.all([
          fetch(`https://api.github.com/users/${login}`).then((r) => {
            if (!r.ok) {
              if (r.status === 404) throw new Error('User not found');
              if (r.status === 403)
                throw new Error('Rate limit exceeded. Try again later or add a token.');
              throw new Error(`GitHub API error (${r.status})`);
            }
            return r.json() as Promise<RestUser>;
          }),
          fetchContributionsFromEvents(login, token),
        ]);

        const today = new Date().toISOString().substring(0, 10);
        const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .substring(0, 10);

        const calendar = buildFullCalendar(
          events.contributions,
          threeMonthsAgo,
          today
        );

        data = convertRestToGraphQLUser(restUser, calendar, events);
      }

      setCache(cacheKey, data);
      return data;
    },
    enabled: !!login,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
