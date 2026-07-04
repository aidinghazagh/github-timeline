import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-12 text-center">
      <div className="mx-auto mb-4 text-muted-foreground">
        {icon || <SearchX className="h-12 w-12" />}
      </div>
      <h3 className="text-foreground font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">{description}</p>
    </div>
  );
}
