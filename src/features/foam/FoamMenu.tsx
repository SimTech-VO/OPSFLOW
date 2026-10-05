import { Calculator, Play } from 'lucide-react';
import { NavCard, Screen, ScreenHeader } from '../../ui';

// ==========================================
// MENU MOUSSE
// ==========================================
export function FoamMenu({ onNavigate, onBack, onHome }: { onNavigate: (route: string) => void, onBack: () => void, onHome: () => void }) {
  return (
    <Screen header={<ScreenHeader overline="Menu principal" title="Mousse" onBack={onBack} onHome={onHome} />}>
      <div className="space-y-3 pt-2">
        <NavCard
          title="Opérations (Live)"
          description="Suivi intervention & autonomie"
          icon={<Play size={26} className="fill-current" />}
          onClick={() => onNavigate('foam-live')}
        />
        <NavCard
          title="Planificateur"
          description="Surface, moyens & anticipation"
          icon={<Calculator size={26} />}
          accent="muted"
          onClick={() => onNavigate('surface')}
        />
      </div>
    </Screen>
  );
}
