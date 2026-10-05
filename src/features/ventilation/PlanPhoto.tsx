import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ChangeEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Camera, ImageUp, Maximize2, Minus, Plus, RotateCw, Share2, Trash2, Wind, X } from 'lucide-react';
import { planStore } from '../../lib/planStore';
import { Button, IconButton, cn } from '../../ui';

// Accès partagé à la photo du plan (accueil et ventilation)
export function usePlanPhoto() {
  const state = useSyncExternalStore(planStore.subscribe, planStore.getState);
  useEffect(() => { planStore.load(); }, []);
  return state;
}

export const formatPlanTime = (t: number) => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

// Deux entrées fichier cachées : l'une ouvre directement l'appareil photo arrière, l'autre la galerie.
function usePlanPicker() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de reprendre une photo identique
    if (file) planStore.save(file);
  };
  const inputs = (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onChange} aria-hidden tabIndex={-1} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onChange} aria-hidden tabIndex={-1} />
    </>
  );
  return { inputs, openCamera: () => cameraRef.current?.click(), openGallery: () => galleryRef.current?.click() };
}

type PlanPanelProps = {
  // capture : invite à photographier le plan s'il n'existe pas encore ; view : n'apparaît que si un plan existe
  mode: 'capture' | 'view';
  height?: 'md' | 'lg';
};

