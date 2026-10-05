import { downscaleImage } from './image';

// Photo du plan d'intervention (ventilation), conservée sur le téléphone dans IndexedDB :
// elle survit à un rechargement ou à la fermeture de l'application, et fonctionne hors ligne.
// Un seul plan à la fois : celui de l'intervention en cours.

const DB_NAME = 'opsflow';
const STORE = 'plans';
const KEY = 'ventilation';

type PlanRecord = { blob: Blob; takenAt: number };

export type PlanPhoto = { url: string; takenAt: number; blob: Blob };

export type PlanState = {
  loaded: boolean;
  plan: PlanPhoto | null;
  busy: boolean;
  error: string | null;
};

let state: PlanState = { loaded: false, plan: null, busy: false, error: null };
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setState(patch: Partial<PlanState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

// Une seule URL d'objet partagée par tous les écrans ; libérée quand le plan change.
function setPlan(record: PlanRecord | null) {
  if (state.plan) URL.revokeObjectURL(state.plan.url);
  setState({ plan: record ? { url: URL.createObjectURL(record.blob), takenAt: record.takenAt, blob: record.blob } : null });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export const planStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },

  getState: () => state,

  // Lecture du plan enregistré, une seule fois par session
  load() {
    if (!loading) {
      loading = run<PlanRecord | undefined>('readonly', (store) => store.get(KEY))
        .then((record) => { if (record?.blob) setPlan(record); })
        .catch((e) => console.error('Lecture du plan impossible', e))
        .finally(() => setState({ loaded: true }));
    }
    return loading;
  },

  async save(file: Blob) {
    setState({ busy: true, error: null });
    try {
      const blob = await downscaleImage(file);
      const record: PlanRecord = { blob, takenAt: Date.now() };
      setPlan(record);
      try {
        await run('readwrite', (store) => store.put(record, KEY));
      } catch (e) {
        console.error('Enregistrement du plan impossible', e);
        setState({ error: "Plan affiché, mais non enregistré sur ce téléphone : il sera perdu à la fermeture de l'application." });
      }
    } catch (e) {
      console.error('Photo illisible', e);
      setState({ error: 'Photo illisible. Reprenez la photo.' });
    } finally {
      setState({ busy: false });
    }
  },

  async remove() {
    setPlan(null);
    setState({ error: null });
    try {
      await run('readwrite', (store) => store.delete(KEY));
    } catch (e) {
      console.error('Suppression du plan impossible', e);
    }
  },
};
