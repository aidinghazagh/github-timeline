import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, ExternalLink, Key, X, Check } from 'lucide-react';
import { useGitHubUser } from '@/hooks/useGitHubUser';
import { useGitHubRepos } from '@/hooks/useGitHubRepos';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useToken } from '@/hooks/useToken';
import { isValidUsername } from '@/utils/validation';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { ContributionHeatmap } from '@/components/dashboard/ContributionHeatmap';
import { ContributionTimeline } from '@/components/dashboard/ContributionTimeline';
import { LanguageChart } from '@/components/dashboard/LanguageChart';
import { RepoExplorer } from '@/components/dashboard/RepoExplorer';
import { JourneyTimeline } from '@/components/dashboard/JourneyTimeline';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ErrorCard } from '@/components/shared/ErrorCard';

const TOKEN_URL =
  'https://github.com/settings/personal-access-tokens/new?name=CommitScope&description=Read-only+access+for+CommitScope';

interface DashboardPageProps {
  username: string;
}

export function DashboardPage({ username }: DashboardPageProps) {
  const valid = isValidUsername(username);
  const navigate = useNavigate();
  const { token, saveToken, clearToken } = useToken();
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenDraft, setTokenDraft] = useState('');
  const [rememberToken, setRememberToken] = useState(false);
  const [tokenNotice, setTokenNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { addSearch } = useRecentSearches();

  // A rejected token is removed so the dashboard falls back to public mode.
  const handleInvalidToken = useCallback(() => {
    clearToken();
    setTokenNotice('Your token was invalid or expired and has been removed. Showing public data instead.');
  }, [clearToken]);

  const userQuery = useGitHubUser(valid ? username : '', token, handleInvalidToken);
  const reposQuery = useGitHubRepos(valid ? username : '', token, handleInvalidToken);

  // Record the search once the user is confirmed to exist.
  const loadedLogin = userQuery.data?.user.login;
  useEffect(() => {
    if (loadedLogin) addSearch(loadedLogin);
  }, [loadedLogin, addSearch]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  function handleSaveToken() {
    const trimmed = tokenDraft.trim();
    if (trimmed) {
      saveToken(trimmed, rememberToken);
      setTokenNotice(null);
    }
    setShowTokenInput(false);
    setTokenDraft('');
  }

  async function handleShare() {
    const base = import.meta.env.BASE_URL || '/';
    const url = `${window.location.origin}${base}#/?user=${encodeURIComponent(username)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt('Copy this link:', url);
    }
  }

  if (!valid) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <ErrorCard message={`"${username}" isn't a valid GitHub username.`} />
      </div>
    );
  }

  const isLoading = userQuery.isLoading || reposQuery.isLoading;
  const error = userQuery.error || reposQuery.error;
  const hasToken = userQuery.data?.coverage.mode === 'full';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {token ? (
            <button
              onClick={clearToken}
              className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors"
              title="Remove token"
            >
              <Key className="h-4 w-4" />
              Token active
              <X className="h-3.5 w-3.5 opacity-70" aria-hidden />
            </button>
          ) : (
            <button
              onClick={() => setShowTokenInput(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Key className="h-4 w-4" />
              Add Token
            </button>
          )}
          <button
            onClick={handleShare}
            aria-live="polite"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
            {copied ? 'Link copied' : 'Share'}
          </button>
          <a
            href={`https://github.com/${encodeURIComponent(username)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </div>

      {tokenNotice && (
        <div
          role="status"
          className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground"
        >
          <span>{tokenNotice}</span>
          <button
            onClick={() => setTokenNotice(null)}
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Token prompt banner */}
      {!token && !showTokenInput && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Limited data — unlock full history with a token
                </p>
                <p className="text-xs text-muted-foreground">
                  Without a token, only public activity from the last 90 days is shown, and
                  counts are estimated from GitHub's event feed. A read-only token unlocks your
                  complete contribution history with exact PR, issue and review counts.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTokenInput(true)}
              className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Add Token
            </button>
          </div>
        </motion.div>
      )}

      {/* Token input */}
      {showTokenInput && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">GitHub Personal Access Token</h3>
            <button
              onClick={() => setShowTokenInput(false)}
              aria-label="Close token form"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ol className="text-xs text-muted-foreground mb-4 space-y-2 list-decimal list-inside">
            <li>
              Open{' '}
              <a
                href={TOKEN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub → New fine-grained token
              </a>
            </li>
            <li>
              Keep the defaults: <span className="text-foreground">Public repositories (read-only)</span>,
              no extra permissions. Pick a short expiration.
            </li>
            <li>Generate the token, copy it, and paste it below.</li>
          </ol>
          <p className="text-xs text-muted-foreground mb-4">
            The token is only sent to GitHub's API. It's kept for this browser tab only unless you
            choose to remember it.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveToken();
            }}
          >
            <input
              type="password"
              value={tokenDraft}
              onChange={(e) => setTokenDraft(e.target.value)}
              placeholder="github_pat_..."
              aria-label="Personal access token"
              autoComplete="off"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Save
            </button>
          </form>
          <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={rememberToken}
              onChange={(e) => setRememberToken(e.target.checked)}
            />
            Remember on this device (stored in this browser's local storage)
          </label>
        </motion.div>
      )}

      {isLoading && (
        <div className="space-y-6" aria-busy="true" aria-label="Loading">
          <SkeletonCard className="h-40" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} className="h-28" />
            ))}
          </div>
          <SkeletonCard className="h-80" />
        </div>
      )}

      {error && (
        <ErrorCard
          message={error.message}
          onRetry={() => {
            if (userQuery.error) userQuery.refetch();
            if (reposQuery.error) reposQuery.refetch();
          }}
        />
      )}

      {userQuery.data && reposQuery.data && (
        <motion.div
          // Remount when the user or data source changes so per-view state
          // (selected year, time range, filters) resets.
          key={`${userQuery.data.user.login}:${userQuery.data.coverage.mode}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <ProfileCard user={userQuery.data.user} />

          <ContributionTimeline
            calendar={userQuery.data.user.contributionsCollection.contributionCalendar}
            hasToken={hasToken}
          />

          <StatsGrid
            contributions={userQuery.data.user.contributionsCollection}
            repos={reposQuery.data}
            createdAt={userQuery.data.user.createdAt}
            coverage={userQuery.data.coverage}
          />

          <ContributionHeatmap
            calendar={userQuery.data.user.contributionsCollection.contributionCalendar}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LanguageChart repos={reposQuery.data} />
            <JourneyTimeline
              user={userQuery.data.user}
              repos={reposQuery.data}
              coverage={userQuery.data.coverage}
            />
          </div>

          <RepoExplorer repos={reposQuery.data} />
        </motion.div>
      )}
    </div>
  );
}
