import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

// Boutons au style SimFlow : orange plein pour l'action principale, gris sombre pour le reste.
const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-hover active:bg-brand-hover',
  secondary: 'bg-surface text-fg hover:bg-surface-hi active:bg-surface-hi',
  ghost: 'text-fg-muted hover:text-fg hover:bg-surface active:bg-surface',
  success: 'bg-ok text-canvas hover:bg-ok-strong active:bg-ok-strong',
  danger: 'bg-danger text-canvas hover:brightness-110 active:brightness-95',
  warn: 'bg-warn text-canvas hover:brightness-110 active:brightness-95',
  'soft-success': 'bg-ok/10 text-ok border-2 border-ok/60 hover:bg-ok/15',
  'soft-danger': 'bg-danger/10 text-danger border-2 border-danger/60 hover:bg-danger/15',
  'soft-warn': 'bg-warn/10 text-warn border-2 border-warn/60 hover:bg-warn/15',
  'soft-sky': 'bg-sky/10 text-sky border-2 border-sky/50 hover:bg-sky/15',
  // Sur les pages claires (catalogue)
  'paper-secondary': 'bg-paper-btn text-ink hover:brightness-95 active:brightness-90',
} as const;

// Hauteurs minimales : 48 px (md), 56 px (lg), 64 px (xl) pour l'usage avec gants.
const SIZES = {
  md: 'min-h-12 px-4 text-[15px]',
  lg: 'min-h-14 px-3 text-base',
  xl: 'min-h-16 px-6 text-lg',
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
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold leading-tight transition-colors select-none',
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

// Bouton icône de 48 px, gris sombre comme la barre d'outils SimFlow.
export function IconButton({ label, tone = 'default', className, children, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface transition-colors',
        'hover:bg-surface-hi active:bg-surface-hi',
        tone === 'default' && 'text-fg',
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
