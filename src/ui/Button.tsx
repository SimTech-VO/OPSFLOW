import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

// Les fonds colorés portent toujours un texte sombre (#09090b) : le blanc
// sur orange ne dépasse pas 2,7:1, illisible en plein soleil.
const VARIANTS = {
  primary: 'bg-brand text-canvas hover:bg-brand-hover active:bg-brand-hover',
  secondary: 'bg-panel text-fg border border-surface hover:border-fg-subtle active:bg-surface',
  ghost: 'text-fg-muted hover:text-fg hover:bg-panel active:bg-surface',
  success: 'bg-ok text-canvas hover:bg-ok-strong active:bg-ok-strong',
  danger: 'bg-danger text-canvas hover:brightness-110 active:brightness-95',
  warn: 'bg-warn text-canvas hover:brightness-110 active:brightness-95',
  'soft-success': 'bg-ok/10 text-ok border-2 border-ok/60 hover:bg-ok/15',
  'soft-danger': 'bg-danger/10 text-danger border-2 border-danger/60 hover:bg-danger/15',
  'soft-warn': 'bg-warn/10 text-warn border-2 border-warn/60 hover:bg-warn/15',
  'soft-sky': 'bg-sky/10 text-sky border-2 border-sky/50 hover:bg-sky/15',
} as const;

// Hauteurs minimales : 48 px (md), 56 px (lg), 72 px (xl) pour l'usage avec gants.
// Le format xl (action principale pleine largeur) passe en capitales.
const SIZES = {
  md: 'min-h-12 px-3 text-sm',
  lg: 'min-h-14 px-4 text-base',
  xl: 'min-h-18 px-6 text-lg uppercase tracking-wide',
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: keyof typeof SIZES;
  block?: boolean;
  icon?: ReactNode;
};

export function Button({ variant = 'secondary', size = 'lg', block, icon, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold leading-tight transition-colors select-none',
        'disabled:opacity-40 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: 'default' | 'brand' | 'ok';
};

// Bouton icône carré de 48 px, avec libellé accessible obligatoire.
export function IconButton({ label, tone = 'default', className, children, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-surface bg-panel transition-colors',
        'hover:border-fg-subtle active:bg-surface',
        tone === 'default' && 'text-fg-muted hover:text-fg',
        tone === 'brand' && 'text-brand-light',
        tone === 'ok' && 'text-ok',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
