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

interface ContributionYear {
  total: number;
  range: { start: string; end: string };
  contributions: ContributionDay[];
}

async function fetchContributionsFromPage(
  username: string
): Promise<ContributionYear[]> {
  const res = await fetch(
    `https://github.com/users/${username}/contributions`
  );
  if (!res.ok) throw new Error('Failed to fetch contributions');
  const html = await res.text();

  const years: ContributionYear[] = [];
  const yearBlocks = html.split('js-year-link');

  for (const block of yearBlocks) {
    const contribMatches = [
      ...block.matchAll(
        /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d+)"[^>]*data-count="(\d+)"/g
      ),
    ];
    if (contribMatches.length === 0) continue;

    const contributions: ContributionDay[] = contribMatches.map((m) => ({
      date: m[1],
      contributionCount: parseInt(m[3], 10),
      color: '',
    }));

    const total = contributions.reduce((s, d) => s + d.contributionCount, 0);
    years.push({
      total,
      range: {
        start: contributions[0].date,
        end: contributions[contributions.length - 1].date,
      },
      contributions,
    });
  }

  return years;
}

function convertRestToGraphQLUser(
  rest: RestUser,
  contributions: ContributionYear[]
): UserProfileData {
  const allContributions = contributions.flatMap((y) => y.contributions);
  const totalContributions = contributions.reduce((s, y) => s + y.total, 0);

  // Build weeks from flat contribution list
  const weeks: { contributionDays: ContributionDay[] }[] = [];
  let currentWeek: ContributionDay[] = [];
  for (const day of allContributions) {
    currentWeek.push(day);
    const dayOfWeek = new Date(day.date + 'T00:00:00').getDay();
    if (dayOfWeek === 6) {
      weeks.push({ contributionDays: currentWeek });
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push({ contributionDays: currentWeek });
  }

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
          weeks,
          totalContributions,
        },
        totalCommitContributions: totalContributions,
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
        // Public: use REST + contributions page scraping
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
          fetchContributionsFromPage(login).catch(() => []),
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
