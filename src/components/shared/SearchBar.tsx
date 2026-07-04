import { useState, useRef, useEffect } from 'react';
import { Search, Star, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onSearch(trimmed);
      setValue('');
      setFocused(false);
    }
  }

  function handleSelect(username: string) {
    onSearch(username);
    setValue('');
    setFocused(false);
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border bg-card px-4 transition-all',
            focused ? 'border-primary ring-2 ring-primary/20' : 'border-border',
            size === 'large' ? 'py-4' : 'py-2.5'
          )}
        >
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={placeholder}
            className={cn(
              'flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground',
              size === 'large' ? 'text-lg' : 'text-sm'
            )}
          />
          {value && (
            <button
              type="button"
              onClick={() => setValue('')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden"
          >
            <div className="px-3 py-2 text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Recent
            </div>
            {recentSearches.map((s) => (
              <div
                key={s.username}
                className="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer group transition-colors"
                onClick={() => handleSelect(s.username)}
              >
                <span className="flex-1 text-sm text-foreground">{s.username}</span>
                {onToggleFavorite && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(s.username);
                    }}
                    className={cn(
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      s.isFavorite ? 'text-yellow-500 opacity-100' : 'text-muted-foreground hover:text-yellow-500'
                    )}
                  >
                    <Star className="h-3.5 w-3.5" fill={s.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(s.username);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
