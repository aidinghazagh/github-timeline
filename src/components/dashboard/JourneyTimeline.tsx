import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Rocket,
  GitFork,
  Star,
  Flame,
  Calendar,
  GitCommit,
} from 'lucide-react';
import { formatDate, toDate } from '@/utils/formatters';
import { computeStreaks, flattenWeeks, milestoneDates } from '@/utils/dates';
import type { UserProfileData, GitHubRepo } from '@/types/github';

interface JourneyTimelineProps {
  user: UserProfileData['user'];
  repos: GitHubRepo[];
  coverage: UserProfileData['coverage'];
}

interface Milestone {
  icon: React.ReactNode;
  title: string;
  description: string;
  date: string;
  color: string;
}

const CONTRIBUTION_THRESHOLDS = [100, 500, 1000, 5000, 10000];

export function JourneyTimeline({ user, repos, coverage }: JourneyTimelineProps) {
  const milestones = useMemo(() => {
    const items: Milestone[] = [];

    items.push({
      icon: <Rocket className="h-4 w-4" />,
      title: 'Joined GitHub',
      description: `Started the journey as @${user.login}`,
      date: user.createdAt,
      color: 'bg-indigo-500',
    });

    const byCreated = repos
      .filter((r) => r.createdAt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (byCreated.length > 0) {
      items.push({
        icon: <GitFork className="h-4 w-4" />,
        title: 'First Repository',
        description: `Created "${byCreated[0].name}"`,
        date: byCreated[0].createdAt,
        color: 'bg-blue-500',
      });
    }

    const mostStarred = [...repos].sort((a, b) => b.stargazerCount - a.stargazerCount)[0];
    if (mostStarred && mostStarred.stargazerCount > 0) {
      items.push({
        icon: <Star className="h-4 w-4" />,
        title: 'Most Popular Repository',
        description: `Created "${mostStarred.name}", now at ${mostStarred.stargazerCount.toLocaleString()} stars`,
        date: mostStarred.createdAt || mostStarred.updatedAt,
        color: 'bg-yellow-500',
      });
    }

    const allDays = flattenWeeks(user.contributionsCollection.contributionCalendar.weeks);

    // Running totals are only meaningful when we have the full history.
    if (coverage.mode === 'full') {
      const reached = milestoneDates(allDays, CONTRIBUTION_THRESHOLDS);
      for (const [count, date] of reached) {
        items.push({
          icon: <GitCommit className="h-4 w-4" />,
          title: `${count.toLocaleString()} Contributions`,
          description: `Reached ${count.toLocaleString()} total contributions`,
          date,
          color: 'bg-green-500',
        });
      }
    }

    const { longest, longestStart } = computeStreaks(allDays);
    if (longest >= 7 && longestStart) {
      items.push({
        icon: <Flame className="h-4 w-4" />,
        title: `${longest}-Day Streak`,
        description:
          coverage.mode === 'full'
            ? 'Longest contribution streak'
            : 'Longest contribution streak in the last 90 days',
        date: longestStart,
        color: 'bg-orange-500',
      });
    }

    const latestRepo = [...repos].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (latestRepo) {
      items.push({
        icon: <Calendar className="h-4 w-4" />,
        title: 'Latest Activity',
        description: `Updated "${latestRepo.name}"`,
        date: latestRepo.updatedAt,
        color: 'bg-purple-500',
      });
    }

    return items.sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime());
  }, [user, repos, coverage.mode]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-1">Developer Journey</h3>
      <p className="text-sm text-muted-foreground mb-6">Key milestones in the GitHub story</p>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-6">
          {milestones.map((milestone, i) => (
            <motion.div
              key={`${milestone.title}-${i}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative flex gap-4"
            >
              <div
                aria-hidden
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${milestone.color} text-white`}
              >
                {milestone.icon}
              </div>
              <div className="flex-1 pb-2">
                <h4 className="font-medium text-foreground">{milestone.title}</h4>
                <p className="text-sm text-muted-foreground">{milestone.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(milestone.date)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
