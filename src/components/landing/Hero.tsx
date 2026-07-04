import { motion } from 'framer-motion';
import { BarChart3, GitBranch, Star } from 'lucide-react';
import { useNavigate } from 'react-router';
import { SearchBar } from '@/components/shared/SearchBar';
import { useRecentSearches } from '@/hooks/useRecentSearches';

export function Hero() {
  const navigate = useNavigate();
  const { searches, addSearch, toggleFavorite, removeSearch } = useRecentSearches();

  function handleSearch(username: string) {
    addSearch(username);
    navigate(`/?user=${username}`);
  }

  const features = [
    { icon: BarChart3, label: 'Contribution Analytics', desc: 'Visualize your growth over time' },
    { icon: GitBranch, label: 'Repository Insights', desc: 'Explore your open source footprint' },
    { icon: Star, label: 'Developer Journey', desc: 'See your milestones and achievements' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4">
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            GitHub Analytics Dashboard
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6"
        >
          Visualize Your{' '}
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              GitHub Journey
            </span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto"
        >
          Discover your coding story through beautiful charts, contribution heatmaps,
          and interactive analytics. Enter a GitHub username to get started.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-lg mx-auto mb-12"
        >
          <SearchBar
            onSearch={handleSearch}
            recentSearches={searches}
            onToggleFavorite={toggleFavorite}
            onRemove={removeSearch}
            size="large"
            placeholder="Enter GitHub username..."
          />
          <p className="text-xs text-muted-foreground mt-3">
            Try <button onClick={() => handleSearch('torvalds')} className="text-primary hover:underline">torvalds</button>,{' '}
            <button onClick={() => handleSearch('gaearon')} className="text-primary hover:underline">gaearon</button>, or{' '}
            <button onClick={() => handleSearch('sindresorhus')} className="text-primary hover:underline">sindresorhus</button>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto"
        >
          {features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card/50 backdrop-blur p-4 text-left hover:border-primary/30 transition-colors group"
            >
              <Icon className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
