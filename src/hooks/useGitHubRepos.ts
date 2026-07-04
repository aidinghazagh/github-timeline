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

export function useGitHubRepos(login: string, token?: string) {
  return useQuery({
    queryKey: ['repos', login],
    queryFn: async () => {
      const cacheKey = `repos:${login}`;
      const cached = getCached<GitHubRepo[]>(cacheKey);
      if (cached) return cached;

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

      setCache(cacheKey, allRepos);
      return allRepos;
    },
    enabled: !!login,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
