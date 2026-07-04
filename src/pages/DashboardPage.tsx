import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, ExternalLink, Key, X } from 'lucide-react';
import { useGitHubUser } from '@/hooks/useGitHubUser';
import { useGitHubRepos } from '@/hooks/useGitHubRepos';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { ContributionHeatmap } from '@/components/dashboard/ContributionHeatmap';
import { ContributionTimeline } from '@/components/dashboard/ContributionTimeline';
import { LanguageChart } from '@/components/dashboard/LanguageChart';
import { RepoExplorer } from '@/components/dashboard/RepoExplorer';
import { JourneyTimeline } from '@/components/dashboard/JourneyTimeline';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ErrorCard } from '@/components/shared/ErrorCard';

const TOKEN_KEY = 'commitscope:gh-token';

export function DashboardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const username = searchParams.get('user') || '';

  const [token, setToken] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || undefined;
    } catch {
      return undefined;
    }
  });
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenDraft, setTokenDraft] = useState('');

  const { addSearch } = useRecentSearches();

  const userQuery = useGitHubUser(username, token);
  const reposQuery = useGitHubRepos(username, token);

  useEffect(() => {
    if (username) addSearch(username);
  }, [username]);

  if (!username) {
    navigate('/');
    return null;
  }

  function handleSaveToken() {
    const trimmed = tokenDraft.trim();
    if (trimmed) {
      setToken(trimmed);
      try {
        localStorage.setItem(TOKEN_KEY, trimmed);
      } catch {}
    }
    setShowTokenInput(false);
    setTokenDraft('');
  }

  function handleClearToken() {
    setToken(undefined);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  }

  function handleShare() {
    const base = import.meta.env.BASE_URL || '/';
    const url = `${window.location.origin}${base}#/?user=${username}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    }).catch(() => {
      // Fallback: select from a temporary input
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      alert('Link copied to clipboard!');
    });
  }

  const isLoading = userQuery.isLoading || reposQuery.isLoading;
  const error = userQuery.error || reposQuery.error;
  const hasContributions =
    userQuery.data &&
    userQuery.data.user.contributionsCollection.contributionCalendar
      .totalContributions > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-2">
            {/* Token button */}
            {token ? (
              <button
                onClick={handleClearToken}
                className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400 hover:bg-green-500/20 transition-colors"
                title="Click to remove token"
              >
                <Key className="h-4 w-4" />
                Token active
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
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>

        {/* Token input modal */}
        {showTokenInput && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">
                GitHub Personal Access Token
              </h3>
              <button
                onClick={() => setShowTokenInput(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Optional. Enables higher API rate limits and full contribution data.
              Token stays in your browser only — never sent anywhere except GitHub.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={tokenDraft}
                onChange={(e) => setTokenDraft(e.target.value)}
                placeholder="ghp_..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveToken()}
              />
              <button
                onClick={handleSaveToken}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}

        {isLoading && (
          <div className="space-y-6">
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
              userQuery.refetch();
              reposQuery.refetch();
            }}
          />
        )}

        {userQuery.data && reposQuery.data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <ProfileCard user={userQuery.data.user} />

            {hasContributions && (
              <ContributionTimeline
                calendar={
                  userQuery.data.user.contributionsCollection
                    .contributionCalendar
                }
              />
            )}

            <StatsGrid
              contributions={userQuery.data.user.contributionsCollection}
              repos={reposQuery.data}
            />

            {hasContributions && (
              <ContributionHeatmap
                calendar={
                  userQuery.data.user.contributionsCollection
                    .contributionCalendar
                }
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LanguageChart repos={reposQuery.data} />
              <JourneyTimeline
                user={userQuery.data.user}
                repos={reposQuery.data}
              />
            </div>

            <RepoExplorer repos={reposQuery.data} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
