import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { getHeatmapLevel } from '@/utils/formatters';
import { flattenWeeks, groupIntoWeeks, parseDateStr, weekdayOf } from '@/utils/dates';
import type { ContributionCalendar } from '@/types/github';

interface ContributionHeatmapProps {
  calendar: ContributionCalendar;
}

interface Tooltip {
  x: number;
  y: number;
  date: string;
  count: number;
}

const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export function ContributionHeatmap({ calendar }: ContributionHeatmapProps) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const allDays = useMemo(() => flattenWeeks(calendar.weeks), [calendar.weeks]);

  const yearOptions = useMemo(() => {
    const years = new Set(allDays.map((d) => d.date.substring(0, 4)));
    return Array.from(years).sort().reverse();
  }, [allDays]);

  const [selectedYear, setSelectedYear] = useState(yearOptions[0] ?? '');

  const { weeks, total } = useMemo(() => {
    const days = allDays.filter((d) => d.date.startsWith(selectedYear));
    return {
      weeks: groupIntoWeeks(days),
      total: days.reduce((sum, d) => sum + d.contributionCount, 0),
    };
  }, [allDays, selectedYear]);

  // The tooltip is fixed-position, so drop it when the page scrolls.
  useEffect(() => {
    if (!tooltip) return;
    const hide = () => setTooltip(null);
    window.addEventListener('scroll', hide, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', hide, { capture: true });
  }, [tooltip]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Contribution Heatmap</h3>
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} contributions in {selectedYear}
          </p>
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Year">
          {yearOptions.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              aria-pressed={selectedYear === year}
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
        <div className="flex gap-0.5" role="img" aria-label={`Contribution heatmap for ${selectedYear}: ${total} contributions`}>
          <div className="flex flex-col gap-0.5 mr-1" aria-hidden>
            {dayLabels.map((label, i) => (
              <div key={i} className="h-[13px] flex items-center">
                <span className="text-[10px] text-muted-foreground w-8">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-0.5">
            {weeks.map((week, weekIdx) => {
              // Pad so each day lands on its weekday row (the first week may start mid-week).
              const lead = weekIdx === 0 ? weekdayOf(week.contributionDays[0].date) : 0;
              return (
                <div key={week.contributionDays[0].date} className="flex flex-col gap-0.5">
                  {Array.from({ length: lead }).map((_, i) => (
                    <div key={`pad-${i}`} className="w-[13px] h-[13px]" />
                  ))}
                  {week.contributionDays.map((day) => (
                    <div
                      key={day.date}
                      className={cn(
                        'w-[13px] h-[13px] rounded-[2px] cursor-pointer transition-transform hover:scale-125',
                        `heatmap-${getHeatmapLevel(day.contributionCount)}`
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
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 mt-3" aria-hidden>
          <span className="text-[10px] text-muted-foreground">Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div key={level} className={cn('w-[13px] h-[13px] rounded-[2px]', `heatmap-${level}`)} />
          ))}
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
          aria-hidden
        >
          <div className="rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-lg">
            <p className="font-medium">
              {tooltip.count} contribution{tooltip.count !== 1 ? 's' : ''}
            </p>
            <p className="opacity-70">
              {parseDateStr(tooltip.date).toLocaleDateString('en-US', {
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
