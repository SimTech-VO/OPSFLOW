import { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FoamApp } from './features/foam/FoamApp';
import { FoamMenu } from './features/foam/FoamMenu';
import { HomeScreen } from './features/home/HomeScreen';
import { SurfaceApp } from './features/planner/SurfaceApp';
import { VentilationApp } from './features/ventilation/VentilationApp';
import { loadPersistedState, STORAGE_KEYS } from './lib/storage';

// ==========================================
// MENU D'ACCUEIL & ROOT
// ==========================================
export default function App() {
  const [route, setRoute] = useState('home');
  const [, setTick] = useState(0); // Force update for live widgets

  // Live clock for widgets
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Gestion de l'historique de navigation
  useEffect(() => {
    // Fonction pour gérer le retour arrière
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.route) {
        setRoute(event.state.route);
      } else {
        // Si pas d'état (ex: retour à la page initiale), on revient à home
        setRoute('home');
      }
    };

    // Écouter l'événement popstate (bouton retour / swipe)
    window.addEventListener('popstate', handlePopState);

    // Remplacer l'état initial pour qu'il ait la route 'home'
    window.history.replaceState({ route: 'home' }, '');

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Fonction de navigation personnalisée
  const navigateTo = (newRoute: string) => {
    setRoute(newRoute);
    window.history.pushState({ route: newRoute }, '');
  };

  // Use loadPersistedState for safe parsing and timestamp adjustment
  const foamState = loadPersistedState(STORAGE_KEYS.foamState);
  const ventState = loadPersistedState(STORAGE_KEYS.ventState);

  const isFoamActive = foamState?.mode === 'operational' && foamState?.isTimerActive;
  const isVentActive = ventState?.isVentilating;

  const goBack = () => window.history.back();
  const goHome = () => navigateTo('home');

  return (
    <ErrorBoundary>
      {route === 'home' ? (
        <HomeScreen navigateTo={navigateTo} foamState={foamState} ventState={ventState} isFoamActive={!!isFoamActive} isVentActive={!!isVentActive} />
      ) : route === 'foam-menu' ? (
        <FoamMenu onNavigate={navigateTo} onBack={goBack} onHome={goHome} />
      ) : route === 'foam-live' ? (
        <FoamApp onBack={goBack} onHome={goHome} />
      ) : route === 'surface' ? (
        <SurfaceApp onBack={goBack} onHome={goHome} />
      ) : (
        <VentilationApp onBack={goBack} onHome={goHome} />
      )}
    </ErrorBoundary>
  );
}
