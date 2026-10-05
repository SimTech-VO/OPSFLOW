// Clés de persistance locale (localStorage) des modules.
export const STORAGE_KEYS = {
  foamState: 'opsflow_foam_state',
  foamStock: 'opsflow_foam_stock_v2',
  ventState: 'opsflow_vent_state',
  surfaceState: 'opsflow_surface_state',
} as const;

// Anciennes clés : migrées une seule fois pour ne pas perdre une intervention en cours.
const LEGACY_KEYS: Record<string, string> = {
  sdis77_foam_state: STORAGE_KEYS.foamState,
  sdis77_foam_stock_v2: STORAGE_KEYS.foamStock,
  sdis77_vent_state: STORAGE_KEYS.ventState,
  sdis77_surface_state: STORAGE_KEYS.surfaceState,
};

export function migrateLegacyStorageKeys() {
  try {
    for (const [legacy, current] of Object.entries(LEGACY_KEYS)) {
      const value = localStorage.getItem(legacy);
      if (value === null) continue;
      if (localStorage.getItem(current) === null) localStorage.setItem(current, value);
      localStorage.removeItem(legacy);
    }
  } catch (e) {
    console.error('Migration du stockage local impossible', e);
  }
}

export const loadPersistedState = (key: string) => {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
           if (parsed.lastTimestamp && (parsed.isTimerActive || parsed.isVentilating)) {
             const diff = Math.floor((Date.now() - parsed.lastTimestamp) / 1000);
             // Ensure elapsedSeconds is a number and not NaN
             const currentElapsed = (typeof parsed.elapsedSeconds === 'number' && !isNaN(parsed.elapsedSeconds)) ? parsed.elapsedSeconds : 0;
             parsed.elapsedSeconds = Math.max(0, currentElapsed + diff);
             parsed.timeDiff = diff; // Store diff for other components to use
           }
           return parsed;
        }
      } catch (parseError) {
        console.error(`Error parsing state for ${key}:`, parseError);
        return null;
      }
    }
  } catch (e) { console.error(`Error loading state for ${key}:`, e); }
  return null;
};
