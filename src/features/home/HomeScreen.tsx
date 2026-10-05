import { ClipboardList, Database, Play, Wind } from 'lucide-react';
import { safeFormatTime } from '../../lib/format';
import { LibraryCard, Logo, PlanIllustration } from '../../ui';
import { HomePlan } from '../ventilation/PlanPhoto';

const RETEX_URL = 'https://script.google.com/macros/s/AKfycbxKzSH9P3aT_CdSlX9Us1XImSXooX6xQJGOytwmzo5CJql3icyhSLpIvZb5MuSl-F-r1w/exec';

type HomeScreenProps = {
  navigateTo: (route: string) => void;
  foamState: any;
  ventState: any;
  isFoamActive: boolean;
  isVentActive: boolean;
};

// Accueil construit comme SimFlow : bandeau sombre (marque et plan), puis bibliothèque de modules sur fond beige.
export function HomeScreen({ navigateTo, foamState, ventState, isFoamActive, isVentActive }: HomeScreenProps) {
  const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      {/* Bandeau sombre : marque, heure, plan d'intervention */}
      <section className="bg-panel pt-safe text-fg">
        <div className="mx-auto w-full max-w-3xl px-4 pb-6 animate-fade-in">
          <div className="flex min-h-14 items-center justify-between">
            <Logo />
            <span className="font-mono text-sm tabular text-fg-muted">t = <span className="text-fg">{now}</span></span>
          </div>
          <p className="mt-5 font-mono text-xs font-medium uppercase tracking-[0.16em] text-brand-light">Ventilation opérationnelle · Mousse</p>
          <h1 className="mt-2 text-[32px] font-bold leading-[1.1] tracking-tight">Décider vite, sur le terrain.</h1>
          <p className="mt-3 text-base leading-relaxed text-fg-muted">
            L'outil d'intervention du chef d'agrès et du chef de groupe, pendant terrain du simulateur SimFlow.
          </p>
          {/* Plan d'intervention photographié, ou illustration en attendant la photo */}
          <div className="mt-5">
            <HomePlan onOpen={() => navigateTo('ventilation')}>
              <PlanIllustration caption="Pavillon R+1 · VPP en entrée" time={now} />
            </HomePlan>
          </div>
        </div>
      </section>

      {/* Bibliothèque de modules, fond beige */}
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-6 text-ink">
        {(isFoamActive || isVentActive) && (
          <section className="space-y-3" aria-label="Opérations en cours">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">En cours</h2>
            {isVentActive && (
              <LibraryCard
                highlighted
                primary
                category="Ventilation en cours"
                categoryIcon={<Wind size={16} />}
                title={safeFormatTime(ventState?.elapsedSeconds || 0)}
                description="Chronomètre de la phase en cours. Reprenez le suivi, le séquencement ou le bilan."
                action="Reprendre"
                actionIcon={<Play size={16} className="fill-current" />}
                onAction={() => navigateTo('ventilation')}
              />
            )}
            {isFoamActive && (
              <LibraryCard
                highlighted
                primary
                category="Mousse en cours"
                categoryIcon={<Database size={16} />}
                title={safeFormatTime(foamState?.elapsedSeconds || 0)}
                description="Production de mousse engagée. Reprenez le suivi de l'autonomie et le point de situation."
                action="Reprendre"
                actionIcon={<Play size={16} className="fill-current" />}
                onAction={() => navigateTo('foam-live')}
              />
            )}
          </section>
        )}

        <section className="space-y-3" aria-label="Modules">
          <div className="pb-1">
            <h2 className="text-[28px] font-bold leading-tight tracking-tight">Modules</h2>
            <p className="mt-1 text-base text-ink-muted">Les outils d'aide à la décision OpsFlow.</p>
          </div>
          <LibraryCard
            primary={!isFoamActive && !isVentActive}
            category="Module"
            categoryIcon={<Wind size={16} />}
            dot="sky"
            title="Ventilation opérationnelle"
            description="Reconnaissance 360°, choix PMTT, checklist de sécurité, suivi chronométré des phases et rapport au COS."
            action="Ouvrir"
            actionIcon={<Play size={16} className="fill-current" />}
            onAction={() => navigateTo('ventilation')}
          />
          <LibraryCard
            category="Module"
            categoryIcon={<Database size={16} />}
            dot="brand"
            title="Mousse"
            description="Autonomie en eau et en émulseur en direct, et planificateur des besoins selon les taux de la FOD."
            action="Ouvrir"
            actionIcon={<Play size={16} className="fill-current" />}
            onAction={() => navigateTo('foam-menu')}
          />
          <LibraryCard
            category="Retour d'expérience"
            categoryIcon={<ClipboardList size={16} />}
            dot="ok"
            title="Saisir un RETEX"
            description="Partagez ce qui a fonctionné, ou pas, après l'intervention."
            action="Ouvrir le formulaire"
            onAction={() => window.open(RETEX_URL, '_blank')}
          />
        </section>

        <p className="pt-6 text-center text-sm text-ink-muted">
          OpsFlow et SimFlow · SimTech-VO<br />
          Outils numérique par <span className="font-semibold text-ink">Cucalon &amp; Decarreaux</span>
        </p>
      </main>
    </div>
  );
}
