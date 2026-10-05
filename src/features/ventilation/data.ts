import { Flame, ShieldAlert, Zap } from 'lucide-react';

export const VENT_MATERIAL_LABELS: Record<string, string> = {
  batfan: 'Batfan Li+',
  mt296: 'MT296 (CO)',
  sax: 'SAX 350',
  stopPetit: 'Stoppeur Fumées 90cm',
  stopGrand: 'Stoppeur Fumées 150cm',
  baliseBleue: "Balise bleue (veine d'aire)"
};

// `color` / `dot` : classes des tokens de la charte (icône et puces de liste)
export const VENT_SPECS = [
  {
    id: 'batfan',
    name: 'Leader Batfan 3 Li+',
    type: 'Ventilateur Électrique',
    icon: Zap,
    color: 'text-warn',
    dot: 'bg-warn',
    stats: [
      { label: 'Débit Const.', value: '18 600 m³/h' },
      { label: 'Débit Air Libre', value: '29 270 m³/h' },
      { label: 'Autonomie', value: '50 min (100%)' },
      { label: 'Poids', value: '23.5 kg' }
    ],
    features: [
      'Eclairage LED zone soufflage',
      'Inclinaison +65° à -90°',
      'Technologie Néo (jet ovalisé)',
      'Mousse HF (Fois. 250-400)',
      'VPP Cage d\'escalier : 3 à 4 étages'
    ],
    usage: 'VPP, Dépression, Mousse'
  },
  {
    id: 'sax350',
    name: 'SAX 350',
    type: 'Extracteur ATEX',
    icon: ShieldAlert,
    color: 'text-danger',
    dot: 'bg-danger',
    stats: [
      { label: 'Débit', value: '5 180 m³/h' },
      { label: 'Alim.', value: '220V (10m)' },
      { label: 'Gaine Max', value: '30 m' },
      { label: 'Zone', value: 'ATEX 1 & 2' }
    ],
    features: [
      'Extraction vapeurs dangereuses',
      'Fourni avec 2 gaines de 5m',
      'Corps acier inoxydable',
      'Protection thermique'
    ],
    usage: 'Extraction, Dépression'
  },
  {
    id: 'mt296',
    name: 'MT296',
    type: 'Ventilateur Thermique',
    icon: Flame,
    color: 'text-brand-light',
    dot: 'bg-brand-light',
    stats: [
      { label: 'Débit', value: '128 950 m³/h' },
      { label: 'Autonomie', value: '1h50' },
      { label: 'Moteur', value: '4T 16CV' },
      { label: 'Carburant', value: 'SP 95' }
    ],
    features: [
      'Brumisation (16 L/min)',
      'Mousse HF (Fois. 800)',
      'Inclinaison réglable',
      '⚠️ GAZ D\'ÉCHAPPEMENT DANS VEINE D\'AIR',
      'Très puissant'
    ],
    usage: 'VPP, Brumisation, Mousse'
  }
];
