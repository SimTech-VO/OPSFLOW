import React, { useState, useEffect } from 'react';
import {
  Flame, Droplets, RefreshCcw, CheckCircle2, Pause, Play, RotateCcw, Database, Crosshair, Activity,
  Settings, Wind, Thermometer, AlertTriangle, ClipboardList, History, BoxSelect, Info, Download, Copy,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { loadPersistedState, STORAGE_KEYS } from '../../lib/storage';
import { copyText, downloadText, safeFormatTime } from '../../lib/format';
import {
  Badge, Button, Choice, IconButton, Modal, Overline, Panel, SegmentedGauge, Screen, ScreenHeader,
  Stat, StatTile, StatusDot, Stepper, StepperValue, Toast, useFlash,
} from '../../ui';

const PRESET_CONCENTRATIONS = [0.1, 0.5, 1, 3, 6];
const EXPANSION_RATES = [
  { label: 'Bas (Lance)', value: 10 },
  { label: 'Moyen (Lance)', value: 50 },
  { label: 'HF Batfan', value: 250 },
  { label: 'HF MT296', value: 800 }
];
const FLOW_PRESETS = [
  { label: 'Lance (Fût)', value: 250 },
  { label: 'Ventilateur', value: 300 },
  { label: 'Lance Canon', value: 1000 },
];

// Couleurs des graphiques : tokens de la charte (Recharts n'accepte pas les classes)
const CHART = { grid: '#27272a', tick: '#a1a1aa', water: '#38bdf8', foam: '#fb923c', panel: '#18181b' };

// Champ numérique intégré à un Stepper
const NumberField = ({ value, onChange, unit, label }: { value: number; onChange: (v: number) => void; unit: string; label: string }) => (
  <>
    <input
      type="number"
      inputMode="numeric"
      min="0"
      aria-label={label}
      value={value || ''}
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      onFocus={(e) => e.target.select()}
      className="h-full w-full min-w-0 flex-1 bg-transparent pl-6 text-center font-mono text-2xl font-bold tabular text-fg outline-none"
    />
    <span className="pr-4 font-mono text-sm text-fg-muted">{unit}</span>
  </>
);

// ==========================================
// MODULE 1 : CALCULATEUR MOUSSE
// ==========================================
export function FoamApp({ onBack, onHome }: { onBack: () => void, onHome: () => void }) {
  const savedState = React.useRef(loadPersistedState(STORAGE_KEYS.foamState)).current;
  const [mode, setMode] = useState<'setup' | 'operational' | 'report'>(savedState?.mode || 'setup');
  const [concentration, setConcentration] = useState(savedState?.concentration || 1);
  const [flowRate, setFlowRate] = useState(savedState?.flowRate || 300);
  const [expansionRate, setExpansionRate] = useState(savedState?.expansionRate || 250);
  const [elapsedSeconds, setElapsedSeconds] = useState(savedState?.elapsedSeconds || 0);
  const [cumulativeWater, setCumulativeWater] = useState(savedState?.cumulativeWater || 0);
  const [isTimerActive, setIsTimerActive] = useState(savedState?.isTimerActive || false);
  const [foamStartTime, setFoamStartTime] = useState<number | null>(savedState?.foamStartTime || null);
  const [emulseurType, setEmulseurType] = useState<'biofor' | 'ecopol'>(savedState?.emulseurType || 'ecopol');
  const [targetDecantation, setTargetDecantation] = useState<number>(savedState?.targetDecantation || 25);
  const [showCOSModal, setShowCOSModal] = useState(false);
  const [hasShown3MinWarning, setHasShown3MinWarning] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showDecantInfo, setShowDecantInfo] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [consumptionHistory, setConsumptionHistory] = useState<{ time: string, eau: number, mousse: number }[]>(savedState?.consumptionHistory || []);
  const [flash, showFlash] = useFlash();

  // Persistance de l'état
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.foamState, JSON.stringify({
      mode, concentration, flowRate, expansionRate, elapsedSeconds, cumulativeWater, isTimerActive, foamStartTime, consumptionHistory, emulseurType, targetDecantation, lastTimestamp: Date.now()
    }));
  }, [mode, concentration, flowRate, expansionRate, elapsedSeconds, cumulativeWater, isTimerActive, foamStartTime, consumptionHistory, emulseurType, targetDecantation]);

  const [stock, setStock] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.foamStock);
      let initialStock = { water: 3000, foam: 200, maxWater: 3000, maxFoam: 200, isWaterSupplied: false };

      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed && typeof parsed === 'object' &&
          typeof parsed.water === 'number' &&
          typeof parsed.foam === 'number' &&
          typeof parsed.maxWater === 'number' &&
          typeof parsed.maxFoam === 'number' &&
          typeof parsed.isWaterSupplied === 'boolean'
        ) {
          initialStock = parsed;
        }
      }

      // CATCH-UP LOGIC: Apply consumption during downtime if timer was active
      if (savedState?.isTimerActive && savedState?.timeDiff && savedState.timeDiff > 0) {
        const diff = savedState.timeDiff;
        const savedFlow = savedState.flowRate || 300;
        const savedConc = savedState.concentration || 1;

        const actualFoamFlow = (savedConc / 100) * savedFlow;
        const actualWaterFlow = savedFlow - actualFoamFlow;

        // Apply consumption
        initialStock.water = initialStock.isWaterSupplied ? initialStock.water : Math.max(0, initialStock.water - (actualWaterFlow * diff / 60));
        initialStock.foam = Math.max(0, initialStock.foam - (actualFoamFlow * diff / 60));
      }

      return initialStock;
    } catch (e) {
      console.error("Erreur chargement stock", e);
      return { water: 3000, foam: 200, maxWater: 3000, maxFoam: 200, isWaterSupplied: false };
    }
  });

  // Catch-up effect for cumulativeWater
  useEffect(() => {
    if (savedState?.isTimerActive && savedState?.timeDiff && savedState.timeDiff > 0) {
       const diff = savedState.timeDiff;
       const savedFlow = savedState.flowRate || 300;
       const savedConc = savedState.concentration || 1;
       const actualFoamFlow = (savedConc / 100) * savedFlow;
       const actualWaterFlow = savedFlow - actualFoamFlow;
       setCumulativeWater((prev: number) => prev + (actualWaterFlow * diff / 60));
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.foamStock, JSON.stringify(stock));
    } catch (e) {
      console.error("Erreur sauvegarde stock", e);
    }
  }, [stock]);

  const actualFoamFlow = (concentration / 100) * flowRate;
  const actualWaterFlow = flowRate - actualFoamFlow;

  // Calculs sécurisés
  const autonomyFoam = actualFoamFlow > 0 ? stock.foam / actualFoamFlow : Infinity;
  const autonomyWater = stock.isWaterSupplied ? Infinity : (actualWaterFlow > 0 ? stock.water / actualWaterFlow : Infinity);
  const limitingAutonomy = Math.min(autonomyFoam, autonomyWater);
  const limitingFactor = autonomyFoam < autonomyWater ? "ADDITIF" : "EAU";

  // Sécurisation de la production de mousse
  let totalFoamProduced = 0;
  if (flowRate > 0 && expansionRate > 0 && elapsedSeconds > 0) {
    totalFoamProduced = (flowRate * expansionRate * (elapsedSeconds / 60)) / 1000;
  }

  // Helper pour l'affichage sécurisé des nombres
  const safeFixed = (num: number, digits: number) => {
    if (!isFinite(num) || isNaN(num)) return "0";
    return num.toFixed(digits);
  };

  const decantationSeconds = (targetDecantation / 25) * (emulseurType === 'biofor' ? 2 : 30) * 60;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isTimerActive) {
      interval = setInterval(() => {
        setElapsedSeconds((s: number) => {
          const newS = s + 1;
          if (newS % 5 === 0) {
            setConsumptionHistory(prev => {
              const hist = [...prev, {
                time: safeFormatTime(newS),
                eau: Math.round(cumulativeWater + (actualWaterFlow / 60) * (newS - s)),
                mousse: Math.round((stock.maxFoam - stock.foam) + (actualFoamFlow / 60) * (newS - s))
              }];
              if (hist.length > 50) return hist.slice(hist.length - 50);
              return hist;
            });
          }
          return newS;
        });
        setCumulativeWater((prev: number) => prev + (actualWaterFlow / 60));
        setStock((prev: any) => ({
          ...prev,
          water: prev.isWaterSupplied ? prev.water : Math.max(0, prev.water - (actualWaterFlow / 60)),
          foam: Math.max(0, prev.foam - (actualFoamFlow / 60))
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, actualWaterFlow, actualFoamFlow, cumulativeWater, stock.maxFoam, stock.foam]);

  useEffect(() => {
    if (isTimerActive) {
      if (limitingAutonomy <= 0) {
        setIsTimerActive(false);
        if (!stock.isWaterSupplied) {
          setShowPauseModal(true);
        }
      } else if (limitingAutonomy <= 3 && !stock.isWaterSupplied && limitingFactor === 'EAU') {
        if (!hasShown3MinWarning) {
          setNotification("Attention 3min d'autonomie si pas d'alimentation de l'engin");
          setHasShown3MinWarning(true);
          setTimeout(() => setNotification(null), 5000);
        }
      }
    }
  }, [isTimerActive, limitingAutonomy, stock.isWaterSupplied, limitingFactor, hasShown3MinWarning]);

  useEffect(() => {
    if (stock.isWaterSupplied) {
      setHasShown3MinWarning(false);
    }
  }, [stock.isWaterSupplied]);

  const formatTime = (s: number) => {
    if (!isFinite(s) || isNaN(s)) return "∞";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const secs = Math.floor(s % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${secs}` : `${m}:${secs}`;
  };

  const generateFinalReport = () => {
    let report = `BILAN OPÉRATION MOUSSE\n\n`;
    if (foamStartTime) report += `DÉBUT PRODUCTION : ${new Date(foamStartTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n`;
    report += `DURÉE TOTALE : ${formatTime(elapsedSeconds)}\n`;
    report += `VOLUME EAU CONSOMMÉ : ${Math.round(cumulativeWater)} L\n`;
    report += `VOLUME ÉMULSEUR CONSOMMÉ : ${Math.round(stock.maxFoam - stock.foam)} L\n`;
    report += `VOLUME MOUSSE PRODUIT : ${safeFixed(totalFoamProduced, 1)} m³\n\n`;
    report += `PARAMÈTRES MOYENS :\n`;
    report += `- Débit Solution : ${flowRate} L/min\n`;
    report += `- Concentration : ${concentration}%\n`;
    report += `- Foisonnement : x${expansionRate}\n\n`;
    report += `STOCK RESTANT :\n`;
    report += `- Eau : ${stock.isWaterSupplied ? 'Alimenté' : Math.round(stock.water) + ' L'}\n`;
    report += `- Émulseur : ${Math.round(stock.foam)} L\n`;
    return report;
  };

  const generateCOSReport = () => {
    let report = `POINT DE SITUATION MOUSSE (COS)\n`;
    report += `HEURE : ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n`;
    if (foamStartTime) report += `DÉBUT PRODUCTION : ${new Date(foamStartTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n`;
    report += `\nFACTEUR LIMITANT : ${limitingFactor}\n`;
    report += `TEMPS AVANT RUPTURE : ${formatTime(limitingAutonomy * 60)}\n\n`;
    report += `CONSOMMATION :\n`;
    report += `- Eau : ${Math.round(actualWaterFlow)} L/min\n`;
    report += `- Émulseur : ${safeFixed(actualFoamFlow, 1)} L/min\n`;
    report += `- Production Mousse : ${safeFixed((flowRate * expansionRate) / 1000, 1)} m³/min\n\n`;
    report += `STOCK RESTANT :\n`;
    report += `- Eau : ${stock.isWaterSupplied ? 'Alimenté' : Math.round(stock.water) + ' L'}\n`;
    report += `- Émulseur : ${Math.round(stock.foam)} L\n`;
    return report;
  };

  const resetStock = () => setStock({ water: 3000, foam: 200, maxWater: 3000, maxFoam: 200, isWaterSupplied: false });
  const isCritical = limitingAutonomy < 1;

  let content: React.ReactNode;

  if (mode === 'setup') {
    content = (
      <Screen
        header={
          <ScreenHeader
            overline="Mousse · Réglages"
            title="Calcul mousse"
            onBack={onBack}
            onHome={onHome}
            actions={<IconButton label="Réinitialiser le stock" onClick={resetStock}><RefreshCcw size={20} /></IconButton>}
          />
        }
        footer={
          isTimerActive ? (
            <Button variant="success" size="xl" block icon={<CheckCircle2 />} onClick={() => setMode('operational')}>Valider & Retour</Button>
          ) : (
            <Button
              variant="primary"
              size="xl"
              block
              icon={<Flame />}
              onClick={() => {
                setMode('operational');
                setIsTimerActive(true);
                if (!foamStartTime) setFoamStartTime(Date.now());
                if (stock.isWaterSupplied) setStock((s: any) => ({ ...s, water: 3000 }));
              }}
            >
              Engager l'Attaque
            </Button>
          )
        }
      >
        {/* Aperçu en temps réel des performances */}
        <div className="grid grid-cols-2 gap-3">
          <StatTile>
            <Stat label="Autonomie estimée" value={formatTime(limitingAutonomy * 60)} size="md" />
          </StatTile>
          <StatTile>
            <Stat label="Production mousse" value={safeFixed((flowRate * expansionRate) / 1000, 1)} unit="m³/min" tone="brand" size="md" />
          </StatTile>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel title="Eau (hydraulique)" icon={<Droplets size={18} className="text-sky" />}>
            <div className="space-y-3">
              <Stepper
                label="la réserve d'eau"
                onDecrement={() => setStock((s: any) => ({...s, maxWater: Math.max(0, s.maxWater-100), water: Math.max(0, s.water-100)}))}
                onIncrement={() => setStock((s: any) => ({...s, maxWater: s.maxWater+100, water: s.water+100}))}
              >
                <NumberField label="Réserve d'eau en litres" value={stock.maxWater} unit="L" onChange={(val) => setStock((s: any) => ({...s, maxWater: val, water: val}))} />
              </Stepper>
              <div className="grid grid-cols-2 gap-2">
                <Choice selected={stock.maxWater === 3000} tone="sky" onClick={() => setStock((s: any) => ({...s, maxWater: 3000, water: 3000}))}>FPT (3000 L)</Choice>
                <Choice selected={stock.maxWater === 4000} tone="sky" onClick={() => setStock((s: any) => ({...s, maxWater: 4000, water: 4000}))}>CCF (4000 L)</Choice>
              </div>
              <div className="space-y-2 border-t border-surface pt-3">
                <p className="text-sm font-medium text-fg-muted">Engin alimenté ?</p>
                <div className="grid grid-cols-2 gap-2">
                  <Choice selected={stock.isWaterSupplied} tone="ok" onClick={() => setStock((s: any) => ({...s, isWaterSupplied: true, water: s.maxWater}))}>OUI</Choice>
                  <Choice selected={!stock.isWaterSupplied} tone="danger" onClick={() => setStock((s: any) => ({...s, isWaterSupplied: false, water: s.maxWater}))}>NON</Choice>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Additif" icon={<Database size={18} className="text-brand-light" />}>
            <div className="space-y-3">
              <Stepper
                label="la réserve d'additif"
                onDecrement={() => setStock((s: any) => ({...s, maxFoam: Math.max(0, s.maxFoam-10), foam: Math.max(0, s.foam-10)}))}
                onIncrement={() => setStock((s: any) => ({...s, maxFoam: s.maxFoam+10, foam: s.foam+10}))}
              >
                <NumberField label="Réserve d'additif en litres" value={stock.maxFoam} unit="L" onChange={(val) => setStock((s: any) => ({...s, maxFoam: val, foam: val}))} />
              </Stepper>
              <div className="grid grid-cols-2 gap-2">
                <Choice selected={emulseurType === 'biofor'} onClick={() => { setStock((s: any) => ({...s, maxFoam: 200, foam: 200})); setConcentration(1); setEmulseurType('biofor'); }}>Bio For N (FPT)</Choice>
                <Choice selected={emulseurType === 'ecopol'} onClick={() => { setStock((s: any) => ({...s, maxFoam: 300, foam: 300})); setConcentration(3); setEmulseurType('ecopol'); }}>Ecopol</Choice>
              </div>
              <div className="space-y-2 border-t border-surface pt-3">
                <p className="text-sm font-medium text-fg-muted">Taux d'injection</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {PRESET_CONCENTRATIONS.map(c => (
                    <Choice key={c} selected={concentration === c} className="px-1 font-mono" onClick={() => setConcentration(c)}>{c}%</Choice>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <Panel>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Overline tone="muted" className="flex items-center gap-2"><Crosshair size={16} /> Débit solution moussante</Overline>
              <Stepper label="le débit" onDecrement={() => setFlowRate((f: number) => Math.max(0, f - 50))} onIncrement={() => setFlowRate((f: number) => f + 50)}>
                <StepperValue value={flowRate} unit="L/min" />
              </Stepper>
              <div className="grid grid-cols-1 gap-2">
                {FLOW_PRESETS.map(p => (
                  <Choice key={p.value} selected={flowRate === p.value} className="flex items-center justify-between px-4" onClick={() => setFlowRate(p.value)}>
                    <span>{p.label}</span>
                    <span className="font-mono">{p.value}</span>
                  </Choice>
                ))}
              </div>
            </div>
            <div className="space-y-3 border-t border-surface pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
              <Overline tone="muted" className="flex items-center gap-2"><Wind size={16} /> Foisonnement</Overline>
              <Stepper label="le foisonnement" onDecrement={() => setExpansionRate((r: number) => Math.max(0, r - 10))} onIncrement={() => setExpansionRate((r: number) => r + 10)}>
                <NumberField label="Taux de foisonnement" value={expansionRate} unit="×" onChange={(val) => setExpansionRate(val)} />
              </Stepper>
              <div className="grid grid-cols-2 gap-2">
                {EXPANSION_RATES.map(e => (
                  <Choice
                    key={e.value}
                    selected={expansionRate === e.value}
                    className="flex flex-col items-center leading-tight"
                    onClick={() => { setExpansionRate(e.value); if(e.label.includes('Lance')) setFlowRate(250); if(e.label.includes('Batfan') || e.label.includes('MT296')) setFlowRate(300); }}
                  >
                    <span>{e.label}</span>
                    <span className="font-mono text-xs opacity-80">×{e.value}</span>
                  </Choice>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Overline tone="muted" className="flex items-center gap-2"><Thermometer size={16} /> Décantation cible</Overline>
                <IconButton label="Qu'est-ce que la décantation ?" onClick={() => setShowDecantInfo(true)}><Info size={20} /></IconButton>
              </div>
              <Stepper label="la décantation cible" onDecrement={() => setTargetDecantation(r => Math.max(5, r - 5))} onIncrement={() => setTargetDecantation(r => Math.min(100, r + 5))}>
                <StepperValue value={targetDecantation} unit="%" />
              </Stepper>
              <div className="grid grid-cols-3 gap-2">
                {[25, 50, 100].map(v => (
                  <Choice key={v} selected={targetDecantation === v} tone="warn" className="font-mono" onClick={() => setTargetDecantation(v)}>{v}%</Choice>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 border-t border-surface pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
              <Stat label="Temps de renouvellement estimé" value={formatTime(decantationSeconds)} tone="warn" size="lg" />
              <p className="text-xs text-fg-muted">Basé sur {emulseurType === 'biofor' ? 'Bio For N' : 'Ecopol 3 Premium'}</p>
            </div>
          </div>
        </Panel>
      </Screen>
    );
  } else if (mode === 'operational') {
    content = (
      <Screen
        header={
          <ScreenHeader
            overline="Mousse · En cours"
            title="Intervention"
            status={<StatusDot tone="danger" />}
            onHome={onHome}
            actions={
              <>
                <IconButton label="Point de situation COS" tone="ok" onClick={() => setShowCOSModal(true)}><ClipboardList size={20} /></IconButton>
                <IconButton label="Réglages" onClick={() => setMode('setup')}><Settings size={20} /></IconButton>
              </>
            }
          />
        }
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={isTimerActive ? 'soft-warn' : 'soft-success'}
              icon={isTimerActive ? <Pause /> : <Play />}
              onClick={() => setIsTimerActive(!isTimerActive)}
            >
              {isTimerActive ? 'Pause' : 'Reprendre'}
            </Button>
            <Button variant="soft-danger" icon={<CheckCircle2 />} onClick={() => { setIsTimerActive(false); setMode('report'); }}>Fin opération</Button>
          </div>
        }
      >
        {/* Autonomie : information critique, en tête */}
        <StatTile tone={isCritical ? 'danger' : 'default'} className="gap-3 py-6">
          <Stat label="Autonomie restante" value={formatTime(limitingAutonomy*60)} tone={isCritical ? 'danger' : 'fg'} size="xl" />
          <Badge tone={isCritical ? 'danger' : 'muted'} icon={isCritical ? <AlertTriangle size={14} /> : <Activity size={14} />}>
            Facteur limitant : {limitingFactor}
          </Badge>
        </StatTile>

        <div className="grid grid-cols-2 gap-3">
          <StatTile className="gap-2">
            <Stat label="Durée" value={formatTime(elapsedSeconds)} size="md" />
            <Badge icon={<History size={14} />}>Chrono</Badge>
          </StatTile>
          <StatTile tone="brand" className="gap-2">
            <Stat label="Produit" value={safeFixed(totalFoamProduced, 0)} tone="brand" size="md" />
            <Badge tone="brand" icon={<BoxSelect size={14} />}>m³</Badge>
          </StatTile>
        </div>

        {/* Réserves */}
        <Panel title="Réserves">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center gap-3">
              {stock.isWaterSupplied ? (
                <div className="flex items-center gap-2 text-ok">
                  <Droplets size={20} />
                  <span className="font-mono text-sm font-bold uppercase">Alim. OUI</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sky">
                  <Droplets size={20} />
                  <span className="font-mono text-sm font-bold tabular">{Math.round(stock.water)} L</span>
                </div>
              )}
              <div className="h-36 w-14">
                <SegmentedGauge value={stock.water} max={stock.maxWater} color={stock.isWaterSupplied ? 'ok' : (stock.water/stock.maxWater < 0.2 ? 'danger' : 'sky')} />
              </div>
              <Overline tone="muted">Eau</Overline>
            </div>
            <div className="flex flex-col items-center gap-3 border-l border-surface">
              <div className="flex items-center gap-2 text-brand-light">
                <Database size={20} />
                <span className="font-mono text-sm font-bold tabular">{Math.round(stock.foam)} L</span>
              </div>
              <div className="h-36 w-14">
                <SegmentedGauge value={stock.foam} max={stock.maxFoam} color={stock.foam/stock.maxFoam < 0.2 ? 'danger' : 'brand'} />
              </div>
              <Overline tone="muted">Émulseur</Overline>
            </div>
          </div>
        </Panel>

        {/* Paramètres */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile><Stat label="Débit" value={flowRate} unit="L/min" size="sm" /></StatTile>
          <StatTile><Stat label="Taux" value={`${concentration}%`} tone="brand" size="sm" /></StatTile>
          <StatTile><Stat label="Foisonnement" value={`×${expansionRate}`} size="sm" /></StatTile>
          <StatTile><Stat label={`Décant. ${targetDecantation}%`} value={formatTime(decantationSeconds)} tone="warn" size="sm" /></StatTile>
        </div>

        {/* Graphique de consommation */}
        {consumptionHistory.length > 0 && (
          <Panel title="Consommation cumulée">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={consumptionHistory} margin={{ top: 5, right: 0, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="time" stroke={CHART.grid} tick={{ fill: CHART.tick, fontSize: 12, fontFamily: 'JetBrains Mono' }} tickMargin={6} minTickGap={24} />
                  <YAxis yAxisId="left" stroke={CHART.water} tick={{ fill: CHART.water, fontSize: 12, fontFamily: 'JetBrains Mono' }} />
                  <YAxis yAxisId="right" orientation="right" stroke={CHART.foam} tick={{ fill: CHART.foam, fontSize: 12, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: CHART.panel, border: `1px solid ${CHART.grid}`, borderRadius: '0.75rem', fontSize: '13px', fontFamily: 'JetBrains Mono' }}
                    labelStyle={{ color: CHART.tick }}
                    itemStyle={{ fontWeight: 700 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: CHART.tick }} iconType="circle" />
                  <Line yAxisId="left" type="monotone" dataKey="eau" name="Eau (L)" stroke={CHART.water} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="mousse" name="Émulseur (L)" stroke={CHART.foam} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        )}
      </Screen>
    );
  } else {
    content = (
      <Screen
        header={<ScreenHeader overline="Mousse · Bilan" title="Bilan opération" status={<StatusDot tone="ok" />} onHome={onHome} />}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              icon={<ClipboardList />}
              onClick={async () => {
                const txt = generateFinalReport();
                const copied = await copyText(txt);
                downloadText(txt, `RAPPORT_MOUSSE_${new Date().toLocaleDateString().replace(/\//g,'-')}.txt`);
                showFlash(copied ? 'Rapport copié et téléchargé' : 'Rapport téléchargé');
              }}
            >
              Exporter
            </Button>
            <Button
              variant="primary"
              icon={<RotateCcw />}
              onClick={() => {
                setMode('setup');
                setElapsedSeconds(0);
                setCumulativeWater(0);
                setConsumptionHistory([]);
                setIsTimerActive(false);
                setStock({ water: 3000, foam: 200, maxWater: 3000, maxFoam: 200, isWaterSupplied: false });
                setConcentration(1);
                setFlowRate(300);
                setExpansionRate(250);
                setFoamStartTime(null);
              }}
            >
              Nouveau
            </Button>
          </div>
        }
      >
        <Panel tone="ok">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={28} className="text-ok" />
            <h2 className="text-xl font-semibold text-fg">Bilan mousse</h2>
          </div>
        </Panel>

        <StatTile className="py-6">
          <Stat label="Mousse produite" value={safeFixed(totalFoamProduced, 1)} unit="m³" size="lg" />
        </StatTile>

        <Panel title="Consommation">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Eau consommée" value={Math.round(cumulativeWater)} unit="L" tone="sky" />
            <Stat label="Émulseur consommé" value={Math.round(stock.maxFoam - stock.foam)} unit="L" tone="brand" />
          </div>
        </Panel>

        <Panel title="Stock restant">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Eau restante" value={stock.isWaterSupplied ? 'Alimenté' : Math.round(stock.water)} unit={stock.isWaterSupplied ? undefined : 'L'} tone="sky" />
            <Stat label="Émulseur restant" value={Math.round(stock.foam)} unit="L" tone="brand" />
          </div>
        </Panel>
      </Screen>
    );
  }

  return (
    <>
      {content}

      {showDecantInfo && (
        <Modal title="Taux de décantation" icon={<Info className="text-warn" size={22} />} onClose={() => setShowDecantInfo(false)}>
          <p className="text-sm text-fg">C'est le temps nécessaire pour que la mousse perde une partie de son eau (ex: 25%).</p>
          <div className="space-y-2 rounded-xl border border-surface bg-canvas p-4">
            <p className="flex justify-between text-sm"><span className="font-semibold text-brand-light">Bio For N (25%)</span><span className="font-mono text-fg">~2 min</span></p>
            <p className="flex justify-between text-sm"><span className="font-semibold text-brand-light">Ecopol 3 (25%)</span><span className="font-mono text-fg">~30 min</span></p>
          </div>
          <Overline tone="warn">Indicateur de renouvellement du tapis</Overline>
        </Modal>
      )}

      {showCOSModal && (
        <Modal
          title="Point de situation (COS)"
          icon={<ClipboardList className="text-ok" size={22} />}
          onClose={() => setShowCOSModal(false)}
          footer={
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="success"
                icon={<Copy size={18} />}
                onClick={async () => {
                  const copied = await copyText(generateCOSReport());
                  if (copied) {
                    showFlash('Point de situation copié');
                    setShowCOSModal(false);
                  } else {
                    showFlash('Copie impossible : utilisez Télécharger', 'danger');
                  }
                }}
              >
                Copier
              </Button>
              <Button
                variant="secondary"
                icon={<Download size={18} />}
                onClick={() => {
                  downloadText(generateCOSReport(), `SITUATION_MOUSSE_${new Date().toLocaleTimeString().replace(/:/g,'-')}.txt`);
                  setShowCOSModal(false);
                }}
              >
                Télécharger
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <StatTile>
              <Stat label="Heure du point" value={new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} size="md" />
            </StatTile>
            <StatTile tone="brand">
              <label className="flex flex-col items-center gap-1">
                <span className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-fg-muted">Début production</span>
                <input
                  type="time"
                  value={foamStartTime ? new Date(foamStartTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const [h, m] = e.target.value.split(':').map(Number);
                    const d = new Date();
                    d.setHours(h);
                    d.setMinutes(m);
                    setFoamStartTime(d.getTime());
                  }}
                  className="min-h-12 w-full bg-transparent text-center font-mono text-2xl font-bold tabular text-brand-light outline-none"
                />
              </label>
            </StatTile>
          </div>

          {/* FACTEUR LIMITANT - CRITIQUE */}
          <StatTile tone={limitingAutonomy < 5 ? 'danger' : 'brand'} className="gap-3 py-5">
            <Stat label="Facteur limitant" value={limitingFactor} size="md" tone={limitingAutonomy < 5 ? 'danger' : 'fg'} />
            <div className="h-px w-full bg-surface" />
            <Stat label="Rupture dans" value={formatTime(limitingAutonomy * 60)} size="lg" tone={limitingAutonomy < 5 ? 'danger' : 'fg'} />
          </StatTile>

          <Panel title="Consommation actuelle">
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><dt className="text-fg-muted">Eau</dt><dd className="font-mono font-bold text-fg">{Math.round(actualWaterFlow)} L/min</dd></div>
              <div className="flex items-center justify-between"><dt className="text-fg-muted">Émulseur ({concentration}%)</dt><dd className="font-mono font-bold text-brand-light">{safeFixed(actualFoamFlow, 1)} L/min</dd></div>
              <div className="flex items-center justify-between border-t border-surface pt-2"><dt className="text-fg-muted">Production mousse</dt><dd className="font-mono font-bold text-ok">{safeFixed((flowRate * expansionRate) / 1000, 1)} m³/min</dd></div>
            </dl>
          </Panel>

          <Panel title="Stock restant">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Eau" value={stock.isWaterSupplied ? 'Alimenté' : `${Math.round(stock.water)} L`} tone="sky" size="sm" />
              <Stat label="Émulseur" value={`${Math.round(stock.foam)} L`} tone="brand" size="sm" />
            </div>
          </Panel>
        </Modal>
      )}

      {notification && <Toast tone="brand">{notification}</Toast>}
      {flash && <Toast tone={flash.tone}>{flash.text}</Toast>}

      {showPauseModal && (
        <Modal
          tone="danger"
          title="Opération suspendue"
          icon={<Flame className="text-danger" size={24} />}
          footer={<Button variant="danger" block onClick={() => setShowPauseModal(false)}>Compris</Button>}
        >
          <p className="text-base text-fg">Alimentation de l'engin requise pour continuer la production de mousse.</p>
        </Modal>
      )}
    </>
  );
}