// Encart « plan d'intervention » de la ventilation
export function PlanPanel({ mode, height = 'lg' }: PlanPanelProps) {
  const { plan, busy, error } = usePlanPhoto();
  const { inputs, openCamera, openGallery } = usePlanPicker();
  const [viewerOpen, setViewerOpen] = useState(false);

  if (!plan && mode === 'view') return null;

  return (
    <section className="overflow-hidden rounded-xl border border-surface bg-panel" aria-label="Plan d'intervention">
      {inputs}
      {plan ? (
        <>
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            className={cn('relative block w-full bg-canvas', height === 'lg' ? 'h-64' : 'h-44')}
            aria-label="Agrandir le plan d'intervention"
          >
            <img src={plan.url} alt="Plan d'intervention photographié" className="h-full w-full object-contain" />
            <span className="absolute right-2 bottom-2 flex h-11 w-11 items-center justify-center rounded-lg bg-canvas/85 text-fg">
              <Maximize2 size={20} />
            </span>
            {busy && <BusyOverlay />}
          </button>
          <div className="flex min-h-14 items-center justify-between gap-3 border-t border-surface px-3 py-2">
            <div className="min-w-0 font-mono text-xs text-fg-muted">
              <p className="truncate uppercase tracking-wider">Plan d'intervention</p>
              <p className="mt-0.5 tabular">photo {formatPlanTime(plan.takenAt)}</p>
            </div>
            {mode === 'capture' && (
              <Button size="md" variant="secondary" icon={<Camera size={18} />} onClick={openCamera} disabled={busy}>Reprendre</Button>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 border-2 border-dashed border-surface-hi px-4 py-6 text-center">
          {busy ? (
            <p className="py-10 font-mono text-sm text-fg-muted">Traitement de la photo…</p>
          ) : (
            <>
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface text-brand-light"><Camera size={28} /></span>
              <div>
                <p className="text-base font-semibold text-fg">Plan du bâtiment</p>
                <p className="mt-1 text-sm text-fg-muted">Photographiez le plan que vous venez de dessiner : il restera affiché pendant toute la ventilation.</p>
              </div>
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                <Button variant="primary" icon={<Camera size={20} />} onClick={openCamera}>Prendre la photo</Button>
                <Button variant="secondary" icon={<ImageUp size={20} />} onClick={openGallery}>Importer une image</Button>
              </div>
            </>
          )}
        </div>
      )}
      {error && <p className="border-t border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn" role="alert">{error}</p>}
      {/* Rendu dans <body> : un parent animé (transform) piégerait le plein écran */}
      {viewerOpen && plan && createPortal(<PlanViewer onClose={() => setViewerOpen(false)} onRetake={openCamera} />, document.body)}
    </section>
  );
}

// Espace « plan » de l'accueil : la photo du plan si elle existe, sinon l'illustration
// et un accès direct à l'appareil photo.
export function HomePlan({ onOpen, children }: { onOpen: () => void; children: ReactNode }) {
  const { plan, busy, error } = usePlanPhoto();
  const { inputs, openCamera } = usePlanPicker();

  if (!plan) {
    return (
      <div className="space-y-3">
        {inputs}
        {children}
        <Button variant="primary" block icon={<Camera size={20} />} onClick={openCamera} disabled={busy}>
          {busy ? 'Traitement de la photo…' : 'Photographier le plan'}
        </Button>
        {error && <p className="rounded-lg bg-warn/10 px-3 py-2 text-sm text-warn" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <figure className="m-0 overflow-hidden rounded-xl border border-surface bg-canvas">
      <button type="button" onClick={onOpen} className="relative block h-56 w-full" aria-label="Ouvrir la ventilation avec le plan d'intervention">
        <img src={plan.url} alt="Plan d'intervention photographié" className="h-full w-full object-contain" />
        <span className="absolute right-2 bottom-2 flex h-11 items-center gap-2 rounded-lg bg-canvas/85 px-3 text-sm font-semibold text-fg">
          <Wind size={18} className="text-sky" /> Ventilation
        </span>
      </button>
      <figcaption className="flex items-center justify-between gap-3 border-t border-surface px-4 py-2.5 font-mono text-xs text-fg-muted">
        <span className="truncate uppercase tracking-wider">Plan d'intervention</span>
        <span className="shrink-0 tabular">photo {formatPlanTime(plan.takenAt)}</span>
      </figcaption>
    </figure>
  );
}

function BusyOverlay() {
  return <span className="absolute inset-0 flex items-center justify-center bg-canvas/70 font-mono text-sm text-fg">Traitement de la photo…</span>;
}

const ZOOMS = [1, 1.5, 2, 3, 4];

// Plein écran : zoom par paliers, rotation par quart de tour, partage et suppression
function PlanViewer({ onClose, onRetake }: { onClose: () => void; onRetake: () => void }) {
  const { plan } = usePlanPhoto();
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const center = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Garde le même point au centre de l'écran quand on zoome ou qu'on pivote
  const rememberCenter = () => {
    const el = containerRef.current;
    if (!el || !el.scrollWidth || !el.scrollHeight) return;
    center.current = { x: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth, y: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight };
  };
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollLeft = center.current.x * el.scrollWidth - el.clientWidth / 2;
    el.scrollTop = center.current.y * el.scrollHeight - el.clientHeight / 2;
  }, [zoom, rotation, box]);

  if (!plan) return null;

  const turned = rotation % 180 !== 0;
  const effW = turned ? natural.h : natural.w;
  const effH = turned ? natural.w : natural.h;
  const fit = effW && effH && box.w && box.h ? Math.min(box.w / effW, box.h / effH) : 0;
  const scale = fit * ZOOMS[zoom];
  const frameW = effW * scale;
  const frameH = effH * scale;

  const canShare = typeof navigator !== 'undefined' && 'canShare' in navigator;
  const share = async () => {
    const file = new File([plan.blob], `plan-intervention-${formatPlanTime(plan.takenAt).replace(':', 'h')}.jpg`, { type: plan.blob.type || 'image/jpeg' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "Plan d'intervention" }); } catch { /* partage annulé */ }
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-canvas animate-fade-in" role="dialog" aria-modal="true" aria-label="Plan d'intervention">
      <div className="flex items-center gap-2 border-b border-surface bg-panel px-2 pt-safe pb-2">
        <IconButton label="Fermer" onClick={onClose}><X size={22} /></IconButton>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-light">Ventilation</p>
          <p className="truncate text-lg font-bold leading-tight text-fg">Plan d'intervention</p>
        </div>
        <span className="pr-2 font-mono text-sm tabular text-fg-muted">photo {formatPlanTime(plan.takenAt)}</span>
      </div>

      <div ref={containerRef} className="relative flex-1 overflow-auto">
        <div className="flex items-center justify-center" style={{ width: Math.max(frameW, box.w), height: Math.max(frameH, box.h) }}>
          <div className="relative shrink-0" style={{ width: frameW, height: frameH }}>
            <img
              src={plan.url}
              alt="Plan d'intervention photographié"
              onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              className="absolute top-1/2 left-1/2 max-w-none select-none"
              draggable={false}
              style={{ width: natural.w * scale || undefined, height: natural.h * scale || undefined, transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-surface bg-panel px-3 pt-3 pb-safe">
        <div className={cn('grid gap-2', canShare ? 'grid-cols-4' : 'grid-cols-3')}>
          <Button variant="secondary" aria-label="Dézoomer" disabled={zoom === 0} onClick={() => { rememberCenter(); setZoom((z) => Math.max(0, z - 1)); }}><Minus size={22} /></Button>
          <Button variant="secondary" aria-label="Zoomer" disabled={zoom === ZOOMS.length - 1} onClick={() => { rememberCenter(); setZoom((z) => Math.min(ZOOMS.length - 1, z + 1)); }}><Plus size={22} /></Button>
          <Button variant="secondary" icon={<RotateCw size={20} />} onClick={() => { rememberCenter(); setRotation((r) => (r + 90) % 360); }}>Pivoter</Button>
          {canShare && <Button variant="secondary" icon={<Share2 size={20} />} onClick={share}>Partager</Button>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" icon={<Camera size={20} />} onClick={() => { onClose(); onRetake(); }}>Reprendre</Button>
          {confirmDelete ? (
            <Button variant="danger" icon={<Trash2 size={20} />} onClick={() => { planStore.remove(); onClose(); }}>Confirmer</Button>
          ) : (
            <Button variant="soft-danger" icon={<Trash2 size={20} />} onClick={() => setConfirmDelete(true)}>Supprimer</Button>
          )}
        </div>
        <p className="pb-1 text-center font-mono text-xs text-fg-muted">Zoom ×{ZOOMS[zoom]}</p>
      </div>
    </div>
  );
}
