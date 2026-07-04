import {
  GitFork,
  Star,
  GitPullRequest,
  AlertCircle,
  Eye,
  Flame,
  Calendar,
} from 'lucide-react';
import { StatCard } from './StatCard';
import type { ContributionsCollection, GitHubRepo } from '@/types/github';

interface StatsGridProps {
  contributions: ContributionsCollection;
  repos: GitHubRepo[];
}

export function StatsGrid({ contributions, repos }: StatsGridProps) {
  const totalStars = repos.reduce((sum, r) => sum + r.stargazerCount, 0);
  const totalForks = repos.reduce((sum, r) => sum + r.forkCount, 0);

  // Calculate streak from contribution calendar
  const allDays = contributions.contributionCalendar.weeks
    .flatMap((w) => w.contributionDays)
    .sort((a, b) => a.date.localeCompare(b.date));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = allDays.length - 1; i >= 0; i--) {
    if (allDays[i].contributionCount > 0) {
      if (i === allDays.length - 1 || currentStreak > 0) {
        currentStreak++;
      }
    } else {
      if (currentStreak > 0) break;
    }
  }

  for (const day of allDays) {
    if (day.contributionCount > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Count active years
  const years = new Set(allDays.map((d) => d.date.substring(0, 4)));
  const activeYears = years.size;

  const stats = [
    { label: 'Repositories', value: repos.length, icon: <GitFork className="h-5 w-5" /> },
    { label: 'Total Stars', value: totalStars, icon: <Star className="h-5 w-5" /> },
    { label: 'Total Forks', value: totalForks, icon: <GitFork className="h-5 w-5" /> },
    { label: 'Pull Requests', value: contributions.totalPullRequestContributions, icon: <GitPullRequest className="h-5 w-5" /> },
    { label: 'Issues', value: contributions.totalIssueContributions, icon: <AlertCircle className="h-5 w-5" /> },
    { label: 'Reviews', value: contributions.totalPullRequestReviewContributions, icon: <Eye className="h-5 w-5" /> },
    { label: 'Current Streak', value: currentStreak, icon: <Flame className="h-5 w-5" /> },
    { label: 'Longest Streak', value: longestStreak, icon: <Flame className="h-5 w-5" /> },
    { label: 'Active Years', value: activeYears, icon: <Calendar className="h-5 w-5" /> },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
      {stats.map((stat, i) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          delay={i * 0.05}
        />
      ))}
    </div>
  );
}
