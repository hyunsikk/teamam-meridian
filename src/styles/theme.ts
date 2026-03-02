// Meridian Design Dictionary — Single source of truth
// All colors, fonts, spacing from brand-guide.md

export const Colors = {
  // Backgrounds
  deepSpace: '#0D0F1A',
  surface1: '#161829',
  surface2: '#1E2038',
  surface3: '#272947',
  divider: 'rgba(45, 47, 74, 0.4)',

  // Accents
  nebulaPurple: '#7B68EE',
  nebulaPurpleLight: 'rgba(123, 104, 238, 0.15)',
  auroraTeal: '#4ECDC4',
  ember: '#FF6B6B',

  // Text
  starlight: '#E8E6F0',
  starlightDim: 'rgba(232, 230, 240, 0.6)',
  starlightFaint: 'rgba(232, 230, 240, 0.3)',

  // Signal colors
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
  display: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 32,
    letterSpacing: -0.5,
    color: Colors.starlight,
  },
  heading: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 22,
    color: Colors.starlight,
  },
  body: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: Colors.starlight,
  },
  bodyBold: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.starlight,
  },
  caption: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.starlightDim,
  },
  small: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: Colors.starlightDim,
  },
};

export const Spacing = {
  screenPadding: 24,
  sectionGap: 40,
  cardPadding: 20,
  elementGap: 12,
  borderRadius: 16,
  sheetRadius: 24,
};

export const SignalConfig = {
  sleep: { emoji: '🛏️', label: 'sleep', color: Colors.signals.sleep, type: 'slider' as const, min: 0, max: 12, unit: 'h' },
  energy: { emoji: '⚡', label: 'energy', color: Colors.signals.energy, type: 'emoji' as const, options: ['😩', '😐', '😊', '😄', '🔥'] },
  mood: { emoji: '😊', label: 'mood', color: Colors.signals.mood, type: 'emoji' as const, options: ['😢', '😕', '😐', '😊', '😄'] },
  focus: { emoji: '🎯', label: 'focus', color: Colors.signals.focus, type: 'emoji' as const, options: ['🌫️', '😶', '🙂', '😌', '🎯'] },
  headache: { emoji: '🤕', label: 'headache', color: Colors.signals.headache, type: 'toggle' as const },
  digestion: { emoji: '🫁', label: 'digestion', color: Colors.signals.digestion, type: 'toggle' as const },
  stress: { emoji: '😰', label: 'stress', color: Colors.signals.stress, type: 'emoji' as const, options: ['😌', '🙂', '😐', '😟', '😰'] },
  exercise: { emoji: '🏃', label: 'exercise', color: Colors.signals.exercise, type: 'toggle' as const },
};

export type SignalKey = keyof typeof SignalConfig;
export const SIGNAL_KEYS: SignalKey[] = ['sleep', 'energy', 'mood', 'focus', 'headache', 'digestion', 'stress', 'exercise'];
export const FREE_SIGNALS: SignalKey[] = ['sleep', 'energy', 'mood', 'focus'];
