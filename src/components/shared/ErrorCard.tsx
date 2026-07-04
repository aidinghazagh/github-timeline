import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" />
      <p className="text-foreground font-medium mb-2">Something went wrong</p>
      <p className="text-muted-foreground text-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
