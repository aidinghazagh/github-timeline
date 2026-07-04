import { cn } from '@/utils/cn';

interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-6 animate-pulse',
        className
      )}
    >
      <div className="h-5 w-1/3 rounded bg-muted mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-muted mb-2"
          style={{ width: `${60 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}
