import { GITHUB_GRAPHQL_URL } from '@/utils/constants';

export async function graphqlQuery<T>(
  query: string,
  variables: Record<string, unknown>,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('INVALID_TOKEN');
    }
    const body = await res.text();
    throw new Error(`GitHub GraphQL error (${res.status}): ${body}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join(', '));
  }

  return json.data as T;
}
