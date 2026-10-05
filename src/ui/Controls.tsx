import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { CheckSquare, ChevronRight, Minus, Plus, Square } from 'lucide-react';
import { cn } from './cn';

type Tone = 'brand' | 'ok' | 'danger' | 'sky' | 'warn' | 'light';

const SELECTED: Record<Tone, string> = {
  brand: 'bg-brand border-brand text-canvas',
  ok: 'bg-ok border-ok text-canvas',
  danger: 'bg-danger border-danger text-canvas',
  sky: 'bg-sky border-sky text-canvas',
  warn: 'bg-warn border-warn text-canvas',
  light: 'bg-fg border-fg text-canvas',
};

type ChoiceProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected: boolean;
  tone?: Tone;
};

// Option d'un choix exclusif (préréglage, taux, mode…) : 48 px minimum.
export function Choice({ selected, tone = 'brand', className, children, type = 'button', ...rest }: ChoiceProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'min-h-12 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors',
        'disabled:opacity-35 disabled:pointer-events-none',
        selected ? SELECTED[tone] : 'border-surface bg-canvas text-fg hover:border-fg-subtle',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

type StepperProps = {
  onDecrement: () => void;
  onIncrement: () => void;
  children: ReactNode;
  label: string;
  size?: 'md' | 'lg';
};

// Réglage −/+ avec valeur centrale (affichage ou champ de saisie).
export function Stepper({ onDecrement, onIncrement, children, label, size = 'lg' }: StepperProps) {
  const btn = cn(
    'flex shrink-0 items-center justify-center rounded-xl border border-surface bg-surface text-fg transition-colors hover:border-fg-subtle active:bg-canvas',
    size === 'lg' ? 'h-14 w-14' : 'h-12 w-12',
  );
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label={`Diminuer ${label}`} onClick={onDecrement} className={btn}>
        <Minus size={22} />
      </button>
      <div className={cn('flex flex-1 items-center justify-center gap-1 overflow-hidden rounded-xl border border-surface bg-canvas', size === 'lg' ? 'h-14' : 'h-12')}>
        {children}
      </div>
      <button type="button" aria-label={`Augmenter ${label}`} onClick={onIncrement} className={btn}>
        <Plus size={22} />
      </button>
    </div>
  );
}

// Valeur numérique dans un Stepper, avec unité.
export function StepperValue({ value, unit }: { value: ReactNode; unit?: string }) {
  return (
    <span className="font-mono text-2xl font-bold tabular text-fg">
      {value}
      {unit && <span className="ml-1 text-sm font-medium text-fg-muted">{unit}</span>}
    </span>
  );
}

type CheckRowProps = {
  checked: boolean;
  onToggle: () => void;
  label: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
};

// Ligne de liste de contrôle : toute la ligne est cliquable.
export function CheckRow({ checked, onToggle, label, hint, icon }: CheckRowProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        'flex min-h-14 w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors',
        checked ? 'border-ok bg-ok/10' : 'border-surface bg-canvas hover:border-fg-subtle',
      )}
    >
      <span className={checked ? 'text-ok' : 'text-fg-subtle'}>{icon ?? (checked ? <CheckSquare size={22} /> : <Square size={22} />)}</span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-fg">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-fg-muted">{hint}</span>}
      </span>
      {icon && <span className={checked ? 'text-ok' : 'text-fg-subtle'}>{checked ? <CheckSquare size={22} /> : <Square size={22} />}</span>}
    </button>
  );
}

type NavCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  accent?: 'brand' | 'sky' | 'muted';
  compact?: boolean;
};

// Tuile de navigation (menus) : grande cible tactile, icône, titre et description.
export function NavCard({ title, description, icon, onClick, accent = 'brand', compact }: NavCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-4 rounded-2xl border border-surface bg-panel text-left transition-colors hover:border-fg-subtle active:bg-surface',
        compact ? 'min-h-18 p-3' : 'min-h-24 p-4',
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl',
          compact ? 'h-12 w-12' : 'h-14 w-14',
          accent === 'brand' && 'bg-brand text-canvas',
          accent === 'sky' && 'bg-sky text-canvas',
          accent === 'muted' && 'bg-surface text-fg',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block font-semibold text-fg', compact ? 'text-base' : 'text-lg')}>{title}</span>
        <span className="mt-0.5 block text-sm text-fg-muted">{description}</span>
      </span>
      <ChevronRight className="shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5" size={22} />
    </button>
  );
}
