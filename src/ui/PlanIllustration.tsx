import { cn } from './cn';

// Plan schématique d'un pavillon ventilé en VPP, dans le style des illustrations SimFlow :
// murs en traits fins, veine d'air en bleu ciel, foyer orange, libellés en JetBrains Mono.
export function PlanIllustration({ caption, time, className }: { caption: string; time?: string; className?: string }) {
  const wall = { stroke: '#a1a1aa', strokeWidth: 2, strokeLinecap: 'square' as const };
  const label = { fill: '#a1a1aa', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 };
  return (
    <figure className={cn('m-0 overflow-hidden rounded-xl border border-surface bg-canvas', className)}>
      <svg viewBox="0 0 360 210" className="block h-auto w-full" role="img" aria-label="Plan schématique : ventilateur à l'entrée, veine d'air vers le foyer et le sortant">
        <defs>
          <pattern id="opsflow-grid" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M18 0H0V18" fill="none" stroke="#18181b" strokeWidth="1" />
          </pattern>
          <radialGradient id="opsflow-glow">
            <stop offset="0" stopColor="#f97316" stopOpacity="0.45" />
            <stop offset="1" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="360" height="210" fill="url(#opsflow-grid)" />
        <circle cx="286" cy="62" r="54" fill="url(#opsflow-glow)" />

        {/* Murs extérieurs, avec l'entrée (gauche) et le sortant (droite) */}
        <path d="M74 22H330V54M330 82V184H74V142M74 118V22" fill="none" {...wall} />
        {/* Cloisons */}
        <path d="M156 22V62M156 86V108H74" fill="none" {...wall} />
        <path d="M244 22V44M244 70V108H186" fill="none" {...wall} />
        <path d="M200 108V150M200 170V184" fill="none" {...wall} />
        <path d="M244 108H330" fill="none" {...wall} />
        {/* Ouvrant du sortant */}
        <path d="M330 54V82" stroke="#f59e0b" strokeWidth="3" />
        <path d="M334 62L356 58M334 74L356 74" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="3 3" />

        {/* Veine d'air depuis le ventilateur */}
        <g fill="none" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round">
          <path d="M50 126C120 126 150 124 186 96S246 66 278 64" />
          <path d="M50 131C124 131 156 128 192 100S250 71 278 70" opacity="0.75" />
          <path d="M50 136C128 136 162 132 198 104S254 76 278 76" opacity="0.5" />
        </g>
        <path d="M272 59L280 64L272 69" fill="none" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="38" cy="131" r="10" fill="#09090b" stroke="#38bdf8" strokeWidth="2" />
        <path d="M34 127L43 131L34 135Z" fill="#38bdf8" />

        <circle cx="290" cy="64" r="5.5" fill="#f97316" />
        <text x="22" y="160" {...label}>VPP</text>
        <text x="262" y="96" {...label}>FOYER</text>
        <text x="276" y="40" {...label}>SORTANT</text>
      </svg>
      <figcaption className="flex items-center justify-between gap-3 border-t border-surface px-4 py-2.5 font-mono text-xs text-fg-muted">
        <span className="truncate uppercase tracking-wider">{caption}</span>
        {time && <span className="shrink-0 tabular">t = {time}</span>}
      </figcaption>
    </figure>
  );
}
