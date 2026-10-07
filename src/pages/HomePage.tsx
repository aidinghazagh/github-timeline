import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router';
import { LandingPage } from './LandingPage';
import { SkeletonCard } from '@/components/shared/SkeletonCard';

// The dashboard pulls in the charting libraries, so load it only when needed.
const DashboardPage = lazy(() =>
  import('./DashboardPage').then((m) => ({ default: m.DashboardPage }))
);

export function HomePage() {
  const [searchParams] = useSearchParams();
  const username = searchParams.get('user')?.trim();

  if (username) {
    return (
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <SkeletonCard className="h-40" />
            <SkeletonCard className="h-80" />
          </div>
        }
      >
        <DashboardPage username={username} />
      </Suspense>
    );
  }

  return <LandingPage />;
}
