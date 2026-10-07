import { GITHUB_GRAPHQL_URL } from '@/utils/constants';
import { GitHubApiError, errorFromResponse } from './errors';

interface GraphQLError {
  message: string;
  type?: string;
}

export async function graphqlQuery<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string
): Promise<T> {
  const res = await fetch(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw errorFromResponse(res, true);

  const json: { data?: T; errors?: GraphQLError[] } = await res.json();
  if (json.errors?.length) {
    const types = json.errors.map((e) => e.type);
    if (types.includes('NOT_FOUND')) {
      throw new GitHubApiError('not_found', 'User not found');
    }
    if (types.includes('RATE_LIMITED')) {
      throw new GitHubApiError('rate_limited', 'GitHub API rate limit exceeded. Try again later.');
    }
    throw new GitHubApiError('other', json.errors.map((e) => e.message).join(', '));
  }

  return json.data as T;
}
