import { createHashRouter, Outlet } from 'react-router';
import { HomePage } from '@/pages/HomePage';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export const router = createHashRouter([
  {
    element: <RootLayout />,
    children: [{ path: '/', element: <HomePage /> }],
  },
]);
