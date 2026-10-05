import type { ReactNode } from 'react';
import { cn } from './cn';

type StatTone = 'fg' | 'brand' | 'ok' | 'danger' | 'warn' | 'sky' | 'muted';

const TONE_TEXT: Record<StatTone, string> = {
  fg: 'text-fg',
  brand: 'text-brand-light',
  ok: 'text-ok',
  danger: 'text-danger',
  warn: 'text-warn',
  sky: 'text-sky',
  muted: 'text-fg-muted',
};

type StatProps = {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  tone?: StatTone;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'left' | 'center';
  footer?: ReactNode;
  className?: string;
};

// Valeur chiffrée : libellé en mono, valeur en JetBrains Mono à chasse fixe.
export function Stat({ label, value, unit, tone = 'fg', size = 'md', align = 'center', footer, className }: StatProps) {
  return (
    <div className={cn('flex flex-col gap-1', align === 'center' ? 'items-center text-center' : 'items-start text-left', className)}>
      <span className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-fg-muted">{label}</span>
      <span
        className={cn(
          'font-mono font-bold leading-none tabular tracking-tight',
          TONE_TEXT[tone],
          size === 'sm' && 'text-xl',
          size === 'md' && 'text-3xl',
          size === 'lg' && 'text-5xl',
          size === 'xl' && 'text-6xl sm:text-7xl',
        )}
      >
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-fg-muted">{unit}</span>}
      </span>
      {footer}
    </div>
  );
}

// Tuile encadrée contenant une Stat.
export function StatTile({ tone = 'default', className, children }: { tone?: 'default' | 'danger' | 'brand' | 'ok' | 'warn'; className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border p-4',
        tone === 'default' && 'border-surface bg-panel',
        tone === 'danger' && 'border-danger bg-danger/10',
        tone === 'brand' && 'border-brand/50 bg-brand/10',
        tone === 'ok' && 'border-ok/50 bg-ok/10',
        tone === 'warn' && 'border-warn/60 bg-warn/10',
        className,
      )}
    >
      {children}
    </div>
  );
}

// Étiquette courte (unité, facteur limitant, état).
export function Badge({ tone = 'muted', icon, children }: { tone?: 'muted' | 'danger' | 'brand' | 'ok' | 'sky' | 'warn'; icon?: ReactNode; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-wider',
        tone === 'muted' && 'bg-surface text-fg-muted',
        tone === 'danger' && 'bg-danger text-canvas',
        tone === 'brand' && 'bg-brand/15 text-brand-light',
        tone === 'ok' && 'bg-ok/15 text-ok',
        tone === 'sky' && 'bg-sky/15 text-sky',
        tone === 'warn' && 'bg-warn/15 text-warn',
      )}
    >
      {icon}
      {children}
    </span>
  );
}

// Jauge verticale segmentée (réserves eau / émulseur).
export function SegmentedGauge({ value, max, color = 'sky' }: { value: number; max: number; color?: 'sky' | 'ok' | 'brand' | 'danger' }) {
  const safeValue = isNaN(value) ? 0 : value;
  const safeMax = isNaN(max) || max === 0 ? 1 : max;
  const percent = Math.max(0, Math.min(100, (safeValue / safeMax) * 100));
  const segments = 12;
  const activeSegments = Math.round((percent / 100) * segments);
  const colors = {
    sky: 'bg-sky',
    ok: 'bg-ok',
    brand: 'bg-brand-light',
    danger: 'bg-danger',
  };

  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      className="flex h-full w-full flex-col-reverse gap-1 rounded-xl border border-surface bg-canvas p-1.5"
    >
      {[...Array(segments)].map((_, i) => (
        <div key={i} className={cn('flex-1 rounded-[2px] transition-colors duration-500', i < activeSegments ? colors[color] : 'bg-surface')} />
      ))}
    </div>
  );
}
