import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initTheme } from './hooks/useTheme';
import { pruneCache } from './api/cache';
import './styles/globals.css';

initTheme();
pruneCache();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
