import { useQuery } from '@tanstack/react-query';
import { graphqlQuery } from '@/api/graphql';
import { getCached, setCache } from '@/api/cache';
import { USER_REPOS_QUERY } from '@/api/queries';
import type { GitHubRepo } from '@/types/github';

interface ReposResponse {
  user: {
    repositories: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: GitHubRepo[];
    };
  };
}

interface RestRepo {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  created_at: string;
  html_url: string;
  fork: boolean;
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
};

function convertRestRepo(r: RestRepo): GitHubRepo {
  return {
    name: r.name,
    description: r.description,
    stargazerCount: r.stargazers_count,
    forkCount: r.forks_count,
    primaryLanguage: r.language
      ? { name: r.language, color: LANGUAGE_COLORS[r.language] || '#999' }
      : null,
    updatedAt: r.updated_at,
    url: r.html_url,
    isPrivate: false,
  };
}

export function useGitHubRepos(login: string, token?: string) {
  return useQuery({
    queryKey: ['repos', login, token ? 'auth' : 'public'],
    queryFn: async () => {
      const cacheKey = `repos:${login}:${token ? 'auth' : 'public'}`;
      const cached = getCached<GitHubRepo[]>(cacheKey);
      if (cached) return cached;

      let repos: GitHubRepo[];

      if (token) {
        // Authenticated: use GraphQL
        const allRepos: GitHubRepo[] = [];
        let cursor: string | null = null;
        let hasNext = true;

        while (hasNext) {
          const resp: ReposResponse = await graphqlQuery<ReposResponse>(
            USER_REPOS_QUERY,
            { login, first: 100, after: cursor },
            token
          );
          allRepos.push(...resp.user.repositories.nodes);
          hasNext = resp.user.repositories.pageInfo.hasNextPage;
          cursor = resp.user.repositories.pageInfo.endCursor;
        }
        repos = allRepos;
      } else {
        // Public: use REST API (paginated)
        const allRepos: RestRepo[] = [];
        let page = 1;
        while (true) {
          const res = await fetch(
            `https://api.github.com/users/${login}/repos?per_page=100&page=${page}&sort=stars&direction=desc`
          );
          if (!res.ok) {
            if (res.status === 403)
              throw new Error('Rate limit exceeded. Try again later or add a token.');
            throw new Error(`GitHub API error (${res.status})`);
          }
          const data: RestRepo[] = await res.json();
          allRepos.push(...data);
          if (data.length < 100) break;
          page++;
        }
        repos = allRepos.filter((r) => !r.fork).map(convertRestRepo);
      }

      setCache(cacheKey, repos);
      return repos;
    },
    enabled: !!login,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
