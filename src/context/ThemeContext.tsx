import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, LightColors, type ThemeColors } from '../styles/theme';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const THEME_KEY = '@meridian/theme';

const ThemeContext = createContext<ThemeContextType>({
  colors: Colors,
  isDark: true,
  themeMode: 'dark',
  setThemeMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(stored => {
      if (stored === 'light' || stored === 'dark') setThemeModeState(stored);
    }).catch(() => {});
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
  };

  const isDark = themeMode === 'dark';
  const colors = isDark ? Colors : LightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
