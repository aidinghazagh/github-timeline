import { GITHUB_API_BASE } from '@/utils/constants';
import { errorFromResponse } from './errors';

/**
 * GET a REST endpoint. Callers must encode any user-supplied path segments
 * (see `userPath`).
 */
export async function restGet<T>(endpoint: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${GITHUB_API_BASE}${endpoint}`, { headers });
  if (!res.ok) throw errorFromResponse(res, !!token);
  return res.json() as Promise<T>;
}

export function userPath(login: string, suffix = ''): string {
  return `/users/${encodeURIComponent(login)}${suffix}`;
}
