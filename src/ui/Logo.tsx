import { cn } from './cn';

// Logo OPSFLOW, construit comme celui de SimFlow : pastille orange + « Ops » en Inter, « Flow » en JetBrains Mono.
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="7" fill="#f97316" />
      {/* « O » ouvert traversé par une veine d'air */}
      <path d="M22.4 11.2A7.6 7.6 0 1 0 22.4 20.8" fill="none" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M13 16h12.5M22 12.5l3.5 3.5-3.5 3.5" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ size = 'md', tone = 'dark', className }: { size?: 'sm' | 'md' | 'lg'; tone?: 'dark' | 'light'; className?: string }) {
  const mark = size === 'lg' ? 40 : size === 'sm' ? 26 : 32;
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)} aria-label="OpsFlow">
      <LogoMark size={mark} />
      <span
        className={cn(
          'leading-none tracking-tight',
          size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl',
          tone === 'dark' ? 'text-fg' : 'text-ink',
        )}
      >
        <span className="font-bold">Ops</span>
        <span className="font-mono font-medium">Flow</span>
      </span>
    </span>
  );
}
