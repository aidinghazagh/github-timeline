import { parseDateStr, toLocalDateStr } from './dates';
import type { TimeRange } from '@/types/github';

/** Accepts full ISO timestamps or date-only YYYY-MM-DD strings (read as local dates). */
export function toDate(dateStr: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? parseDateStr(dateStr) : new Date(dateStr);
}

export function formatDate(dateStr: string): string {
  return toDate(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function getHeatmapLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}

export function clampDateRange<T extends { date: string }>(days: T[], range: TimeRange): T[] {
  const now = new Date();
  let cutoff: Date;
  switch (range) {
    case '1m':
      cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case '90d':
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89);
      break;
    case '1y':
      cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      return days;
  }
  const cutoffStr = toLocalDateStr(cutoff);
  return days.filter((d) => d.date >= cutoffStr);
}
