import React, { useState, useEffect } from 'react';
import {
  Play, RefreshCcw, ChevronRight, CheckCircle2, Activity, ShieldAlert, Settings, Wind, Eye,
  Map as MapIcon, Users, AlertTriangle, StopCircle, ClipboardList, ArrowUp, History, Compass, FileText,
  ArrowDownToLine, ArrowUpFromLine, MapPin, Minus, Plus, Copy, Download,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { loadPersistedState, STORAGE_KEYS } from '../../lib/storage';
import { copyText, downloadText, safeFormatTime } from '../../lib/format';
import {
  Badge, Button, CheckRow, Choice, IconButton, Modal, NavCard, Overline, Panel, Screen, ScreenHeader,
  Stat, StatTile, StatusDot, Toast, cn, useFlash,
} from '../../ui';
import { VENT_MATERIAL_LABELS, VENT_SPECS } from './data';

// Fix for Leaflet default icon in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const STEP_LABELS = ['Reco', 'Manœu', 'Action', 'Suivi'];
const WIND_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

// Ligne de détail « libellé / valeur »
const Row = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={cn('flex items-center justify-between gap-3', className)}>
    <dt className="text-sm text-fg-muted">{label}</dt>
    <dd className="text-right text-sm font-semibold text-fg">{children}</dd>
  </div>
);

