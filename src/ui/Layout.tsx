import type { ReactNode } from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { cn } from './cn';
import { IconButton } from './Button';

// Sur-titre technique (style SimFlow) : JetBrains Mono, capitales, orange clair.
export function Overline({ children, tone = 'brand', className }: { children: ReactNode; tone?: 'brand' | 'muted' | 'ok' | 'danger' | 'warn' | 'sky'; className?: string }) {
  return (
    <p
      className={cn(
        'font-mono text-xs font-medium uppercase tracking-[0.14em]',
        tone === 'brand' && 'text-brand-light',
        tone === 'muted' && 'text-fg-muted',
        tone === 'ok' && 'text-ok',
        tone === 'danger' && 'text-danger',
        tone === 'warn' && 'text-warn',
        tone === 'sky' && 'text-sky',
        className,
      )}
    >
      {children}
    </p>
  );
}

type ScreenHeaderProps = {
  title: string;
  overline?: string;
  onBack?: () => void;
  onHome?: () => void;
  actions?: ReactNode;
  status?: ReactNode;
};

// Libellé de section, comme « BÂTIMENT » dans le panneau du simulateur SimFlow.
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-[13px] font-semibold uppercase tracking-[0.12em] text-fg-muted', className)}>{children}</p>;
}

// Barre de titre (style SimFlow) : flèche de retour, sur-titre orange, titre, outils à droite.
export function ScreenHeader({ title, overline, onBack, onHome, actions, status }: ScreenHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-surface bg-panel pt-safe">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-2 pb-3 sm:px-4">
        {onBack && (
          <button type="button" aria-label="Retour" title="Retour" onClick={onBack} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-fg transition-colors hover:bg-surface">
            <ArrowLeft size={24} />
          </button>
        )}
        <div className={cn('min-w-0 flex-1', !onBack && 'pl-2')}>
          {overline && <p className="truncate text-xs font-semibold uppercase tracking-[0.1em] text-brand-light">{overline}</p>}
          <div className="flex items-center gap-2">
            {status}
            <h1 className="truncate text-lg font-bold leading-tight text-fg">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {onHome && (
            <IconButton label="Accueil" onClick={onHome}>
              <Home size={20} />
            </IconButton>
          )}
        </div>
      </div>
    </header>
  );
}

// Conteneur d'écran : contenu centré, barre d'actions optionnelle en bas (zone du pouce).
export function Screen({ header, footer, children, className }: { header?: ReactNode; footer?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      {header}
      <main className={cn('mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-4 animate-fade-in', className)}>{children}</main>
      {footer && (
        <div className="sticky bottom-0 z-30 border-t border-surface bg-panel pb-safe">
          <div className="mx-auto w-full max-w-3xl px-4 pt-3">{footer}</div>
        </div>
      )}
    </div>
  );
}

type PanelProps = {
  title?: ReactNode;
  icon?: ReactNode;
  aside?: ReactNode;
  tone?: 'default' | 'danger' | 'ok' | 'warn' | 'brand';
  className?: string;
  children?: ReactNode;
};

// Panneau de contenu : fond secondaire, fine bordure, libellé de section en capitales.
export function Panel({ title, icon, aside, tone = 'default', className, children }: PanelProps) {
  return (
    <section
      className={cn(
        'rounded-xl border p-4',
        tone === 'default' && 'border-surface bg-panel',
        tone === 'danger' && 'border-danger/60 bg-danger/10',
        tone === 'ok' && 'border-ok/50 bg-ok/10',
        tone === 'warn' && 'border-warn/60 bg-warn/10',
        tone === 'brand' && 'border-brand/50 bg-brand/10',
        className,
      )}
    >
      {(title || aside) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-fg-muted">
            {icon}
            {typeof title === 'string' ? <SectionLabel>{title}</SectionLabel> : title}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

// Voyant d'état (intervention en cours, terminée…)
export function StatusDot({ tone }: { tone: 'danger' | 'ok' | 'brand' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-2.5 w-2.5 shrink-0 rounded-full',
        tone === 'danger' && 'bg-danger animate-pulse',
        tone === 'ok' && 'bg-ok',
        tone === 'brand' && 'bg-brand',
      )}
    />
  );
}

// Page claire (catalogue de modules), comme la bibliothèque SimFlow : barre sombre en haut, fond beige.
export function PaperScreen({ header, title, description, children }: { header?: ReactNode; title?: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-ink">
      {header}
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-6 animate-fade-in">
        {title && (
          <div className="pb-2">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink">{title}</h1>
            {description && <p className="mt-1.5 text-base leading-relaxed text-ink-muted">{description}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
