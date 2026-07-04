import { useQuery } from '@tanstack/react-query';
import { graphqlQuery } from '@/api/graphql';
import { getCached, setCache } from '@/api/cache';
import { USER_CONTRIBUTIONS_QUERY } from '@/api/queries';
import type { UserProfileData } from '@/types/github';

export function useGitHubUser(login: string, token?: string) {
  return useQuery({
    queryKey: ['user', login],
    queryFn: async () => {
      const cacheKey = `user:${login}`;
      const cached = getCached<UserProfileData>(cacheKey);
      if (cached) return cached;

      const now = new Date();
      const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());

      const data = await graphqlQuery<UserProfileData>(
        USER_CONTRIBUTIONS_QUERY,
        { login, from: fiveYearsAgo.toISOString(), to: now.toISOString() },
        token
      );

      if (!data.user) throw new Error('User not found');
      setCache(cacheKey, data);
      return data;
    },
    enabled: !!login,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
