import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from './cn';
import { IconButton } from './Button';

type ModalProps = {
  title: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
  footer?: ReactNode;
  tone?: 'default' | 'danger' | 'warn';
  children: ReactNode;
};

// Feuille modale : glissée depuis le bas sur téléphone (zone du pouce), centrée sur tablette.
export function Modal({ title, icon, onClose, footer, tone = 'default', children }: ModalProps) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div
        className={cn(
          'flex max-h-[92dvh] w-full flex-col rounded-t-3xl border bg-panel animate-fade-in sm:max-w-md sm:rounded-3xl',
          tone === 'default' && 'border-surface',
          tone === 'danger' && 'border-danger/70',
          tone === 'warn' && 'border-warn/70',
        )}
      >
        <div className="flex items-center gap-3 border-b border-surface px-5 py-4">
          {icon && <span className="shrink-0">{icon}</span>}
          <h2 className="flex-1 text-lg font-semibold text-fg">{title}</h2>
          {onClose && (
            <IconButton label="Fermer" onClick={onClose}>
              <X size={20} />
            </IconButton>
          )}
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 hide-scrollbar">{children}</div>
        {footer && <div className="border-t border-surface px-5 pt-4 pb-safe">{footer}</div>}
      </div>
    </div>
  );
}

// Bandeau de notification temporaire, en haut de l'écran.
export function Toast({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'ok' | 'danger' }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex justify-center px-4 pt-safe" role="status" aria-live="assertive">
      <div
        className={cn(
          'mt-2 w-full max-w-md rounded-xl px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide text-canvas shadow-lg animate-fade-in',
          tone === 'brand' && 'bg-brand',
          tone === 'ok' && 'bg-ok',
          tone === 'danger' && 'bg-danger',
        )}
      >
        {children}
      </div>
    </div>
  );
}
