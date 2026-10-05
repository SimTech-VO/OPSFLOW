import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, ShieldAlert, Settings, AlertTriangle, Database, Calculator, Square, Circle, BoxSelect, Clock,
} from 'lucide-react';
import { loadPersistedState, STORAGE_KEYS } from '../../lib/storage';
import { formatInt } from '../../lib/format';
import { Badge, Button, Choice, Overline, Panel, Screen, ScreenHeader, Stat, StatTile, Stepper, StepperValue } from '../../ui';
import {
  applicationDuration, computeNeeds, EXTINCTION_RATE, isDoctrineRate, referenceRate,
  type ActionType, type FireType, type RiskLevel,
} from './doctrine';

// Champ de dimension en mètres
const DimensionField = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-medium text-fg-muted">{label}</span>
    <span className="flex h-14 items-center rounded-xl border-2 border-surface bg-canvas focus-within:border-brand">
      <input
        type="number"
        inputMode="decimal"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value.replace(',', '.')) || 0)}
        onFocus={(e) => e.target.select()}
        className="h-full w-full min-w-0 flex-1 bg-transparent px-4 font-mono text-2xl font-bold tabular text-fg outline-none placeholder:text-fg-subtle"
        placeholder="0"
      />
      <span className="pr-4 font-mono text-base text-fg-muted">m</span>
    </span>
  </label>
);

