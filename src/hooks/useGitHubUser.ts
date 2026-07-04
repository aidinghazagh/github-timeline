import { useQuery } from '@tanstack/react-query';
import { graphqlQuery } from '@/api/graphql';
import { getCached, setCache } from '@/api/cache';
import { USER_CONTRIBUTIONS_QUERY } from '@/api/queries';
import type { UserProfileData, ContributionDay } from '@/types/github';

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
): { weeks: { contributionDays: ContributionDay[] }[]; totalContributions: number } {
  // Fill in missing dates with 0 contributions so streaks work correctly
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

  // Build weeks starting on Sunday
  const weeks: { contributionDays: ContributionDay[] }[] = [];
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

function convertRestToGraphQLUser(
  rest: RestUser,
  events: EventsResult
): UserProfileData {
  // Build calendar from ~90 days of events data
  const today = new Date().toISOString().substring(0, 10);
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .substring(0, 10);

  const calendar = buildFullCalendar(
    events.contributions,
    threeMonthsAgo,
    today
  );

  // Calculate active years from account creation
  const createdYear = new Date(rest.created_at).getFullYear();
  const currentYear = new Date().getFullYear();
  const activeYears = currentYear - createdYear + 1;

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
        contributionCalendar: {
          weeks: calendar.weeks,
          totalContributions: calendar.totalContributions,
        },
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
      const cacheKey = `user:${login}:${token ? 'auth' : 'public'}`;
      const cached = getCached<UserProfileData>(cacheKey);
      if (cached) return cached;

      let data: UserProfileData;

      if (token) {
        // Authenticated: use GraphQL for full data
        const now = new Date();
        const fiveYearsAgo = new Date(
          now.getFullYear() - 5,
          now.getMonth(),
          now.getDate()
        );
        data = await graphqlQuery<UserProfileData>(
          USER_CONTRIBUTIONS_QUERY,
          {
            login,
            from: fiveYearsAgo.toISOString(),
            to: now.toISOString(),
          },
          token
        );
        if (!data.user) throw new Error('User not found');
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
          fetchContributionsFromEvents(login, token).catch(() => ({
            contributions: [],
            pullRequests: 0,
            issues: 0,
            reviews: 0,
          })),
        ]);

        data = convertRestToGraphQLUser(restUser, events);
      }

      setCache(cacheKey, data);
      return data;
    },
    enabled: !!login,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
