import { useState, useCallback, useEffect } from 'react';
import { RECENT_SEARCHES_KEY, MAX_RECENT_SEARCHES } from '@/utils/constants';
import type { SearchHistory } from '@/types/github';

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
    } catch {}
  }, [searches]);

  const addSearch = useCallback((username: string) => {
    setSearches((prev) => {
      const filtered = prev.filter((s) => s.username !== username);
      return [
        { username, timestamp: Date.now(), isFavorite: false },
        ...filtered,
      ].slice(0, MAX_RECENT_SEARCHES);
    });
  }, []);

  const toggleFavorite = useCallback((username: string) => {
    setSearches((prev) =>
      prev.map((s) =>
        s.username === username ? { ...s, isFavorite: !s.isFavorite } : s
      )
    );
  }, []);

  const removeSearch = useCallback((username: string) => {
    setSearches((prev) => prev.filter((s) => s.username !== username));
  }, []);

  return { searches, addSearch, toggleFavorite, removeSearch };
}