// ==========================================
// MODULE 3 : CALCULATEUR SURFACE & MOYENS
// ==========================================
export function SurfaceApp({ onBack, onHome }: { onBack: () => void, onHome: () => void }) {
  const savedState = React.useRef(loadPersistedState(STORAGE_KEYS.surfaceState)).current;
  const [shape, setShape] = useState<'rect' | 'circle'>(savedState?.shape || 'rect');
  const [dim1, setDim1] = useState<number>(() => { const v = savedState?.dim1; return (typeof v === 'number' && isFinite(v)) ? v : 0; });
  const [dim2, setDim2] = useState<number>(() => { const v = savedState?.dim2; return (typeof v === 'number' && isFinite(v)) ? v : 0; });

  // Doctrine d'emploi des additifs
  const [fireType, setFireType] = useState<FireType>(savedState?.fireType || 'hydro');
  const [actionType, setActionType] = useState<ActionType>(savedState?.actionType || 'extinction');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(savedState?.riskLevel === 'particulier' ? 'particulier' : 'courant');
  const [product, setProduct] = useState<'biofor' | 'ecopol'>(savedState?.product || 'biofor');
  const [rate, setRate] = useState<number>(() => { const v = savedState?.rate; return (typeof v === 'number' && isFinite(v)) ? v : referenceRate('hydro', 'extinction', 'courant'); });
  const [solidConcentration, setSolidConcentration] = useState<number>(() => { const v = savedState?.solidConcentration; return (typeof v === 'number' && isFinite(v)) ? v : 0.5; });

  // Extinction sur 20 min, temporisation sur 40 min
  const duration = applicationDuration(actionType);

  // Persistance de l'état
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.surfaceState, JSON.stringify({
      shape, dim1, dim2, fireType, actionType, riskLevel, product, rate, solidConcentration
    }));
  }, [shape, dim1, dim2, fireType, actionType, riskLevel, product, rate, solidConcentration]);

  // Additif imposé et taux de référence selon la nature du feu et le mode d'action.
  // Exécuté aussi au montage : un taux enregistré par une version antérieure est remplacé par la référence.
  useEffect(() => {
    if (fireType === 'solid') {
      setActionType('wetting');
      setProduct('biofor');
    } else if (actionType === 'wetting') {
      setProduct('biofor'); // Mouillant = Bio For N uniquement
    } else if (fireType === 'polar') {
      setProduct('ecopol'); // Polaire = Ecopol uniquement
    }
    setRate(referenceRate(fireType, actionType, riskLevel));
  }, [fireType, actionType, riskLevel]);

  // Calcul Concentration
  let concentration = 1;
  if (fireType === 'solid') {
    concentration = solidConcentration;
  } else if (actionType === 'wetting') {
    concentration = 0.5; // Mouillant 0.5% par défaut
  } else {
    // Extinction ou temporisation
    concentration = product === 'ecopol' ? 3 : 1;
  }

  const surface = shape === 'rect' ? dim1 * dim2 : Math.PI * Math.pow(dim1 / 2, 2);
  const needs = computeNeeds({ surface, rate, concentration, duration });
  const refRate = referenceRate(fireType, actionType, riskLevel);
  const fromDoctrine = isDoctrineRate(fireType, actionType);

  // Capacités des engins
  const vehicles = [
    { name: "CCRM Gallin", water: 2500, foam: { biofor: 140, ecopol: 0 } },
    { name: "FPT", water: 3000, foam: { biofor: 200, ecopol: 0 } },
    { name: "CCFM Renault", water: 3500, foam: { biofor: 60, ecopol: 0 } },
    { name: "FMOGP", water: 12000, foam: { biofor: 200, ecopol: 2000 } },
  ];

  const capableVehicles = vehicles.filter(v => {
    const foamCapacity = v.foam[product as keyof typeof v.foam] || 0;
    return v.water >= needs.waterVolume && foamCapacity >= needs.concentrateVolume;
  });

  const polarFoam = fireType === 'polar' && actionType !== 'wetting';
  const ecopolDisabled = actionType === 'wetting' || fireType === 'solid';

  return (
    <Screen header={<ScreenHeader overline="Aide à la décision" title="Planificateur" onBack={onBack} onHome={onHome} />}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Section 1 : Géométrie */}
        <Panel title="1. Géométrie" icon={<BoxSelect size={18} className="text-brand-light" />}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Choice selected={shape === 'rect'} className="flex items-center justify-center gap-2" onClick={() => setShape('rect')}><Square size={16} /> Rectangle</Choice>
              <Choice selected={shape === 'circle'} className="flex items-center justify-center gap-2" onClick={() => setShape('circle')}><Circle size={16} /> Circulaire</Choice>
            </div>
            <DimensionField label={shape === 'rect' ? 'Longueur (L)' : 'Diamètre (D)'} value={dim1} onChange={setDim1} />
            {shape === 'rect' && <DimensionField label="Largeur (l)" value={dim2} onChange={setDim2} />}
            <div className="flex items-end justify-between border-t border-surface pt-4">
              <Overline tone="muted">Surface totale</Overline>
              <span className="font-mono text-4xl font-bold tabular text-fg">{formatInt(surface)}<span className="ml-1 text-lg font-medium text-fg-muted">m²</span></span>
            </div>
          </div>
        </Panel>

        {/* Section 2 : Tactique */}
        <Panel title="2. Tactique" icon={<Settings size={18} className="text-brand-light" />}>
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-fg-muted">Nature du feu</p>
              <div className="grid grid-cols-2 gap-2">
                <Choice selected={fireType === 'hydro'} onClick={() => setFireType('hydro')}>Hydrocarbure</Choice>
                <Choice selected={fireType === 'polar'} onClick={() => setFireType('polar')}>Liquide polaire</Choice>
                <Choice selected={fireType === 'solid'} className="col-span-2" onClick={() => setFireType('solid')}>Feu de type A (solide)</Choice>
              </div>
            </div>

            {fireType === 'solid' ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-fg-muted">Niveau de risque</p>
                <div className="grid grid-cols-2 gap-2">
                  <Choice selected={riskLevel === 'courant'} className="flex flex-col items-center leading-tight" onClick={() => setRiskLevel('courant')}>
                    <span>Risque courant</span>
                    <span className="font-mono text-xs opacity-80">1 L/min/m²</span>
                  </Choice>
                  <Choice selected={riskLevel === 'particulier'} className="flex flex-col items-center leading-tight" onClick={() => setRiskLevel('particulier')}>
                    <span>Risque particulier</span>
                    <span className="font-mono text-xs opacity-80">2 L/min/m²</span>
                  </Choice>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-fg-muted">Mode d'action</p>
                <div className="grid grid-cols-2 gap-2">
                  <Choice selected={actionType === 'extinction'} className="flex flex-col items-center leading-tight" onClick={() => setActionType('extinction')}>
                    <span>Extinction</span>
                    <span className="font-mono text-xs opacity-80">20 min</span>
                  </Choice>
                  <Choice selected={actionType === 'temporisation'} className="flex flex-col items-center leading-tight" onClick={() => setActionType('temporisation')}>
                    <span>Temporisation</span>
                    <span className="font-mono text-xs opacity-80">Ta / 2 · 40 min</span>
                  </Choice>
                  <Choice selected={actionType === 'wetting'} className="col-span-2" onClick={() => setActionType('wetting')}>Mouillant</Choice>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-fg-muted">Additif & concentration</p>
              <div className="grid grid-cols-2 gap-2">
                <Choice selected={product === 'biofor'} disabled={polarFoam} className="flex flex-col items-center leading-tight" onClick={() => setProduct('biofor')}>
                  <span>Bio For N</span>
                  <span className="font-mono text-xs opacity-80">{fireType === 'solid' ? `${solidConcentration}%` : (actionType === 'wetting' ? '0.5%' : '1%')}</span>
                </Choice>
                <Choice selected={product === 'ecopol'} disabled={ecopolDisabled} className="flex flex-col items-center leading-tight" onClick={() => setProduct('ecopol')}>
                  <span>Ecopol Premium</span>
                  <span className="font-mono text-xs opacity-80">3%</span>
                </Choice>
              </div>

              {/* Concentration du mouillant pour feu de classe A */}
              {fireType === 'solid' && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-fg-muted">Concentration mouillant</span>
                    <span className="font-mono text-sm font-bold text-fg">{solidConcentration}%</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0.1, 0.3, 0.5, 0.7, 1.0].map(c => (
                      <Choice key={c} selected={solidConcentration === c} className="px-1 font-mono" onClick={() => setSolidConcentration(c)}>{c}%</Choice>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-surface pt-4">
              <p className="text-sm font-medium text-fg-muted">Taux d'application</p>
              <Stepper label="le taux d'application" onDecrement={() => setRate(Math.max(1, rate - 0.5))} onIncrement={() => setRate(Math.min(10, rate + 0.5))}>
                <StepperValue value={rate} unit="L/m²/min" />
              </Stepper>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={rate}
                aria-label="Taux d'application"
                onInput={(e) => setRate(parseFloat((e.target as HTMLInputElement).value))}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="h-10 w-full cursor-pointer accent-brand"
              />
              <div className="flex min-h-12 items-center justify-between gap-3">
                <p className="text-sm text-fg-muted">
                  {fromDoctrine ? 'Référence FOD' : 'Valeur par défaut'} : <span className="font-mono font-bold text-fg">{refRate}</span> L/min/m²
                  {rate !== refRate && <span className="block text-warn">Taux modifié manuellement</span>}
                </p>
                {rate !== refRate && <Button size="md" variant="secondary" onClick={() => setRate(refRate)}>Rétablir</Button>}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-surface bg-canvas px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-fg-muted"><Clock size={16} /> Durée d'application</span>
              <span className="font-mono text-base font-bold text-fg">{duration} min</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* Section 3 : Résultats / Moyens */}
      <Panel title={`3. Moyens requis (${duration} min)`} icon={<Calculator size={18} className="text-brand-light" />}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <StatTile tone="brand" className="gap-2 py-6">
            <Stat label="Débit de solution requis" value={formatInt(needs.solutionFlow)} unit="L/min" size="lg" />
            <p className="text-sm text-fg-muted">
              Pour {formatInt(surface)} m² • {product === 'biofor' ? 'Bio For N' : 'Ecopol'} ({concentration}%)
            </p>
            <p className="text-sm text-fg-muted">dont eau : <span className="font-mono font-bold text-sky">{formatInt(needs.waterFlow)} L/min</span></p>
          </StatTile>

          <dl className="flex flex-col justify-center gap-3">
            <div className="flex items-center justify-between border-b border-surface pb-3">
              <dt className="text-sm font-medium text-fg-muted">Volume de solution</dt>
              <dd className="font-mono text-2xl font-bold tabular text-fg">{formatInt(needs.solutionVolume)} L</dd>
            </div>
            <div className="flex items-center justify-between border-b border-surface pb-3">
              <dt className="text-sm font-medium text-fg-muted">dont eau</dt>
              <dd className="font-mono text-2xl font-bold tabular text-sky">{formatInt(needs.waterVolume)} L</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm font-medium text-fg-muted">Émulseur ({concentration}%)</dt>
              <dd className="font-mono text-2xl font-bold tabular text-brand-light">{formatInt(needs.concentrateVolume)} L</dd>
            </div>
          </dl>
        </div>

        {actionType === 'temporisation' && fireType !== 'solid' && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-warn/60 bg-warn/10 p-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warn" />
            <p className="text-sm text-fg">
              Temporisation : diminuer l'intensité du foyer en attendant le débit d'extinction de{' '}
              <span className="font-mono font-bold">{formatInt(surface * EXTINCTION_RATE[fireType])} L/min</span>.
            </p>
          </div>
        )}

        {/* Suggestion d'engins */}
        <div className="mt-5 space-y-3 border-t border-surface pt-4">
          <Overline tone="muted">Engins capables (autonomie complète)</Overline>
          {capableVehicles.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {capableVehicles.map((v, i) => (
                <div key={i} className="flex min-h-12 items-center gap-3 rounded-xl border border-ok/50 bg-ok/10 px-4">
                  <CheckCircle2 size={18} className="text-ok" />
                  <span className="text-sm font-semibold text-fg">{v.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border-2 border-danger/60 bg-danger/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="mt-0.5 shrink-0 text-danger" />
                <span className="text-sm font-semibold text-fg">Aucun engin seul ne suffit. Attaque massive ou renforts requis.</span>
              </div>
              <div className="rounded-lg border border-danger/40 bg-canvas p-3">
                <Overline tone="danger" className="mb-1 flex items-center gap-2"><ShieldAlert size={14} /> Logistique additif</Overline>
                <p className="text-sm text-fg-muted">
                  Demander une <strong className="text-fg">CEMUL</strong> ou <strong className="text-fg">STEM</strong> pour l'acheminement de bidons supplémentaires.
                </p>
              </div>
            </div>
          )}
        </div>
      </Panel>

      {/* Référentiel capacités engins */}
      <Panel title="Référentiel capacités engins" icon={<Database size={18} className="text-fg-muted" />}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-surface bg-canvas p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-fg">FPT</span>
              <Badge tone="sky">3000 L eau</Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-fg-muted">Bio For N</span>
                <span className="font-mono font-bold text-brand-light">200 L</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-fg-muted">Ecopol</span>
                <span className="font-mono text-fg-muted">aucun</span>
              </div>
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-surface bg-canvas p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-fg">FMOGP</span>
              <Badge tone="sky">12000 L eau</Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-fg-muted">Bio For N</span>
                <span className="font-mono font-bold text-brand-light">200 L</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-fg-muted">Ecopol</span>
                <span className="font-mono font-bold text-brand-light">2000 L</span>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </Screen>
  );
}
