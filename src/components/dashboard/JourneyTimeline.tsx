import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Rocket,
  GitFork,
  Star,
  Flame,
  Calendar,
  Trophy,
  GitCommit,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import type { UserProfileData, GitHubRepo } from '@/types/github';

interface JourneyTimelineProps {
  user: UserProfileData['user'];
  repos: GitHubRepo[];
}

interface Milestone {
  icon: React.ReactNode;
  title: string;
  description: string;
  date: string;
  color: string;
}

export function JourneyTimeline({ user, repos }: JourneyTimelineProps) {
  const milestones = useMemo(() => {
    const items: Milestone[] = [];

    // Account created
    items.push({
      icon: <Rocket className="h-4 w-4" />,
      title: 'Joined GitHub',
      description: `Started the journey as @${user.login}`,
      date: user.createdAt,
      color: 'bg-indigo-500',
    });

    // First repo
    const sortedRepos = [...repos].sort(
      (a, b) => a.updatedAt.localeCompare(b.updatedAt)
    );
    if (sortedRepos.length > 0) {
      items.push({
        icon: <GitFork className="h-4 w-4" />,
        title: 'First Repository',
        description: `Created "${sortedRepos[0].name}"`,
        date: sortedRepos[0].updatedAt,
        color: 'bg-blue-500',
      });
    }

    // Most starred repo
    const mostStarred = [...repos].sort(
      (a, b) => b.stargazerCount - a.stargazerCount
    )[0];
    if (mostStarred && mostStarred.stargazerCount > 0) {
      items.push({
        icon: <Star className="h-4 w-4" />,
        title: 'Most Popular Repository',
        description: `"${mostStarred.name}" earned ${mostStarred.stargazerCount.toLocaleString()} stars`,
        date: mostStarred.updatedAt,
        color: 'bg-yellow-500',
      });
    }

    // Contribution milestones
    const totalContribs = user.contributionsCollection.contributionCalendar.totalContributions;
    const thresholds = [
      { count: 100, label: '100 Contributions' },
      { count: 500, label: '500 Contributions' },
      { count: 1000, label: '1,000 Contributions' },
      { count: 5000, label: '5,000 Contributions' },
      { count: 10000, label: '10,000 Contributions' },
    ];
    for (const t of thresholds) {
      if (totalContribs >= t.count) {
        items.push({
          icon: <GitCommit className="h-4 w-4" />,
          title: t.label,
          description: `Reached ${t.count.toLocaleString()} total contributions`,
          date: user.createdAt, // approximate
          color: 'bg-green-500',
        });
      }
    }

    // Longest streak
    const allDays = user.contributionsCollection.contributionCalendar.weeks
      .flatMap((w) => w.contributionDays)
      .sort((a, b) => a.date.localeCompare(b.date));

    let longestStreak = 0;
    let tempStreak = 0;
    let streakStart = '';
    let bestStreakStart = '';
    for (const day of allDays) {
      if (day.contributionCount > 0) {
        if (tempStreak === 0) streakStart = day.date;
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
          bestStreakStart = streakStart;
        }
      } else {
        tempStreak = 0;
      }
    }
    if (longestStreak >= 7) {
      items.push({
        icon: <Flame className="h-4 w-4" />,
        title: `${longestStreak}-Day Streak`,
        description: 'Longest coding streak achieved',
        date: bestStreakStart,
        color: 'bg-orange-500',
      });
    }

    // Latest repo
    const latestRepo = [...repos].sort(
      (a, b) => b.updatedAt.localeCompare(a.updatedAt)
    )[0];
    if (latestRepo) {
      items.push({
        icon: <Calendar className="h-4 w-4" />,
        title: 'Latest Activity',
        description: `Updated "${latestRepo.name}"`,
        date: latestRepo.updatedAt,
        color: 'bg-purple-500',
      });
    }

    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [user, repos]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-1">Developer Journey</h3>
      <p className="text-sm text-muted-foreground mb-6">Key milestones in your GitHub story</p>

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
