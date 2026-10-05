import type { ReactNode } from 'react';
import { ChevronRight, ClipboardList, Database, Flame, Wind } from 'lucide-react';
import { safeFormatTime } from '../../lib/format';
import { NavCard, Overline, StatusDot } from '../../ui';

const RETEX_URL = 'https://script.google.com/macros/s/AKfycbxKzSH9P3aT_CdSlX9Us1XImSXooX6xQJGOytwmzo5CJql3icyhSLpIvZb5MuSl-F-r1w/exec';

type HomeScreenProps = {
  navigateTo: (route: string) => void;
  foamState: any;
  ventState: any;
  isFoamActive: boolean;
  isVentActive: boolean;
};

// Reprise rapide d'une opération en cours
function ActiveOperation({ label, icon, seconds, onClick }: { label: string; icon: ReactNode; seconds: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-18 w-full items-center gap-4 rounded-2xl border-2 border-brand bg-brand/10 px-4 py-3 text-left transition-colors hover:bg-brand/15"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-canvas">{icon}</span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <StatusDot tone="danger" />
          <Overline>{label}</Overline>
        </span>
        <span className="block font-mono text-2xl font-bold tabular text-fg">{safeFormatTime(seconds)}</span>
      </span>
      <ChevronRight className="text-brand-light transition-transform group-hover:translate-x-0.5" size={24} />
    </button>
  );
}

export function HomeScreen({ navigateTo, foamState, ventState, isFoamActive, isVentActive }: HomeScreenProps) {
  const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-safe pb-safe animate-fade-in">
        {/* Bandeau : heure locale */}
        <div className="flex items-center justify-end py-2">
          <span className="rounded-lg border border-surface bg-panel px-3 py-1.5 font-mono text-sm tabular text-fg-muted">
            t = <span className="text-fg">{now}</span>
          </span>
        </div>

        {/* Marque */}
        <div className="pt-6 pb-8">
          <Overline>Portail tactique opérationnel</Overline>
          <h1 className="mt-2 text-6xl font-extrabold tracking-tighter sm:text-7xl">
            <span className="text-fg">OPS</span><span className="text-brand">FLOW</span>
          </h1>
          <div className="mt-4 h-1 w-16 rounded-full bg-brand" />
        </div>

        {(isFoamActive || isVentActive) && (
          <section className="mb-6 space-y-3" aria-label="Opérations en cours">
            {isFoamActive && (
              <ActiveOperation label="Mousse en cours" icon={<Flame size={24} />} seconds={foamState?.elapsedSeconds || 0} onClick={() => navigateTo('foam-live')} />
            )}
            {isVentActive && (
              <ActiveOperation label="Ventilation en cours" icon={<Wind size={24} />} seconds={ventState?.elapsedSeconds || 0} onClick={() => navigateTo('ventilation')} />
            )}
          </section>
        )}

        <section className="space-y-3" aria-label="Modules">
          <Overline tone="muted">Modules</Overline>
          <NavCard
            title="Ventilation"
            description="Assistant PMTT & séquences"
            icon={<Wind size={28} />}
            accent="sky"
            onClick={() => navigateTo('ventilation')}
          />
          <NavCard
            title="Mousse"
            description="Calculateur & autonomie"
            icon={<Database size={28} />}
            onClick={() => navigateTo('foam-menu')}
          />
          <NavCard
            compact
            title="Saisir un RETEX"
            description="Retours d'expérience"
            icon={<ClipboardList size={22} />}
            accent="muted"
            onClick={() => window.open(RETEX_URL, '_blank')}
          />
        </section>

        <p className="mt-auto pt-10 text-center font-mono text-xs uppercase tracking-[0.08em] text-fg-subtle">
          Outils numérique par <span className="font-bold text-fg-muted">Cucalon & Decarreaux</span>
        </p>
      </main>
    </div>
  );
}
