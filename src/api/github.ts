import { GITHUB_API_BASE } from '@/utils/constants';

export async function restGet<T>(
  endpoint: string,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${GITHUB_API_BASE}${endpoint}`, { headers });

  if (!res.ok) {
    if (res.status === 404) throw new Error('User not found');
    if (res.status === 403) throw new Error('Rate limit exceeded. Add a Personal Access Token for higher limits.');
    throw new Error(`GitHub API error (${res.status})`);
  }

  return res.json() as Promise<T>;
}
