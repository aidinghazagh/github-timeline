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
  const [range, setRange] = useState<TimeRange>('all');

  const chartData = useMemo(() => {
    const allDays = calendar.weeks
      .flatMap((w) => w.contributionDays)
      .map((d) => ({ date: d.date, count: d.contributionCount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const filtered = clampDateRange(allDays, range);
    const totalInRange = filtered.reduce((s, d) => s + d.count, 0);

    // Aggregate by day for daily granularity, or by week for longer ranges
    const step = range === 'all' ? 7 : range === '1y' ? 3 : 1;
    const points: { date: string; count: number }[] = [];
    for (let i = 0; i < filtered.length; i += step) {
      const chunk = filtered.slice(i, i + step);
      points.push({
        date: chunk[0].date,
        count: chunk.reduce((s, d) => s + d.count, 0),
      });
    }
    return { points, totalInRange };
  }, [calendar, range]);

  const rangeLabel = timeRanges.find((r) => r.value === range)?.label || range;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">Contribution Timeline</h3>
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">
              {chartData.totalInRange.toLocaleString()}
            </span>{' '}
            contributions
            {chartData.points.length > 0 && (
              <span>
                {' '}from{' '}
                {new Date(chartData.points[0].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' '}to{' '}
                {new Date(chartData.points[chartData.points.length - 1].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-muted p-0.5">
          {timeRanges.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
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

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData.points}>
            <defs>
              <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(v) =>
                new Date(v + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'short',
                  day: range === '1m' ? 'numeric' : undefined,
                  year: range === 'all' ? '2-digit' : undefined,
                })
              }
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'hsl(var(--foreground))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              labelFormatter={(v) =>
                new Date(v + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              }
              formatter={(value) => [`${value} contributions`, 'Contributions']}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              fill="url(#contribGrad)"
              animationDuration={1200}
              dot={false}
              activeDot={{
                r: 5,
                fill: '#8b5cf6',
                stroke: 'hsl(var(--card))',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
