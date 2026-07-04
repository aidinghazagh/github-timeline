import { Link } from 'react-router';
import { ThemeToggle } from './ThemeToggle';
import { ExternalLink } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              CS
            </div>
            <span className="font-semibold text-foreground text-lg tracking-tight group-hover:text-primary transition-colors">
              CommitScope
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
