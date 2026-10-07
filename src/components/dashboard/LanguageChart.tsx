import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { GitHubRepo } from '@/types/github';

interface LanguageChartProps {
  repos: GitHubRepo[];
}

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd',
  '#3b82f6', '#60a5fa', '#22c55e', '#f59e0b',
  '#ef4444', '#ec4899', '#14b8a6', '#f97316',
];

export function LanguageChart({ repos }: LanguageChartProps) {
  const languageData = useMemo(() => {
    const langMap = new Map<string, { count: number; color: string }>();

    for (const repo of repos) {
      if (repo.primaryLanguage) {
        const existing = langMap.get(repo.primaryLanguage.name);
        langMap.set(repo.primaryLanguage.name, {
          count: (existing?.count || 0) + 1,
          color: repo.primaryLanguage.color,
        });
      }
    }

    const sorted = Array.from(langMap.entries())
      .map(([name, { count, color }]) => ({ name, value: count, color }))
      .sort((a, b) => b.value - a.value);
    // Keep percentages honest: everything beyond the top 7 is grouped as "Other".
    if (sorted.length <= 8) return sorted;
    const other = sorted.slice(7).reduce((s, d) => s + d.value, 0);
    return [...sorted.slice(0, 7), { name: 'Other', value: other, color: '#8b949e' }];
  }, [repos]);

  const total = languageData.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-1">Language Analytics</h3>
        <p className="text-sm text-muted-foreground">No language data for these repositories.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-1">Language Analytics</h3>
      <p className="text-sm text-muted-foreground mb-6">Primary language of each public repository</p>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={languageData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                animationDuration={800}
              >
                {languageData.map((entry, i) => (
                  <Cell key={entry.name} fill={entry.color || CHART_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value, name) => [
                  `${value} repos (${((Number(value) / total) * 100).toFixed(1)}%)`,
                  String(name),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-2">
          {languageData.map((lang, i) => (
            <div key={lang.name} className="flex items-center gap-2">
              <div
                aria-hidden
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: lang.color || CHART_COLORS[i] }}
              />
              <span className="text-sm text-foreground truncate">{lang.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {((lang.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
