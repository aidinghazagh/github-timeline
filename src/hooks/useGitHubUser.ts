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
  payload: {
    commits?: { sha: string }[];
    action?: string;
  };
}

async function fetchContributionsFromEvents(
  username: string,
  token?: string
): Promise<ContributionDay[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const dateCountMap = new Map<string, number>();
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
        case 'PushEvent':
          dateCountMap.set(
            date,
            (dateCountMap.get(date) || 0) +
              (event.payload.commits?.length || 1)
          );
          break;
        case 'CreateEvent':
        case 'IssuesEvent':
        case 'PullRequestEvent':
        case 'PullRequestReviewEvent':
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

  return Array.from(dateCountMap.entries())
    .map(([date, count]) => ({ date, contributionCount: count, color: '' }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildContributionCalendar(
  contributions: ContributionDay[]
): { weeks: { contributionDays: ContributionDay[] }[]; totalContributions: number } {
  if (contributions.length === 0) {
    return { weeks: [], totalContributions: 0 };
  }

  // Build weeks: GitHub starts weeks on Sunday
  const weeks: { contributionDays: ContributionDay[] }[] = [];
  let currentWeek: ContributionDay[] = [];

  for (const day of contributions) {
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

  const totalContributions = contributions.reduce(
    (s, d) => s + d.contributionCount,
    0
  );

  return { weeks, totalContributions };
}

function convertRestToGraphQLUser(
  rest: RestUser,
  contributions: ContributionDay[]
): UserProfileData {
  const calendar = buildContributionCalendar(contributions);

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
        totalIssueContributions: 0,
        totalPullRequestContributions: 0,
        totalPullRequestReviewContributions: 0,
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
        // Public: use REST API + Events API for contributions
        const [restUser, contributions] = await Promise.all([
          fetch(`https://api.github.com/users/${login}`).then((r) => {
            if (!r.ok) {
              if (r.status === 404) throw new Error('User not found');
              if (r.status === 403)
                throw new Error('Rate limit exceeded. Try again later or add a token.');
              throw new Error(`GitHub API error (${r.status})`);
            }
            return r.json() as Promise<RestUser>;
          }),
          fetchContributionsFromEvents(login, token).catch(() => []),
        ]);

        data = convertRestToGraphQLUser(restUser, contributions);
      }

      setCache(cacheKey, data);
      return data;
    },
    enabled: !!login,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
