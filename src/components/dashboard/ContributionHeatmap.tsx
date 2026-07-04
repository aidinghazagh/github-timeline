import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { getHeatmapLevel } from '@/utils/formatters';
import type { ContributionCalendar } from '@/types/github';

interface ContributionHeatmapProps {
  calendar: ContributionCalendar;
}

export function ContributionHeatmap({ calendar }: ContributionHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    count: number;
  } | null>(null);

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    calendar.weeks.forEach((w) =>
      w.contributionDays.forEach((d) => years.add(d.date.substring(0, 4)))
    );
    return Array.from(years).sort().reverse();
  }, [calendar]);

  const [selectedYear, setSelectedYear] = useState(yearOptions[0] || '');

  const filteredWeeks = useMemo(() => {
    if (!selectedYear) return calendar.weeks;
    return calendar.weeks.filter((w) =>
      w.contributionDays.some((d) => d.date.startsWith(selectedYear))
    );
  }, [calendar.weeks, selectedYear]);

  const totalForYear = useMemo(() => {
    return filteredWeeks
      .flatMap((w) => w.contributionDays)
      .filter((d) => d.date.startsWith(selectedYear))
      .reduce((sum, d) => sum + d.contributionCount, 0);
  }, [filteredWeeks, selectedYear]);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Contribution Heatmap</h3>
          <p className="text-sm text-muted-foreground">
            {totalForYear.toLocaleString()} contributions in {selectedYear}
          </p>
        </div>
        <div className="flex gap-1">
          {yearOptions.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                selectedYear === year
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <div className="flex gap-0.5">
          <div className="flex flex-col gap-0.5 mr-1 pt-0">
            {dayLabels.map((label, i) => (
              <div key={i} className="h-[13px] flex items-center">
                <span className="text-[10px] text-muted-foreground w-8">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-0.5">
            {filteredWeeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-0.5">
                {week.contributionDays.map((day, dayIdx) => {
                  const level = getHeatmapLevel(day.contributionCount);
                  return (
                    <div
                      key={day.date}
                      className={cn(
                        'w-[13px] h-[13px] rounded-[2px] cursor-pointer transition-transform hover:scale-125',
                        `heatmap-${level}`
                      )}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          x: rect.left + rect.width / 2,
                          y: rect.top - 8,
                          date: day.date,
                          count: day.contributionCount,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 mt-3">
          <span className="text-[10px] text-muted-foreground">Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn('w-[13px] h-[13px] rounded-[2px]', `heatmap-${level}`)}
            />
          ))}
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          <div className="rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-lg">
            <p className="font-medium">
              {tooltip.count} contribution{tooltip.count !== 1 ? 's' : ''}
            </p>
            <p className="opacity-70">
              {new Date(tooltip.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
