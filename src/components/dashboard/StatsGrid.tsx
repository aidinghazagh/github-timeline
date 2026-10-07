import { useMemo } from 'react';
import {
  BookMarked,
  GitFork,
  Star,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Eye,
  Flame,
  Trophy,
  Calendar,
} from 'lucide-react';
import { StatCard } from './StatCard';
import { computeStreaks, flattenWeeks } from '@/utils/dates';
import type { ContributionsCollection, GitHubRepo, UserProfileData } from '@/types/github';

interface StatsGridProps {
  contributions: ContributionsCollection;
  repos: GitHubRepo[];
  createdAt: string;
  coverage: UserProfileData['coverage'];
}

export function StatsGrid({ contributions, repos, createdAt, coverage }: StatsGridProps) {
  const totalStars = repos.reduce((sum, r) => sum + r.stargazerCount, 0);
  const totalForks = repos.reduce((sum, r) => sum + r.forkCount, 0);

  const streaks = useMemo(
    () => computeStreaks(flattenWeeks(contributions.contributionCalendar.weeks)),
    [contributions.contributionCalendar.weeks]
  );

  const yearsOnGitHub = Math.max(
    new Date().getFullYear() - new Date(createdAt).getFullYear() + 1,
    1
  );

  const recent = coverage.mode === 'recent';
  const periodHint = recent ? 'Last 90 days (estimated)' : 'All time';

  const stats = [
    { label: 'Repositories', value: repos.length, icon: <BookMarked className="h-5 w-5" />, hint: 'Public, excluding forks' },
    { label: 'Total Stars', value: totalStars, icon: <Star className="h-5 w-5" /> },
    { label: 'Total Forks', value: totalForks, icon: <GitFork className="h-5 w-5" /> },
    { label: 'Commits', value: contributions.totalCommitContributions, icon: <GitCommit className="h-5 w-5" />, hint: periodHint },
    { label: 'Pull Requests', value: contributions.totalPullRequestContributions, icon: <GitPullRequest className="h-5 w-5" />, hint: periodHint },
    { label: 'Issues', value: contributions.totalIssueContributions, icon: <AlertCircle className="h-5 w-5" />, hint: periodHint },
    { label: 'Reviews', value: contributions.totalPullRequestReviewContributions, icon: <Eye className="h-5 w-5" />, hint: periodHint },
    { label: 'Current Streak', value: streaks.current, icon: <Flame className="h-5 w-5" />, hint: 'Days' },
    { label: 'Longest Streak', value: streaks.longest, icon: <Trophy className="h-5 w-5" />, hint: recent ? 'Days, last 90 days' : 'Days' },
    { label: 'Years on GitHub', value: yearsOnGitHub, icon: <Calendar className="h-5 w-5" /> },
  ];

  if (contributions.restrictedContributionsCount > 0) {
    stats.push({
      label: 'Private Contributions',
      value: contributions.restrictedContributionsCount,
      icon: <Eye className="h-5 w-5" />,
      hint: 'Not broken down by type',
    });
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          hint={stat.hint}
          delay={i * 0.05}
        />
      ))}
    </div>
  );
}
