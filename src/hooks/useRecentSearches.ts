import { useState, useCallback, useEffect } from 'react';
import { RECENT_SEARCHES_KEY, MAX_RECENT_SEARCHES } from '@/utils/constants';
import type { SearchHistory } from '@/types/github';

const sameUser = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Favorites first (never evicted), then the most recent non-favorites up to the limit. */
export function normalizeSearches(list: SearchHistory[]): SearchHistory[] {
  const favorites = list.filter((s) => s.isFavorite);
  const others = list
    .filter((s) => !s.isFavorite)
    .slice(0, Math.max(MAX_RECENT_SEARCHES - favorites.length, 0));
  return [...favorites, ...others];
}

export function useRecentSearches() {
  const [searches, setSearches] = useState<SearchHistory[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch {
      // storage unavailable
    }
  }, [searches]);

  const addSearch = useCallback((username: string) => {
    setSearches((prev) => {
      const existing = prev.find((s) => sameUser(s.username, username));
      const rest = prev.filter((s) => !sameUser(s.username, username));
      return normalizeSearches([
        { username, timestamp: Date.now(), isFavorite: existing?.isFavorite ?? false },
        ...rest,
      ]);
    });
  }, []);

  const toggleFavorite = useCallback((username: string) => {
    setSearches((prev) =>
      normalizeSearches(
        prev.map((s) =>
          sameUser(s.username, username) ? { ...s, isFavorite: !s.isFavorite } : s
        )
      )
    );
  }, []);

  const removeSearch = useCallback((username: string) => {
    setSearches((prev) => prev.filter((s) => !sameUser(s.username, username)));
  }, []);

  return { searches, addSearch, toggleFavorite, removeSearch };
}
