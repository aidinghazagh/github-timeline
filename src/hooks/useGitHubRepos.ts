import { useQuery } from '@tanstack/react-query';
import { graphqlQuery } from '@/api/graphql';
import { restGet, userPath } from '@/api/github';
import { getCached, setCache, tokenFingerprint } from '@/api/cache';
import { USER_REPOS_QUERY } from '@/api/queries';
import { withTokenCheck } from '@/api/errors';
import { CACHE_TTL_MS } from '@/utils/constants';
import { languageColor } from '@/utils/languageColors';
import type { GitHubRepo } from '@/types/github';

interface ReposResponse {
  user: {
    repositories: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: GitHubRepo[];
    };
  } | null;
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

function convertRestRepo(r: RestRepo): GitHubRepo {
  return {
    name: r.name,
    description: r.description,
    stargazerCount: r.stargazers_count,
    forkCount: r.forks_count,
    primaryLanguage: r.language
      ? { name: r.language, color: languageColor(r.language) }
      : null,
    updatedAt: r.updated_at,
    createdAt: r.created_at,
    url: r.html_url,
    isPrivate: false,
  };
}

async function fetchReposGraphQL(login: string, token: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let cursor: string | null = null;
  let hasNext = true;
  while (hasNext) {
    const resp: ReposResponse = await graphqlQuery<ReposResponse>(
      USER_REPOS_QUERY,
      { login, first: 100, after: cursor },
      token
    );
    if (!resp.user) break;
    repos.push(...resp.user.repositories.nodes);
    hasNext = resp.user.repositories.pageInfo.hasNextPage;
    cursor = resp.user.repositories.pageInfo.endCursor;
  }
  return repos;
}

async function fetchReposRest(login: string): Promise<GitHubRepo[]> {
  const repos: RestRepo[] = [];
  for (let page = 1; ; page++) {
    const data = await restGet<RestRepo[]>(
      userPath(login, `/repos?per_page=100&page=${page}&type=owner`)
    );
    repos.push(...data);
    if (data.length < 100) break;
  }
  // Forks are excluded in both modes so counts match.
  return repos
    .filter((r) => !r.fork)
    .map(convertRestRepo)
    .sort((a, b) => b.stargazerCount - a.stargazerCount);
}

export function useGitHubRepos(login: string, token?: string, onInvalidToken?: () => void) {
  const fingerprint = tokenFingerprint(token);
  const cacheKey = `repos:v3:${login.toLowerCase()}:${fingerprint}`;

  return useQuery({
    queryKey: ['repos', login.toLowerCase(), fingerprint],
    queryFn: async () => {
      const repos = await withTokenCheck(
        () => (token ? fetchReposGraphQL(login, token) : fetchReposRest(login)),
        onInvalidToken
      );
      setCache(cacheKey, repos);
      return repos;
    },
    initialData: () => getCached<GitHubRepo[]>(cacheKey)?.data,
    initialDataUpdatedAt: () => getCached<GitHubRepo[]>(cacheKey)?.timestamp,
    staleTime: CACHE_TTL_MS,
    enabled: !!login,
    retry: false,
  });
}
