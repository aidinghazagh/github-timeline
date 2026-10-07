import { useState, useRef, useEffect, useId } from 'react';
import { Search, Star, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { isValidUsername } from '@/utils/validation';
import type { SearchHistory } from '@/types/github';

interface SearchBarProps {
  onSearch: (username: string) => void;
  recentSearches?: SearchHistory[];
  onToggleFavorite?: (username: string) => void;
  onRemove?: (username: string) => void;
  placeholder?: string;
  size?: 'default' | 'large';
  className?: string;
}

export function SearchBar({
  onSearch,
  recentSearches = [],
  onToggleFavorite,
  onRemove,
  placeholder = 'Enter GitHub username...',
  size = 'default',
  className,
}: SearchBarProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const errorId = useId();

  const showDropdown = focused && recentSearches.length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function close() {
    setFocused(false);
    setActiveIndex(-1);
  }

  function submit(username: string) {
    if (!isValidUsername(username)) {
      setError('That doesn’t look like a GitHub username (letters, numbers and hyphens, up to 39 characters).');
      return;
    }
    setError(null);
    onSearch(username);
    setValue('');
    close();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (showDropdown && activeIndex >= 0) {
      submit(recentSearches[activeIndex].username);
      return;
    }
    const trimmed = value.trim().replace(/^@/, '');
    if (trimmed) submit(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (!recentSearches.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocused(true);
      setActiveIndex((i) => (i + 1) % recentSearches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocused(true);
      setActiveIndex((i) => (i <= 0 ? recentSearches.length - 1 : i - 1));
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit} role="search">
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border bg-card px-4 transition-all',
            focused ? 'border-primary ring-2 ring-primary/20' : 'border-border',
            error && 'border-destructive',
            size === 'large' ? 'py-4' : 'py-2.5'
          )}
        >
          <Search className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden />
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
              setActiveIndex(-1);
            }}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="GitHub username"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              showDropdown && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
            }
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={cn(
              'flex-1 min-w-0 bg-transparent outline-none text-foreground placeholder:text-muted-foreground',
              size === 'large' ? 'text-lg' : 'text-sm'
            )}
          />
          {value && (
            <button
              type="button"
              onClick={() => setValue('')}
              aria-label="Clear"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-xs text-destructive text-left">
          {error}
        </p>
      )}

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden"
          >
            <div className="px-3 py-2 text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Clock className="h-3 w-3" aria-hidden />
              Recent
            </div>
            <ul id={listId} role="listbox" aria-label="Recent searches">
              {recentSearches.map((s, i) => (
                <li
                  key={s.username}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer group transition-colors',
                    i === activeIndex && 'bg-accent'
                  )}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => submit(s.username)}
                >
                  <span className="flex-1 text-sm text-foreground text-left">{s.username}</span>
                  {onToggleFavorite && (
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={s.isFavorite ? `Unfavorite ${s.username}` : `Favorite ${s.username}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(s.username);
                      }}
                      className={cn(
                        'transition-opacity',
                        s.isFavorite
                          ? 'text-yellow-500 opacity-100'
                          : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-yellow-500'
                      )}
                    >
                      <Star className="h-3.5 w-3.5" fill={s.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                  )}
                  {onRemove && (
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={`Remove ${s.username} from recent searches`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(s.username);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
