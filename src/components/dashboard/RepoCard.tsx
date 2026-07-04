import { Star, GitFork, Clock } from 'lucide-react';
import { timeAgo } from '@/utils/formatters';
import type { GitHubRepo } from '@/types/github';

interface RepoCardProps {
  repo: GitHubRepo;
}

export function RepoCard({ repo }: RepoCardProps) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
          {repo.name}
        </h4>
        {repo.primaryLanguage && (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: repo.primaryLanguage.color }}
            />
            {repo.primaryLanguage.name}
          </span>
        )}
      </div>

      {repo.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{repo.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5" />
          {repo.stargazerCount.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="h-3.5 w-3.5" />
          {repo.forkCount.toLocaleString()}
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="h-3.5 w-3.5" />
          {timeAgo(repo.updatedAt)}
        </span>
      </div>
    </a>
  );
}
