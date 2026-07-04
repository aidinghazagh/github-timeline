import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/utils/cn';
import { clampDateRange } from '@/utils/formatters';
import type { ContributionCalendar, TimeRange } from '@/types/github';

interface ContributionTimelineProps {
  calendar: ContributionCalendar;
}

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: '1m', label: '1M' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' },
];

export function ContributionTimeline({ calendar }: ContributionTimelineProps) {
  const [range, setRange] = useState<TimeRange>('1y');

  const chartData = useMemo(() => {
    const allDays = calendar.weeks
      .flatMap((w) => w.contributionDays)
      .map((d) => ({ date: d.date, count: d.contributionCount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const filtered = clampDateRange(allDays, range);

    // Aggregate by week for smoother chart
    const weeks: { date: string; count: number }[] = [];
    for (let i = 0; i < filtered.length; i += 7) {
      const chunk = filtered.slice(i, i + 7);
      weeks.push({
        date: chunk[0].date,
        count: chunk.reduce((s, d) => s + d.count, 0),
      });
    }
    return weeks;
  }, [calendar, range]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Contribution Timeline</h3>
          <p className="text-sm text-muted-foreground">Weekly contributions over time</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-muted p-0.5">
          {timeRanges.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                range === value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(263, 70%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(263, 70%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) =>
                new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(var(--foreground))',
              }}
              labelFormatter={(v) =>
                new Date(v).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              }
              formatter={(value) => [`${value} contributions`, '']}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(263, 70%, 50%)"
              strokeWidth={2}
              fill="url(#contribGrad)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
