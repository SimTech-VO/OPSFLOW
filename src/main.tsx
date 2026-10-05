import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
// Polices auto-hébergées : disponibles hors ligne, sans appel à Google Fonts
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import App from './App.tsx';
import {migrateLegacyStorageKeys} from './lib/storage';
import './index.css';

// Avant le premier rendu : les modules relisent leur état au montage
migrateLegacyStorageKeys();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
