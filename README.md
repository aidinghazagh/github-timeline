# CommitScope

**Visualize Your GitHub Journey.**

A beautiful, production-ready GitHub analytics dashboard that tells the story of a developer's growth over time.

[![Deploy to GitHub Pages](https://github.com/aidinghazagh/github-timeline/actions/workflows/deploy.yml/badge.svg)](https://github.com/aidinghazagh/github-timeline/actions/workflows/deploy.yml)

---

## Features

- **Contribution Timeline** — Interactive area chart showing your activity over time
- **Contribution Heatmap** — GitHub-style calendar with daily contribution counts
- **Profile Card** — Avatar, bio, followers, repos, and more
- **Stats Dashboard** — Animated counters for repos, stars, forks, PRs, issues, reviews, and streaks
- **Repository Explorer** — Search, sort, and filter all public repos with language tags
- **Language Analytics** — Pie chart showing your top programming languages
- **Developer Journey** — Animated vertical timeline of key milestones
- **Theme Switching** — Dark, light, and system theme support
- **Shareable URLs** — Share your dashboard with `?user=username`
- **Responsive Design** — Works on desktop, tablet, and mobile

---

## Two Modes

### Public Mode (no token needed)
- Enter any GitHub username
- Uses REST API + Events API
- Shows the last 90 days of public activity (GitHub's event feed is capped at 90 days / 300 events)
- Commit, PR, issue and review counts are estimates from that feed
- No authentication required

### Enhanced Mode (with Personal Access Token)
- Full contribution history, back to account creation
- Exact all-time commit, PR, issue and review counts from GitHub
- Complete yearly timeline data
- The token is only sent to GitHub's API. It's kept in session storage (cleared when the tab closes) unless you tick "Remember on this device"
- If GitHub rejects the token, it's removed and the dashboard falls back to public mode

---

## Getting a GitHub Token

1. Go to [New fine-grained token](https://github.com/settings/personal-access-tokens/new)
2. Name it (e.g. "CommitScope") and pick a short expiration
3. Keep the default **Public repositories (read-only)** access — no extra permissions are needed
4. Generate the token, then paste it in the dashboard

---

## Tech Stack

| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) | UI framework |
| [Vite](https://vitejs.dev/) | Build tool |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling |
| [Recharts](https://recharts.org/) | Charts and graphs |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [React Router](https://reactrouter.com/) | Client-side routing |
| [TanStack Query](https://tanstack.com/query) | Data fetching and caching |
| [Lucide React](https://lucide.dev/) | Icons |

---

## Getting Started

### Prerequisites
- Node.js 20.19+ (required by Vite 8)
- npm

### Installation

```bash
git clone https://github.com/aidinghazagh/github-timeline.git
cd github-timeline
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173/github-timeline/`

### Build

```bash
npm run build
```

### Lint and Test

```bash
npm run lint
npm test
```

### Preview Production Build

```bash
npm run preview
```

---

## Deployment

This project deploys automatically to **GitHub Pages** on every push to `main`.

The GitHub Actions workflow:
1. Installs dependencies
2. Runs lint and tests
3. Builds the project with Vite
4. Deploys to GitHub Pages

A separate CI workflow runs lint, tests and the build on every pull request.

### Manual Deployment

1. Go to **Settings → Pages** in your repository
2. Set **Source** to **GitHub Actions**
3. Push to `main` — deployment happens automatically

---

## Project Structure

```
src/
├── api/                    # API clients and caching
│   ├── cache.ts            # localStorage cache with TTL
│   ├── contributions.ts    # Year windows, merging, event parsing
│   ├── errors.ts           # Typed GitHub API errors
│   ├── github.ts           # REST API client
│   ├── graphql.ts          # GraphQL client
│   └── queries.ts          # GraphQL query strings
├── components/
│   ├── dashboard/          # Dashboard components
│   │   ├── ContributionHeatmap.tsx
│   │   ├── ContributionTimeline.tsx
│   │   ├── LanguageChart.tsx
│   │   ├── JourneyTimeline.tsx
│   │   ├── ProfileCard.tsx
│   │   ├── RepoCard.tsx
│   │   ├── RepoExplorer.tsx
│   │   ├── StatCard.tsx
│   │   └── StatsGrid.tsx
│   ├── landing/            # Landing page components
│   │   ├── AnimatedBackground.tsx
│   │   └── Hero.tsx
│   ├── layout/             # Layout components
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   └── ThemeToggle.tsx
│   └── shared/             # Reusable components
│       ├── AnimatedCounter.tsx
│       ├── EmptyState.tsx
│       ├── ErrorCard.tsx
│       ├── SearchBar.tsx
│       └── SkeletonCard.tsx
├── hooks/                  # Custom React hooks
│   ├── useGitHubRepos.ts
│   ├── useGitHubUser.ts
│   ├── useRecentSearches.ts
│   ├── useTheme.ts
│   └── useToken.ts
├── pages/                  # Page components
│   ├── DashboardPage.tsx
│   ├── HomePage.tsx
│   └── LandingPage.tsx
├── types/                  # TypeScript types
│   └── github.ts
├── utils/                  # Utility functions
│   ├── cn.ts
│   ├── constants.ts
│   ├── dates.ts            # Local-time date, week and streak helpers
│   ├── formatters.ts
│   ├── languageColors.ts
│   └── validation.ts
├── styles/
│   └── globals.css
├── App.tsx
├── main.tsx
└── router.tsx
```

---

## API Strategy

| Mode | User Profile | Repos | Contributions |
|---|---|---|---|
| **Public** | REST API | REST API | Events API (~90 days) |
| **Token** | GraphQL | GraphQL | GraphQL (full history, one-year windows batched into parallel requests) |

### Caching
- API responses are cached in localStorage for 1 hour, keyed by username and a fingerprint of the token (never the token itself)
- Cached data is shown immediately; "Try again" always fetches fresh data
- Expired entries are pruned on startup and when storage is full

### Rate Limits
- **Public REST**: 60 requests/hour
- **Authenticated GraphQL**: 5,000 points/hour

---

## License

MIT

---

Built with care by [CommitScope](https://github.com/aidinghazagh/github-timeline)
