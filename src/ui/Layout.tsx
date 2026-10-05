import type { ReactNode } from 'react';
import { ChevronLeft, Home } from 'lucide-react';
import { cn } from './cn';
import { IconButton } from './Button';

// Sur-titre technique : JetBrains Mono, capitales, orange clair.
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

// En-tête fixe : retour à gauche, titre, actions à droite.
export function ScreenHeader({ title, overline, onBack, onHome, actions, status }: ScreenHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-surface bg-canvas pt-safe">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 pb-3">
        {onBack && (
          <IconButton label="Retour" onClick={onBack}>
            <ChevronLeft size={24} />
          </IconButton>
        )}
        <div className="min-w-0 flex-1">
          {overline && <Overline className="truncate">{overline}</Overline>}
          <div className="flex items-center gap-2">
            {status}
            <h1 className="truncate text-xl font-semibold tracking-tight text-fg">{title}</h1>
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
        <div className="sticky bottom-0 z-30 border-t border-surface bg-canvas pb-safe">
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

// Panneau de contenu : fond secondaire, bordure grise, titre en sur-titre.
export function Panel({ title, icon, aside, tone = 'default', className, children }: PanelProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border p-4',
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
            {typeof title === 'string' ? <Overline tone="muted">{title}</Overline> : title}
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
