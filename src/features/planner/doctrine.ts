// Doctrine de calcul des besoins en eau et en additif.
// Sources : FOD MA 006 (feux de classe B) et FOD MA 007 (feux de classe A).

export type FireType = 'hydro' | 'polar' | 'solid';
export type ActionType = 'wetting' | 'extinction' | 'temporisation';
export type RiskLevel = 'courant' | 'particulier';

// Taux d'application d'extinction, en L/min/m² de solution moussante (FOD MA 006).
// Valeurs de référence en l'absence d'éléments plus précis sur le combustible.
export const EXTINCTION_RATE = { hydro: 5, polar: 8 } as const;

// Feux de classe A : risque courant 1 L/min/m², risque particulier 2 L/min/m² (FOD MA 007).
export const CLASS_A_RATE: Record<RiskLevel, number> = { courant: 1, particulier: 2 };

// Mouillant sur feu de classe B : valeur par défaut historique, non définie par les FOD.
export const WETTING_RATE = 1;

// Durées d'application (FOD MA 006) : extinction sur 20 min, temporisation sur 40 min.
export const DURATION = { extinction: 20, temporisation: 40 } as const;

// Taux de référence pour la situation choisie (temporisation = extinction / 2).
export function referenceRate(fireType: FireType, actionType: ActionType, risk: RiskLevel): number {
  if (fireType === 'solid') return CLASS_A_RATE[risk];
  if (actionType === 'wetting') return WETTING_RATE;
  const extinction = EXTINCTION_RATE[fireType];
  return actionType === 'temporisation' ? extinction / 2 : extinction;
}

// Vrai si le taux de référence provient d'une FOD (faux pour le mouillant en classe B).
export function isDoctrineRate(fireType: FireType, actionType: ActionType): boolean {
  return fireType === 'solid' || actionType !== 'wetting';
}

export function applicationDuration(actionType: ActionType): number {
  return actionType === 'temporisation' ? DURATION.temporisation : DURATION.extinction;
}

export type Needs = {
  solutionFlow: number;      // L/min de solution moussante
  waterFlow: number;         // L/min d'eau
  solutionVolume: number;    // L de solution moussante sur la durée
  waterVolume: number;       // L d'eau sur la durée
  concentrateVolume: number; // L d'additif sur la durée
};

// Méthode FOD MA 006 :
//   Q solution = S × Ta        Q eau = Q solution − C × Q solution
//   V solution = Q solution × t    V émulseur = C × V solution
export function computeNeeds({ surface, rate, concentration, duration }: { surface: number; rate: number; concentration: number; duration: number }): Needs {
  const c = concentration / 100;
  const solutionFlow = surface * rate;
  const solutionVolume = solutionFlow * duration;
  return {
    solutionFlow,
    waterFlow: solutionFlow - c * solutionFlow,
    solutionVolume,
    waterVolume: solutionVolume - c * solutionVolume,
    concentrateVolume: c * solutionVolume,
  };
}
