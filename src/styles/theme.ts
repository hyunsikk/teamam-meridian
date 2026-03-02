// Meridian v2 Design Dictionary — Single source of truth

export const Colors = {
  deepSpace: '#0D0F1A',
  surface1: '#161829',
  surface2: '#1E2038',
  surface3: '#272947',
  divider: 'rgba(45, 47, 74, 0.4)',
  nebulaPurple: '#7B68EE',
  nebulaPurpleLight: 'rgba(123, 104, 238, 0.15)',
  auroraTeal: '#4ECDC4',
  ember: '#FF6B6B',
  starlight: '#E8E6F0',
  starlightDim: 'rgba(232, 230, 240, 0.7)',
  starlightFaint: 'rgba(232, 230, 240, 0.45)',
  signals: {
    sleep: '#6C5CE7',
    energy: '#FDCB6E',
    mood: '#E17055',
    focus: '#00CEC9',
    headache: '#FF7675',
    digestion: '#55A3A4',
    stress: '#A29BFE',
    exercise: '#00B894',
  } as Record<string, string>,
};

export const Typography = {
  display: { fontFamily: 'Nunito_700Bold', fontSize: 32, letterSpacing: -0.5, color: Colors.starlight },
  heading: { fontFamily: 'Nunito_600SemiBold', fontSize: 22, color: Colors.starlight },
  body: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.starlight },
  bodyBold: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.starlight },
  caption: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: Colors.starlightDim },
  small: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.starlightDim },
};

export const Spacing = {
  screenPadding: 24,
  sectionGap: 40,
  cardPadding: 20,
  elementGap: 12,
  borderRadius: 16,
  sheetRadius: 24,
};

export const SignalConfig: Record<string, {
  emoji: string; label: string; color: string;
  type: 'slider' | 'emoji' | 'toggle';
  options?: string[]; min?: number; max?: number; unit?: string;
  description: string; // for onboarding
}> = {
  sleep: { emoji: '🛏️', label: 'sleep', color: Colors.signals.sleep, type: 'slider', min: 0, max: 12, unit: 'h', description: 'how many hours you slept last night' },
  energy: { emoji: '⚡', label: 'energy', color: Colors.signals.energy, type: 'emoji', options: ['😩', '😐', '😊', '😄', '🔥'], description: 'your overall energy level today' },
  mood: { emoji: '😊', label: 'mood', color: Colors.signals.mood, type: 'emoji', options: ['😢', '😕', '😐', '😊', '😄'], description: 'how you\'re feeling emotionally' },
  focus: { emoji: '🎯', label: 'focus', color: Colors.signals.focus, type: 'emoji', options: ['🌫️', '😶', '🙂', '😌', '🎯'], description: 'your ability to concentrate today' },
  headache: { emoji: '🤕', label: 'headache', color: Colors.signals.headache, type: 'toggle', description: 'whether you have a headache today' },
  digestion: { emoji: '🫁', label: 'digestion', color: Colors.signals.digestion, type: 'toggle', description: 'any digestive discomfort today' },
  stress: { emoji: '😰', label: 'stress', color: Colors.signals.stress, type: 'emoji', options: ['😌', '🙂', '😐', '😟', '😰'], description: 'your stress level today' },
  exercise: { emoji: '🏃', label: 'exercise', color: Colors.signals.exercise, type: 'toggle', description: 'whether you exercised today' },
};

export type SignalKey = keyof typeof SignalConfig;
export const SIGNAL_KEYS: SignalKey[] = ['sleep', 'energy', 'mood', 'focus', 'headache', 'digestion', 'stress', 'exercise'];
export const CORE_SIGNALS: SignalKey[] = ['sleep', 'energy', 'mood']; // always active
export const CHOOSABLE_SIGNALS: SignalKey[] = ['focus', 'headache', 'digestion', 'stress', 'exercise']; // user picks from these
export const DEFAULT_ACTIVE: SignalKey[] = ['sleep', 'energy', 'mood', 'focus']; // default if no onboarding
