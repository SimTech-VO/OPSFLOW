import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { CheckSquare, Minus, Plus, Square } from 'lucide-react';
import { cn } from './cn';

type Tone = 'brand' | 'ok' | 'danger' | 'sky' | 'warn' | 'light';

const SELECTED: Record<Tone, string> = {
  brand: 'bg-brand border-brand text-white',
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

// Option d'un choix exclusif (style barre d'outils SimFlow) : 48 px minimum.
export function Choice({ selected, tone = 'brand', className, children, type = 'button', ...rest }: ChoiceProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'min-h-12 rounded-lg border-2 px-3 py-2 text-[15px] font-semibold transition-colors',
        'disabled:opacity-35 disabled:pointer-events-none',
        selected ? SELECTED[tone] : 'border-transparent bg-surface text-fg hover:bg-surface-hi',
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
    'flex shrink-0 items-center justify-center rounded-lg bg-surface text-fg transition-colors hover:bg-surface-hi active:bg-surface-hi',
    size === 'lg' ? 'h-14 w-14' : 'h-12 w-12',
  );
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label={`Diminuer ${label}`} onClick={onDecrement} className={btn}>
        <Minus size={22} />
      </button>
      <div className={cn('flex flex-1 items-center justify-center gap-1 overflow-hidden rounded-lg border border-surface bg-canvas', size === 'lg' ? 'h-14' : 'h-12')}>
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
        'flex min-h-14 w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors',
        checked ? 'border-ok bg-ok/10' : 'border-transparent bg-surface hover:bg-surface-hi',
      )}
    >
      <span className={checked ? 'text-ok' : 'text-fg-subtle'}>{icon ?? (checked ? <CheckSquare size={22} /> : <Square size={22} />)}</span>
      <span className="flex-1">
        <span className="block text-[15px] font-semibold text-fg">{label}</span>
        {hint && <span className="mt-0.5 block text-sm text-fg-muted">{hint}</span>}
      </span>
      {icon && <span className={checked ? 'text-ok' : 'text-fg-subtle'}>{checked ? <CheckSquare size={22} /> : <Square size={22} />}</span>}
    </button>
  );
}

type LibraryCardProps = {
  category: string;
  categoryIcon: ReactNode;
  dot?: 'danger' | 'brand' | 'sky' | 'ok';
  title: string;
  description: string;
  action: string;
  actionIcon?: ReactNode;
  onAction: () => void;
  primary?: boolean;
  highlighted?: boolean;
  footnote?: ReactNode;
};

// Carte de module sur page claire, construite comme les cartes « Mission » de la bibliothèque SimFlow.
export function LibraryCard({ category, categoryIcon, dot = 'danger', title, description, action, actionIcon, onAction, primary, highlighted, footnote = 'OpsFlow' }: LibraryCardProps) {
  return (
    <article className={cn('flex flex-col gap-3 rounded-xl border bg-paper-card p-5', highlighted ? 'border-brand/70' : 'border-paper-line')}>
      <p className="flex items-center gap-2 text-sm text-ink-muted">
        <span className="text-ink-muted">{categoryIcon}</span>
        <span
          aria-hidden
          className={cn(
            'h-2 w-2 rounded-full',
            dot === 'danger' && 'bg-danger',
            dot === 'brand' && 'bg-brand',
            dot === 'sky' && 'bg-sky',
            dot === 'ok' && 'bg-ok',
          )}
        />
        {category}
      </p>
      <div>
        <h2 className="text-xl font-semibold leading-snug text-ink">{title}</h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">{description}</p>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onAction}
          className={cn(
            'inline-flex min-h-12 items-center gap-2 rounded-lg px-4 text-[15px] font-semibold transition-colors',
            primary ? 'bg-brand text-white hover:bg-brand-hover' : 'bg-paper-btn text-ink hover:brightness-95',
          )}
        >
          {actionIcon}
          {action}
        </button>
        <span className="text-sm text-ink-muted">{footnote}</span>
      </div>
    </article>
  );
}
