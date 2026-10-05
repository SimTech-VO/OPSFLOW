import { describe, expect, it } from 'vitest';
import { applicationDuration, computeNeeds, referenceRate } from './doctrine';

describe('taux de référence', () => {
  it('extinction : 5 L/min/m² pour les hydrocarbures, 8 pour les liquides polaires (FOD MA 006)', () => {
    expect(referenceRate('hydro', 'extinction', 'courant')).toBe(5);
    expect(referenceRate('polar', 'extinction', 'courant')).toBe(8);
  });

  it('temporisation = extinction / 2 (FOD MA 006)', () => {
    expect(referenceRate('hydro', 'temporisation', 'courant')).toBe(2.5);
    expect(referenceRate('polar', 'temporisation', 'courant')).toBe(4);
  });

  it('classe A : 1 L/min/m² en risque courant, 2 en risque particulier (FOD MA 007)', () => {
    expect(referenceRate('solid', 'wetting', 'courant')).toBe(1);
    expect(referenceRate('solid', 'wetting', 'particulier')).toBe(2);
  });

  it('durées : 20 min en extinction, 40 min en temporisation', () => {
    expect(applicationDuration('extinction')).toBe(20);
    expect(applicationDuration('temporisation')).toBe(40);
  });
});

describe('calcul des besoins (méthode FOD MA 006)', () => {
  it("reproduit l'exemple de la fiche : cuvette d'hydrocarbures de 2 000 m², émulseur à 3 %", () => {
    const needs = computeNeeds({ surface: 2000, rate: 5, concentration: 3, duration: 20 });
    expect(needs.solutionFlow).toBe(10000);
    expect(needs.waterFlow).toBeCloseTo(9700);
    expect(needs.solutionVolume).toBe(200000);
    expect(needs.concentrateVolume).toBeCloseTo(6000);
  });

  it("la temporisation sur 40 min demande autant d'émulseur que l'extinction sur 20 min (abaque FHL)", () => {
    const extinction = computeNeeds({ surface: 2000, rate: referenceRate('hydro', 'extinction', 'courant'), concentration: 3, duration: applicationDuration('extinction') });
    const temporisation = computeNeeds({ surface: 2000, rate: referenceRate('hydro', 'temporisation', 'courant'), concentration: 3, duration: applicationDuration('temporisation') });
    expect(temporisation.solutionFlow).toBe(5000);
    expect(temporisation.concentrateVolume).toBeCloseTo(extinction.concentrateVolume);
  });

  it('cohérent avec la FOD MA 007 : 4 000 L/min couvrent 800 m² d’hydrocarbures ou 500 m² de liquide polaire', () => {
    expect(computeNeeds({ surface: 800, rate: 5, concentration: 3, duration: 20 }).solutionFlow).toBe(4000);
    expect(computeNeeds({ surface: 500, rate: 8, concentration: 3, duration: 20 }).solutionFlow).toBe(4000);
  });
});
