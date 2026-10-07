import { useState, useCallback } from 'react';
import { TOKEN_KEY } from '@/utils/constants';

function read(storage: () => Storage): string | undefined {
  try {
    return storage().getItem(TOKEN_KEY) || undefined;
  } catch {
    return undefined;
  }
}

function write(storage: () => Storage, value: string | null) {
  try {
    if (value === null) storage().removeItem(TOKEN_KEY);
    else storage().setItem(TOKEN_KEY, value);
  } catch {
    // storage unavailable
  }
}

const session = () => sessionStorage;
const local = () => localStorage;

/**
 * The GitHub token. Kept in sessionStorage (cleared when the tab closes) unless
 * the user opts to remember it on this device, in which case localStorage.
 */
export function useToken() {
  const [token, setTokenState] = useState<string | undefined>(
    () => read(session) ?? read(local)
  );

  const saveToken = useCallback((value: string, remember: boolean) => {
    write(session, remember ? null : value);
    write(local, remember ? value : null);
    setTokenState(value);
  }, []);

  const clearToken = useCallback(() => {
    write(session, null);
    write(local, null);
    setTokenState(undefined);
  }, []);

  return { token, saveToken, clearToken };
}
