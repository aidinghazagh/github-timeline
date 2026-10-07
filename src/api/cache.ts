import { CACHE_PREFIX, CACHE_TTL_MS } from '@/utils/constants';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function getCached<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

/** Remove every expired (or unreadable) cache entry. */
export function pruneCache(): void {
  try {
    const now = Date.now();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k?.startsWith(CACHE_PREFIX)) continue;
      try {
        const entry: CacheEntry<unknown> = JSON.parse(localStorage.getItem(k) ?? '');
        if (now - entry.timestamp > CACHE_TTL_MS) localStorage.removeItem(k);
      } catch {
        localStorage.removeItem(k);
      }
    }
  } catch {
    // localStorage unavailable
  }
}

export function setCache<T>(key: string, data: T): void {
  const value = JSON.stringify({ data, timestamp: Date.now() } satisfies CacheEntry<T>);
  try {
    localStorage.setItem(CACHE_PREFIX + key, value);
  } catch {
    // Probably over quota: drop stale entries and try once more.
    pruneCache();
    try {
      localStorage.setItem(CACHE_PREFIX + key, value);
    } catch {
      // Still full or unavailable — skip caching.
    }
  }
}

/**
 * Short, non-reversible identifier for a token so cached data is never shared
 * between different tokens (or between token and public mode).
 */
export function tokenFingerprint(token?: string): string {
  if (!token) return 'public';
  let h = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `t${(h >>> 0).toString(36)}`;
}
