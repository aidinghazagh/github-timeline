import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';
import { RepoCard } from './RepoCard';
import type { GitHubRepo, SortOption } from '@/types/github';

interface RepoExplorerProps {
  repos: GitHubRepo[];
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'stars', label: 'Stars' },
  { value: 'forks', label: 'Forks' },
  { value: 'updated', label: 'Updated' },
  { value: 'created', label: 'Created' },
  { value: 'name', label: 'Name' },
];

export function RepoExplorer({ repos }: RepoExplorerProps) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('stars');
  const [langFilter, setLangFilter] = useState<string | null>(null);

  const languages = useMemo(() => {
    const langs = new Set<string>();
    repos.forEach((r) => {
      if (r.primaryLanguage) langs.add(r.primaryLanguage.name);
    });
    return Array.from(langs).sort();
  }, [repos]);

  const filtered = useMemo(() => {
    let result = repos;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
      );
    }

    if (langFilter) {
      result = result.filter((r) => r.primaryLanguage?.name === langFilter);
    }

    return [...result].sort((a, b) => {
      switch (sort) {
        case 'stars':
          return b.stargazerCount - a.stargazerCount;
        case 'forks':
          return b.forkCount - a.forkCount;
        case 'updated':
          return b.updatedAt.localeCompare(a.updatedAt);
        case 'created':
          return b.updatedAt.localeCompare(a.updatedAt); // using updatedAt as proxy
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [repos, search, sort, langFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Repository Explorer</h3>
          <p className="text-sm text-muted-foreground">{repos.length} public repositories</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search repos..."
              className="w-full sm:w-48 rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
            {sortOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSort(value)}
                className={cn(
                  'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                  sort === value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Language filters */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          onClick={() => setLangFilter(null)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            !langFilter
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          All
        </button>
        {languages.slice(0, 10).map((lang) => (
          <button
            key={lang}
            onClick={() => setLangFilter(lang === langFilter ? null : lang)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              langFilter === lang
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {lang}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((repo) => (
          <RepoCard key={repo.name} repo={repo} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <SlidersHorizontal className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No repositories match your filters</p>
        </div>
      )}
    </motion.div>
  );
}
