import { useSearchParams } from 'react-router';
import { LandingPage } from './LandingPage';
import { DashboardPage } from './DashboardPage';

export function HomePage() {
  const [searchParams] = useSearchParams();
  const username = searchParams.get('user');

  if (username) {
    return <DashboardPage />;
  }

  return <LandingPage />;
}
