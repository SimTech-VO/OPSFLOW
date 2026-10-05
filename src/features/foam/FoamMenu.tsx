import { Activity, Calculator, Play } from 'lucide-react';
import { LibraryCard, PaperScreen, ScreenHeader } from '../../ui';

// ==========================================
// MENU MOUSSE
// ==========================================
export function FoamMenu({ onNavigate, onBack, onHome }: { onNavigate: (route: string) => void, onBack: () => void, onHome: () => void }) {
  return (
    <PaperScreen
      header={<ScreenHeader overline="Module" title="Mousse" onBack={onBack} onHome={onHome} />}
      title="Mousse"
      description="Suivi de la production en direct et planification des moyens."
    >
      <LibraryCard
        primary
        category="Opération"
        categoryIcon={<Activity size={16} />}
        title="Opérations en direct"
        description="Chronomètre, autonomie en eau et en émulseur, facteur limitant, point de situation COS et bilan."
        action="Démarrer"
        actionIcon={<Play size={16} className="fill-current" />}
        onAction={() => onNavigate('foam-live')}
      />
      <LibraryCard
        category="Anticipation"
        categoryIcon={<Calculator size={16} />}
        dot="brand"
        title="Planificateur"
        description="Surface en feu, taux d'application de la FOD, débits, volumes d'eau et d'émulseur, engins capables."
        action="Ouvrir"
        actionIcon={<Play size={16} className="fill-current" />}
        onAction={() => onNavigate('surface')}
      />
    </PaperScreen>
  );
}
