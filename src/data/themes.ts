export type ResortThemeId =
  | 'palawan_twilight'
  | 'golden_sunset'
  | 'azure_lagoon'
  | 'emerald_cove'
  | 'midnight_minimal';

export interface ResortTheme {
  id: ResortThemeId;
  name: string;
  subtitle: string;
  timeOfDay: string;
  bgGradient: string;
  accentColor: string;
  orbPrimary: string;
  orbSecondary: string;
  orbGlow: string;
  cardBg: string;
  previewGradient: string;
}

export const RESORT_THEMES: ResortTheme[] = [
  {
    id: 'palawan_twilight',
    name: 'Palawan Twilight',
    subtitle: 'Deep ocean indigo with starlight cyan',
    timeOfDay: 'Evening & Night',
    bgGradient: 'radial-gradient(ellipse at 50% 20%, #0d2347 0%, #08142a 50%, #040914 100%)',
    accentColor: '#00f0ff',
    orbPrimary: '#00f0ff',
    orbSecondary: '#3b82f6',
    orbGlow: 'rgba(0, 240, 255, 0.4)',
    cardBg: 'rgba(8, 20, 42, 0.65)',
    previewGradient: 'from-blue-950 via-slate-900 to-cyan-950',
  },
  {
    id: 'golden_sunset',
    name: 'San Vicente Sunset',
    subtitle: 'Golden amber, warm peach and dusk rose',
    timeOfDay: 'Golden Hour 5:30 PM',
    bgGradient: 'radial-gradient(ellipse at 50% 20%, #421820 0%, #260c18 50%, #0f050c 100%)',
    accentColor: '#fb923c',
    orbPrimary: '#fb923c',
    orbSecondary: '#f43f5e',
    orbGlow: 'rgba(251, 146, 60, 0.45)',
    cardBg: 'rgba(38, 12, 24, 0.65)',
    previewGradient: 'from-orange-950 via-rose-950 to-slate-950',
  },
  {
    id: 'azure_lagoon',
    name: 'Long Beach Azure',
    subtitle: 'Crystal turquoise waters & tropical sky',
    timeOfDay: 'Bright Daylight 11:00 AM',
    bgGradient: 'radial-gradient(ellipse at 50% 20%, #063c45 0%, #04232c 50%, #021016 100%)',
    accentColor: '#2dd4bf',
    orbPrimary: '#2dd4bf',
    orbSecondary: '#38bdf8',
    orbGlow: 'rgba(45, 212, 191, 0.45)',
    cardBg: 'rgba(4, 35, 44, 0.65)',
    previewGradient: 'from-teal-950 via-cyan-950 to-slate-950',
  },
  {
    id: 'emerald_cove',
    name: 'El Nido Rainforest',
    subtitle: 'Lush Palawan jungle canopy & teal lagoons',
    timeOfDay: 'Morning Serenity 7:00 AM',
    bgGradient: 'radial-gradient(ellipse at 50% 20%, #0a3321 0%, #051d13 50%, #020c08 100%)',
    accentColor: '#34d399',
    orbPrimary: '#34d399',
    orbSecondary: '#10b981',
    orbGlow: 'rgba(52, 211, 153, 0.45)',
    cardBg: 'rgba(5, 29, 19, 0.65)',
    previewGradient: 'from-emerald-950 via-slate-900 to-green-950',
  },
  {
    id: 'midnight_minimal',
    name: 'Midnight Starlight',
    subtitle: 'Pure minimal velvet obsidian with platinum light',
    timeOfDay: 'Stargazing 12:00 AM',
    bgGradient: 'radial-gradient(ellipse at 50% 20%, #151824 0%, #0a0b10 50%, #020305 100%)',
    accentColor: '#e2e8f0',
    orbPrimary: '#e2e8f0',
    orbSecondary: '#94a3b8',
    orbGlow: 'rgba(226, 232, 240, 0.35)',
    cardBg: 'rgba(15, 17, 26, 0.65)',
    previewGradient: 'from-slate-900 via-neutral-900 to-black',
  },
];