// ==========================================
// MODULE 2 : VENTILATION OPÉRATIONNELLE (V.O.)
// ==========================================
export function VentilationApp({ onBack, onHome }: { onBack: () => void, onHome: () => void }) {
  const savedState = React.useRef(loadPersistedState(STORAGE_KEYS.ventState)).current;
  const [view, setView] = useState<'menu' | 'operational' | 'specs'>(savedState?.view || 'menu');
  const [step, setStep] = useState(savedState?.step || 1);
  const [isVentilating, setIsVentilating] = useState(savedState?.isVentilating || false);
  const [elapsedSeconds, setElapsedSeconds] = useState(typeof savedState?.elapsedSeconds === 'number' ? savedState.elapsedSeconds : 0);
  const [showPMTTModal, setShowPMTTModal] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(savedState?.startTime || null);
  const [engagementARI, setEngagementARI] = useState<string | null>(savedState?.engagementARI || null);
  const [history, setHistory] = useState<any[]>(Array.isArray(savedState?.history) ? savedState.history : []);
  const [windDir, setWindDir] = useState<string | null>(savedState?.windDir || null);
  const [flash, showFlash] = useFlash();

  const [geoData, setGeoData] = useState<{ lat: number, lon: number } | null>(null);
  const [weatherData, setWeatherData] = useState<{ windSpeed: number, windDirDegrees: number, windDirText: string } | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const fetchWeatherAndLocation = () => {
    setIsWeatherLoading(true);
    setWeatherError(null);
    if (!navigator.geolocation) {
      setWeatherError("Géolocalisation non supportée");
      setIsWeatherLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      setGeoData({ lat, lon });
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await response.json();
        const speed = data.current_weather.windspeed;
        const dir = data.current_weather.winddirection;

        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO', 'N'];
        const textDir = dirs[Math.round((dir % 360) / 45)];

        setWeatherData({ windSpeed: speed, windDirDegrees: dir, windDirText: textDir });
        setWindDir(textDir);
        setChecks((p: any) => ({ ...p, vent: true }));
      } catch (err) {
        setWeatherError("Erreur réseau API météo");
      }
      setIsWeatherLoading(false);
    }, (err) => {
      setWeatherError("Accès position refusé");
      setIsWeatherLoading(false);
    }, { enableHighAccuracy: true });
  };

  const [checks, setChecks] = useState(savedState?.checks || { vent: false, batiment: false, stopFumee: false, lance: false, autorise: false, influenceFoyer: false });
  const [pmtt, setPmtt] = useState(savedState?.pmtt || { naturel: false, force: false, horizontale: false, verticale: false, defensive: false, vpp: false, depression: false });
  const [materials, setMaterials] = useState<Record<string, number>>(savedState?.materials || { batfan: 0, mt296: 0, sax: 0, stopPetit: 0, stopGrand: 0, baliseBleue: 0 });

  // Persistance de l'état
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ventState, JSON.stringify({
      step, isVentilating, elapsedSeconds, startTime, engagementARI, history, windDir, checks, pmtt, materials, view, lastTimestamp: Date.now()
    }));
  }, [step, isVentilating, elapsedSeconds, startTime, engagementARI, history, windDir, checks, pmtt, materials, view]);

  const toggleCheck = (k: keyof typeof checks) => setChecks((p: any) => ({ ...p, [k]: !p[k] }));
  const togglePMTT = (cat: string, k: keyof typeof pmtt) => setPmtt((p: any) => {
    let n = { ...p, [k]: !p[k] };
    if (cat === 'principe') { if (k === 'naturel' && n.naturel) n.force = false; if (k === 'force' && n.force) n.naturel = false; }
    return n;
  });
  const updateMat = (k: string, d: number) => setMaterials(p => ({ ...p, [k]: Math.max(0, p[k] + d) }));

  useEffect(() => {
    let int: ReturnType<typeof setInterval> | undefined;
    if (isVentilating) int = setInterval(() => setElapsedSeconds((s: number) => s + 1), 1000);
    return () => clearInterval(int);
  }, [isVentilating]);

  const totalSeconds = (Array.isArray(history) ? history.reduce((acc, h) => acc + ((h.durationMins || 0) * 60 + (h.durationSecs || 0)), 0) : 0) + (elapsedSeconds || 0);

  const handleSequence = () => {
    const safeElapsed = (typeof elapsedSeconds === 'number' && isFinite(elapsedSeconds)) ? elapsedSeconds : 0;
    setHistory(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return [...safePrev, {
        phase: safePrev.length + 1,
        startTime: startTime || "N/A",
        duration: safeFormatTime(safeElapsed),
        durationMins: Math.floor(safeElapsed/60), durationSecs: safeElapsed%60,
        pmtt: { ...pmtt }, engagementARI, materials: { ...materials }
      }];
    });
    setStep(1); setElapsedSeconds(0); setStartTime(null);
    setChecks({vent:false,batiment:false,stopFumee:false,lance:false,autorise:false,influenceFoyer:false});
    setPmtt({naturel:false, force:false, horizontale:false, verticale:false, defensive:false, vpp:false, depression:false});
    // On ne reset pas les matériels car ils restent engagés
    setEngagementARI(null); setWindDir(null);
  };

  const getPStr = (p: any) => p?.naturel ? 'Naturel' : p?.force ? 'Forcé' : 'N/D';
  const getMStr = (p: any) => p?.horizontale && p?.verticale ? "Mixte" : p?.horizontale ? "Horizontale" : p?.verticale ? "Verticale" : "N/D";
  const getTStr = (p: any) => p?.vpp && p?.depression ? "VPP+Dépr." : p?.vpp ? "V.P.P" : p?.depression ? "Dépr." : "N/D";
  // Liste des matériels engagés ; `fmt` met en forme chaque entrée
  const matList = (m: Record<string, number>, fmt: (label: string, q: number) => string) => Object.entries(m).filter(([_,q])=>(q as number)>0).map(([k,q])=>fmt(VENT_MATERIAL_LABELS[k], q as number)).join(', ');
  const reportMat = (l: string, q: number) => `${l} x${q}`;
  const displayMat = (l: string, q: number) => `${l} (x${q})`;

  // Rapport de phase (point de situation) : identique pour la copie et le téléchargement
  const generatePhaseReport = () => {
    let report = `RÉCAPITULATIF VENTILATION OPÉRATIONNELLE\n`;
    report += `HEURE DU POINT : ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n\n`;

    // Phases historiques
    history.forEach((h) => {
      report += `--- PHASE ${h.phase} ---\n`;
      report += `Début : ${h.startTime}\n`;
      report += `Durée : ${h.duration}\n`;
      report += `Stratégie : ${getPStr(h.pmtt)} / ${getMStr(h.pmtt)} / Défensive / ${getTStr(h.pmtt)}\n`;
      report += `Engagement : ${h.engagementARI === 'ARI' ? 'Avec ARI' : 'Sans ARI'}\n`;
      const mat = matList(h.materials, reportMat) || 'Aucun';
      report += `Matériel : ${mat}\n\n`;
    });

    // Phase actuelle
    report += `--- PHASE ${history.length + 1} (ACTUELLE) ---\n`;
    report += `Début : ${startTime || 'N/A'}\n`;
    report += `Durée : ${safeFormatTime(elapsedSeconds)} (en cours)\n`;
    report += `Stratégie : ${getPStr(pmtt)} / ${getMStr(pmtt)} / Défensive / ${getTStr(pmtt)}\n`;
    report += `Engagement : ${engagementARI === 'ARI' ? 'Avec ARI' : 'Sans ARI'}\n`;
    const matFinal = matList(materials, reportMat) || 'Aucun';
    report += `Matériel : ${matFinal}\n`;

    return report;
  };

  const generateFinalReport = () => {
    let report = `RÉCAPITULATIF VENTILATION OPÉRATIONNELLE\n\n`;
    report += `DURÉE TOTALE : ${safeFormatTime(totalSeconds)}\n`;
    report += `NOMBRE DE PHASES : ${history.length + 1}\n\n`;

    // Phases historiques
    history.forEach((h) => {
      report += `--- PHASE ${h.phase} ---\n`;
      report += `Début : ${h.startTime}\n`;
      report += `Durée : ${h.duration}\n`;
      report += `Stratégie : ${getPStr(h.pmtt)} / ${getMStr(h.pmtt)} / Défensive / ${getTStr(h.pmtt)}\n`;
      report += `Engagement : ${h.engagementARI === 'ARI' ? 'Avec ARI' : 'Sans ARI'}\n`;
      const mat = matList(h.materials, reportMat) || 'Aucun';
      report += `Matériel : ${mat}\n\n`;
    });

    // Phase finale
    report += `--- PHASE ${history.length + 1} (FINALE) ---\n`;
    report += `Début : ${startTime || 'N/A'}\n`;
    report += `Durée : ${safeFormatTime(elapsedSeconds)}\n`;
    report += `Stratégie : ${getPStr(pmtt)} / ${getMStr(pmtt)} / Défensive / ${getTStr(pmtt)}\n`;
    report += `Engagement : ${engagementARI === 'ARI' ? 'Avec ARI' : 'Sans ARI'}\n`;
    const matFinal = matList(materials, reportMat) || 'Aucun';
    report += `Matériel : ${matFinal}\n`;

    return report;
  };

  const flashOverlay = flash && <Toast tone={flash.tone}>{flash.text}</Toast>;

  if (view === 'menu') {
    return (
      <Screen header={<ScreenHeader overline="Opérationnelle" title="Ventilation" onBack={onBack} onHome={onHome} />}>
        <div className="space-y-3 pt-2">
          <NavCard
            title="Opérations (Live)"
            description="Suivi d'intervention, chronomètre, phases et bilan"
            icon={<Play size={26} className="fill-current" />}
            onClick={() => setView('operational')}
          />
          <NavCard
            title="Spécificités matériel"
            description="Fiches techniques ventilateurs (Batfan, SAX, MT296)"
            icon={<FileText size={26} />}
            accent="muted"
            onClick={() => setView('specs')}
          />
        </div>
      </Screen>
    );
  }

  if (view === 'specs') {
    return (
      <Screen header={<ScreenHeader overline="Matériel ventilation" title="Spécificités" onBack={() => setView('menu')} onHome={onHome} />}>
        {VENT_SPECS.map(spec => (
          <Panel key={spec.id} className="space-y-5 p-0">
            {/* En-tête de fiche */}
            <div className="flex items-center gap-4 border-b border-surface p-4">
              <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-surface bg-canvas', spec.color)}>
                <spec.icon size={28} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-semibold leading-tight text-fg">{spec.name}</h3>
                <p className={cn('mt-1 font-mono text-xs font-medium uppercase tracking-[0.12em]', spec.color)}>{spec.type}</p>
              </div>
            </div>

            {/* Avertissement MT296 */}
            {spec.id === 'mt296' && (
              <div className="mx-4 flex items-start gap-3 rounded-xl border-2 border-danger/60 bg-danger/10 p-4">
                <AlertTriangle size={22} className="mt-0.5 shrink-0 text-danger" />
                <div>
                  <p className="mb-1 text-sm font-semibold uppercase text-danger">Attention : gaz d'échappement</p>
                  <p className="text-sm leading-relaxed text-fg">
                    Ce ventilateur thermique produit du monoxyde de carbone (CO).
                    <strong className="text-danger"> Les gaz sont propulsés dans la veine d'air.</strong>{' '}
                    Usage extérieur uniquement pour soufflage.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 px-4 pb-4 md:grid-cols-2">
              {/* Performances */}
              <div className="space-y-3">
                <Overline tone="muted">Performances</Overline>
                <div className="grid grid-cols-2 gap-2">
                  {spec.stats.map((stat, i) => (
                    <div key={i} className="rounded-xl border border-surface bg-canvas p-3">
                      <p className="mb-1 text-xs text-fg-muted">{stat.label}</p>
                      <p className="font-mono text-base font-bold text-fg">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Caractéristiques */}
              <div className="space-y-3">
                <Overline tone="muted">Caractéristiques</Overline>
                <ul className="space-y-2.5">
                  {spec.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-fg">
                      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', spec.dot)} />
                      {feat}
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl border border-surface bg-canvas p-3">
                  <p className="mb-1 font-mono text-xs uppercase tracking-[0.12em] text-fg-muted">Usage recommandé</p>
                  <p className="text-sm font-semibold text-fg">{spec.usage}</p>
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </Screen>
    );
  }

  // Bilan (étape 5)
  if (step >= 5) {
    return (
      <Screen
        header={<ScreenHeader overline="Ventilation · Bilan" title="Bilan opération" status={<StatusDot tone="ok" />} onHome={onHome} />}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              icon={<ClipboardList />}
              onClick={async () => {
                const txt = generateFinalReport();
                const copied = await copyText(txt);
                downloadText(txt, `RAPPORT_VENTILATION_${new Date().toLocaleDateString().replace(/\//g,'-')}.txt`);
                showFlash(copied ? 'Rapport copié et téléchargé' : 'Rapport téléchargé');
              }}
            >
              Exporter
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setStep(1);
                setIsVentilating(false);
                setElapsedSeconds(0);
                setStartTime(null);
                setEngagementARI(null);
                setHistory([]);
                setWindDir(null);
                setChecks({ vent: false, batiment: false, stopFumee: false, lance: false, autorise: false, influenceFoyer: false });
                setPmtt({ naturel: false, force: false, horizontale: false, verticale: false, defensive: false, vpp: false, depression: false });
                setMaterials({ batfan: 0, mt296: 0, sax: 0, stopPetit: 0, stopGrand: 0 });
              }}
            >
              Nouvelle inter.
            </Button>
          </div>
        }
      >
        <Panel tone="ok">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={28} className="text-ok" />
            <h2 className="text-xl font-semibold text-fg">Bilan de l'opération</h2>
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-3">
          <StatTile><Stat label="Durée totale" value={safeFormatTime(totalSeconds)} /></StatTile>
          <StatTile><Stat label="Phases" value={history.length+1} /></StatTile>
        </div>

        <Overline tone="muted" className="pt-2">Détail des phases</Overline>
        {/* Historique des phases précédentes */}
        {history.map((h, i) => (
          <Panel key={i}>
            <div className="mb-3 flex items-center justify-between border-b border-surface pb-3">
              <span className="font-mono text-sm font-bold uppercase text-brand-light">Phase {h.phase}</span>
              <span className="font-mono text-sm text-fg-muted">{h.startTime} • {h.duration}</span>
            </div>
            <dl className="space-y-2">
              <Row label="Stratégie">{getPStr(h.pmtt)} / {getMStr(h.pmtt)}</Row>
              <Row label="Technique">{getTStr(h.pmtt)}</Row>
              <Row label="Matériel">{matList(h.materials, displayMat) || 'Aucun'}</Row>
            </dl>
          </Panel>
        ))}

        {/* Phase finale / actuelle */}
        <Panel tone="brand">
          <div className="mb-3 flex items-center justify-between border-b border-brand/30 pb-3">
            <span className="font-mono text-sm font-bold uppercase text-fg">Phase {history.length + 1} (finale)</span>
            <span className="font-mono text-sm text-fg-muted">{startTime || 'N/A'} • {safeFormatTime(elapsedSeconds)}</span>
          </div>
          <dl className="space-y-2">
            <Row label="Stratégie">{getPStr(pmtt)} / {getMStr(pmtt)}</Row>
            <Row label="Technique">{getTStr(pmtt)}</Row>
            <Row label="Matériel">{matList(materials, displayMat) || 'Aucun'}</Row>
          </dl>
        </Panel>
        {flashOverlay}
      </Screen>
    );
  }

  const checksReady = checks.autorise && checks.stopFumee && checks.influenceFoyer;

  // Actions principales de l'étape, dans la zone du pouce
  let footer: React.ReactNode = null;
  if (step === 1) footer = <Button variant="secondary" block onClick={() => setStep(2)}>Suivant <ChevronRight size={20} /></Button>;
  if (step === 2) footer = <Button variant="secondary" block onClick={() => setStep(3)}>Suivant <ChevronRight size={20} /></Button>;
  if (step === 3) footer = (
    <div className="space-y-2">
      {!checksReady && <p className="text-center text-sm text-fg-muted">Valider les 3 points de la checklist de sécurité</p>}
      <Button
        variant="primary"
        size="xl"
        block
        icon={<Wind />}
        disabled={!checksReady}
        onClick={() => { setIsVentilating(true); setStep(4); setStartTime(new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})); }}
      >
        Démarrer ventilation
      </Button>
    </div>
  );
  if (step === 4) footer = isVentilating ? (
    <div className="space-y-3">
      <Button variant="soft-sky" block icon={<History size={20} />} onClick={handleSequence}>Séquencer (nouvelle phase)</Button>
      <Button variant="danger" size="xl" block icon={<StopCircle />} onClick={()=>setIsVentilating(false)}>Stop & réévaluer</Button>
    </div>
  ) : (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Button variant="success" icon={<Play size={20} />} onClick={()=>setIsVentilating(true)}>Reprendre</Button>
        <Button variant="soft-sky" icon={<History size={20} />} onClick={handleSequence}>Séquencer</Button>
      </div>
      <Button variant="primary" block icon={<FileText size={20} />} onClick={()=>setStep(5)}>Terminer & bilan</Button>
    </div>
  );

  return (
    <>
      <Screen
        header={
          <ScreenHeader
            overline={history.length > 0 ? `Phase ${history.length+1}` : "Opérationnelle"}
            title="Ventilation"
            status={isVentilating ? <StatusDot tone="danger" /> : undefined}
            onBack={() => setView('menu')}
            onHome={onHome}
            actions={<IconButton label="Rapport & synthèse" tone="ok" onClick={() => setShowPMTTModal(true)}><ClipboardList size={20} /></IconButton>}
          />
        }
        footer={footer}
      >
        {/* Étapes */}
        <nav className="grid grid-cols-4 gap-1 rounded-xl border border-surface bg-panel p-1" aria-label="Étapes">
          {STEP_LABELS.map((l, i) => (
            <button
              key={i}
              type="button"
              aria-current={step === i+1 ? 'step' : undefined}
              onClick={() => setStep(i+1)}
              className={cn(
                'flex min-h-12 flex-col items-center justify-center rounded-lg px-1 text-sm font-semibold transition-colors',
                step === i+1 ? 'bg-brand text-canvas' : 'text-fg-muted hover:text-fg',
              )}
            >
              <span className="font-mono text-xs">{i+1}</span>
              <span>{l}</span>
            </button>
          ))}
        </nav>

        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <Panel tone="brand">
              <div className="flex items-start gap-3">
                <Eye size={26} className="shrink-0 text-brand-light" />
                <div>
                  <h3 className="text-base font-semibold text-fg">Analyse 360°</h3>
                  <p className="text-sm text-fg-muted">Définir la veine d'air naturel et le bâtimentaire.</p>
                </div>
              </div>
            </Panel>

            <Panel
              title="Sens du vent"
              icon={<Compass size={18} />}
              aside={
                <Button size="md" variant="secondary" disabled={isWeatherLoading} onClick={fetchWeatherAndLocation} icon={isWeatherLoading ? <RefreshCcw size={18} className="animate-spin" /> : <MapPin size={18} />}>
                  Localiser
                </Button>
              }
            >
              <div className="flex flex-col items-center gap-4">
                {weatherError && <p className="w-full rounded-lg bg-danger/10 px-3 py-2 text-center text-sm font-semibold text-danger">{weatherError}</p>}

                {geoData && (
                  <div className="relative h-56 w-full overflow-hidden rounded-xl border border-surface">
                    <MapContainer center={[geoData.lat, geoData.lon]} zoom={17} zoomControl={false} style={{ width: '100%', height: '100%', zIndex: 10 }}>
                      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                      <Marker position={[geoData.lat, geoData.lon]} />
                    </MapContainer>

                    {weatherData && (
                      <div className="pointer-events-none absolute inset-0 z-[400] grid grid-cols-6 grid-rows-4 items-center justify-items-center">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <ArrowUp key={i} size={24} className="text-sky drop-shadow-[0_0_2px_rgba(0,0,0,0.9)]" style={{ transform: `rotate(${weatherData.windDirDegrees + 180}deg)` }} strokeWidth={3} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {geoData && weatherData && (
                  <div className="flex w-full items-center justify-between rounded-xl border border-sky/40 bg-canvas p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky/10">
                        <ArrowUp size={28} className="text-sky" style={{ transform: `rotate(${weatherData.windDirDegrees + 180}deg)` }} strokeWidth={3} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-fg">Flux d'air</p>
                        <p className="font-mono text-sm text-sky">Origine : {weatherData.windDirText}</p>
                      </div>
                    </div>
                    <Stat label="Vent" value={Math.round(weatherData.windSpeed)} unit="km/h" size="md" />
                  </div>
                )}

                {/* Rose des vents : boutons de 48 px */}
                <div className="relative my-2 flex h-60 w-60 items-center justify-center rounded-full border border-surface bg-canvas">
                  {WIND_DIRS.map((d, i) => (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={windDir === d}
                      onClick={() => {
                        if (windDir === d) {
                          setWindDir(null);
                          setChecks((p: any) => ({ ...p, vent: false }));
                        } else {
                          setWindDir(d);
                          setChecks((p: any) => ({ ...p, vent: true }));
                        }
                      }}
                      className={cn(
                        'absolute flex h-12 w-12 items-center justify-center rounded-full border-2 font-mono text-sm font-bold transition-colors',
                        windDir === d ? 'border-brand bg-brand text-canvas' : 'border-surface bg-panel text-fg hover:border-fg-subtle',
                      )}
                      style={{ transform: `rotate(${i * 45}deg) translate(0, -92px) rotate(-${i * 45}deg)` }}
                    >
                      {d}
                    </button>
                  ))}
                  <Wind size={32} className={windDir ? 'text-sky' : 'text-fg-subtle'} />
                </div>
              </div>
            </Panel>

            <CheckRow checked={checks.batiment} onToggle={() => toggleCheck('batiment')} icon={<MapIcon size={22} />} label="Structure bâtimentaire" hint="Volumes et ouvrants reconnus" />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-center gap-3 rounded-2xl border-2 border-danger bg-danger/10 p-4">
              <ShieldAlert size={24} className="text-danger" />
              <h3 className="text-base font-bold uppercase tracking-wide text-danger">Tactique offensive interdite</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Panel title="Principe">
                <div className="grid grid-cols-2 gap-2">
                  <Choice selected={pmtt.naturel} onClick={() => togglePMTT('principe', 'naturel')}>NATUREL</Choice>
                  <Choice selected={pmtt.force} onClick={() => togglePMTT('principe', 'force')}>FORCÉ</Choice>
                </div>
              </Panel>
              <Panel title="Méthode">
                <div className="grid grid-cols-2 gap-2">
                  <Choice selected={pmtt.horizontale} onClick={() => togglePMTT('methode', 'horizontale')}>HORIZ.</Choice>
                  <Choice selected={pmtt.verticale} onClick={() => togglePMTT('methode', 'verticale')}>VERT.</Choice>
                </div>
              </Panel>
              <Panel title="Technique">
                <div className="grid grid-cols-2 gap-2">
                  <Choice selected={pmtt.vpp} onClick={() => togglePMTT('technique', 'vpp')}>V.P.P</Choice>
                  <Choice selected={pmtt.depression} onClick={() => togglePMTT('technique', 'depression')}>DÉPR.</Choice>
                </div>
              </Panel>
              <Panel title="Tactique">
                <div className="grid grid-cols-2 gap-2">
                  <Choice selected={pmtt.defensive} onClick={() => togglePMTT('tactique', 'defensive')}>DÉFENSIVE</Choice>
                  <div className="flex min-h-12 items-center justify-center rounded-xl border-2 border-dashed border-surface text-sm font-semibold text-fg-subtle line-through" aria-disabled>OFFENSIVE</div>
                </div>
              </Panel>
            </div>
            <Panel title="Engagement binôme">
              <div className="grid grid-cols-2 gap-2">
                <Choice selected={engagementARI === 'ARI'} tone="ok" className="flex items-center justify-center gap-2" onClick={() => setEngagementARI('ARI')}><Users size={18} /> AVEC ARI</Choice>
                <Choice selected={engagementARI === 'SANS'} tone="warn" className="flex items-center justify-center gap-2" onClick={() => setEngagementARI('SANS')}><Users size={18} /> SANS ARI</Choice>
              </div>
            </Panel>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <Panel title="Matériels utilisés" icon={<Settings size={18} />} aside={<Badge tone="ok">Inclure autres FPT</Badge>}>
              <div className="space-y-2">
                {Object.entries(VENT_MATERIAL_LABELS).map(([k,l]) => (
                  <div key={k} className={cn('flex items-center justify-between gap-3 rounded-xl border bg-canvas py-1.5 pr-1.5 pl-4', k==='mt296' ? 'border-danger/50' : 'border-surface')}>
                    <span className="text-sm font-semibold text-fg">{l}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label={`Retirer ${l}`} onClick={()=>updateMat(k,-1)} className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface text-fg active:bg-panel"><Minus size={20} /></button>
                      <span className="w-6 text-center font-mono text-lg font-bold tabular text-fg">{materials[k]}</span>
                      <button type="button" aria-label={`Ajouter ${l}`} onClick={()=>updateMat(k,1)} className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface text-fg active:bg-panel"><Plus size={20} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Checklist de sécurité">
              <div className="space-y-2">
                <CheckRow checked={checks.autorise} onToggle={() => toggleCheck('autorise')} label="Autorisation COS obtenue" />
                <CheckRow checked={checks.stopFumee} onToggle={() => toggleCheck('stopFumee')} label="Maîtrise des entrants & sortants" />
                <CheckRow checked={checks.influenceFoyer} onToggle={() => toggleCheck('influenceFoyer')} label="Aucune influence sur le foyer" />
              </div>
            </Panel>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <StatTile tone={isVentilating ? 'default' : 'danger'} className="gap-3 py-8">
              <Wind size={44} className={isVentilating ? 'text-sky animate-spin-slow' : 'text-danger'} />
              <Overline tone={isVentilating ? 'sky' : 'danger'}>{isVentilating ? "Ventilation active" : "Ventilation stoppée"}</Overline>
              <span className="font-mono text-6xl font-bold tabular text-fg sm:text-7xl">{safeFormatTime(elapsedSeconds)}</span>
            </StatTile>
            <div className="grid grid-cols-2 gap-3">
              {[ {i:ArrowDownToLine,c:'text-ok',l:'Flux entrant'}, {i:ArrowUpFromLine,c:'text-brand-light',l:'Flux sortant'}, {i:Activity,c:'text-sky',l:'Efficacité'}, {i:ShieldAlert,c:'text-danger',l:'CO'} ].map((it,idx)=>(
                <div key={idx} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-surface bg-panel p-4">
                  <it.i size={24} className={it.c} />
                  <span className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-fg-muted">{it.l}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Screen>

      {showPMTTModal && (
        <Modal
          title="Rapport & synthèse"
          icon={<ClipboardList className="text-ok" size={22} />}
          onClose={() => setShowPMTTModal(false)}
          footer={
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="success"
                icon={<Copy size={18} />}
                onClick={async () => {
                  const copied = await copyText(generatePhaseReport());
                  if (copied) {
                    showFlash('Rapport copié');
                    setShowPMTTModal(false);
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
                  downloadText(generatePhaseReport(), `RAPPORT_VENTILATION_${new Date().toLocaleDateString().replace(/\//g,'-')}.txt`);
                  setShowPMTTModal(false);
                }}
              >
                Télécharger
              </Button>
            </div>
          }
        >
          <div className={cn('grid gap-3', startTime ? 'grid-cols-2' : 'grid-cols-1')}>
            <StatTile>
              <Stat label="Heure du point" value={new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} />
            </StatTile>
            {startTime && (
              <StatTile tone="ok">
                <Stat label="Début phase" value={startTime} tone="ok" />
              </StatTile>
            )}
          </div>

          <Panel title="Situation actuelle">
            <dl className="space-y-2">
              <Row label="Principe">{getPStr(pmtt)}</Row>
              <Row label="Méthode">{getMStr(pmtt)}</Row>
              <Row label="Technique">{getTStr(pmtt)}</Row>
              <Row label="Engagement" className="border-t border-surface pt-2">
                <Badge tone={engagementARI==='ARI' ? 'ok' : 'warn'}>{engagementARI==='ARI'?'Avec ARI':'Sans ARI'}</Badge>
              </Row>
            </dl>
          </Panel>

          <Panel title="Matériels engagés (total)">
            {Object.entries(materials).filter(([_, q]) => (q as number) > 0).length > 0 ? (
              <dl className="space-y-2">
                {Object.entries(materials).filter(([_, q]) => (q as number) > 0).map(([k, q]) => (
                  <Row key={k} label={VENT_MATERIAL_LABELS[k]}><span className="font-mono">×{q}</span></Row>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-fg-muted">Aucun matériel renseigné</p>
            )}
          </Panel>

          {history.length > 0 && (
            <Panel title="Historique phases">
              <div className="space-y-3">
                {history.map((h, i) => (
                  <div key={i} className="border-b border-surface pb-3 last:border-0 last:pb-0">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-sm font-bold uppercase text-brand-light">Phase {h.phase}</span>
                      <span className="font-mono text-sm text-fg-muted">{h.startTime}</span>
                    </div>
                    <p className="text-sm text-fg">{getPStr(h.pmtt)} / {getMStr(h.pmtt)} / {getTStr(h.pmtt)}</p>
                    <p className="text-sm text-fg-muted">{matList(h.materials, reportMat)}</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </Modal>
      )}
      {flashOverlay}
    </>
  );
}
