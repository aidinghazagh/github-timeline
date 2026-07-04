import { createHashRouter } from 'react-router';
import { HomePage } from '@/pages/HomePage';

export const router = createHashRouter([
  {
    path: '/',
    element: <HomePage />,
  },
]);
