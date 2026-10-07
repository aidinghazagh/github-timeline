import { useState, useEffect, useCallback } from 'react';
import { THEME_KEY } from '@/utils/constants';

export type Theme = 'dark' | 'light' | 'system';

function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'dark';
  } catch {
    return 'dark';
  }
}

/** Apply the saved theme before React renders, to avoid a flash. */
export function initTheme() {
  applyTheme(readTheme());
}

/** Use from a single always-mounted component (ThemeToggle in the Header). */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readTheme);

  useEffect(() => {
    applyTheme(theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      // storage unavailable
    }
  }, []);

  return { theme, setTheme };
}
