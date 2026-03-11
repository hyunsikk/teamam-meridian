import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SignalKey, DEFAULT_ACTIVE, CHOOSABLE_SIGNALS } from '../styles/theme';
import { computeCorrelations, computeEmergingCorrelations, type Correlation } from '../utils/correlationEngine';
import { generateInsights, generateRecommendations, generateColdStartContent, generateWeeklyDigest, generateProactiveInsights, type Insight, type Recommendation, type WeeklyDigest } from '../utils/insightEngine';

export interface DayLog {
  date: string;
  loggedAt?: string; // ISO timestamp
  signals: Partial<Record<SignalKey, number | boolean>>;
}

export interface AppSettings {
  activeSignals: SignalKey[];
  unlockedSignals: SignalKey[];
  onboardingComplete: boolean;
  focusSignal?: SignalKey;
  reminderEnabled?: boolean;
  reminderHour?: number;
  reminderMinute?: number;
}

export interface StreakData {
  current: number;
  longest: number;
  lastLogDate: string | null;
  previousStreak: number;
}

interface DataContextType {
  logs: DayLog[];
  correlations: Correlation[];
  emergingCorrelations: Correlation[];
  insights: Insight[];
  recommendations: Recommendation[];
  coldStartContent: Insight[];
  weeklyDigest: WeeklyDigest | null;
  proactiveInsights: Insight[];
  todayLogged: boolean;
  totalDays: number;
  settings: AppSettings;
  dailyFocusAction: Recommendation | null;
  streak: StreakData;
  newlyUnlocked: SignalKey[];
  addLog: (log: DayLog) => Promise<void>;
  deleteLog: (date: string) => Promise<void>;
  updateSettings: (s: Partial<AppSettings>) => Promise<void>;
  refreshAnalysis: () => void;
  clearNewlyUnlocked: () => void;
  resetAllData: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  activeSignals: DEFAULT_ACTIVE,
  unlockedSignals: [...DEFAULT_ACTIVE],
  onboardingComplete: false,
  reminderEnabled: false,
  reminderHour: 20,
  reminderMinute: 0,
};

const defaultStreak: StreakData = { current: 0, longest: 0, lastLogDate: null, previousStreak: 0 };

const DataContext = createContext<DataContextType>({
  logs: [], correlations: [], emergingCorrelations: [], insights: [], recommendations: [],
  coldStartContent: [], weeklyDigest: null, proactiveInsights: [], todayLogged: false, totalDays: 0,
  settings: defaultSettings, dailyFocusAction: null,
  streak: defaultStreak, newlyUnlocked: [],
  addLog: async () => {}, deleteLog: async () => {}, updateSettings: async () => {},
  refreshAnalysis: () => {}, clearNewlyUnlocked: () => {}, resetAllData: async () => {},
});

export const useData = () => useContext(DataContext);

const LOGS_KEY = '@meridian/logs';
const SETTINGS_KEY = '@meridian/settings';
const STREAK_KEY = '@meridian/streak';

function calculateStreak(logs: DayLog[], prevStreakData?: StreakData): StreakData {
  if (logs.length === 0) return defaultStreak;

  const dates = new Set(logs.map(l => l.date));
  const today = new Date().toISOString().split('T')[0];

  let current = 0;
  const startDate = new Date();
  if (!dates.has(today)) {
    startDate.setDate(startDate.getDate() - 1);
    const yesterday = startDate.toISOString().split('T')[0];
    if (!dates.has(yesterday)) {
      const prev = prevStreakData || defaultStreak;
      return {
        current: 0,
        longest: prev.longest,
        lastLogDate: logs[logs.length - 1]?.date || null,
        previousStreak: prev.current > 0 ? prev.current : prev.previousStreak,
      };
    }
  }

  const checkDate = new Date(startDate);
  while (true) {
    const ds = checkDate.toISOString().split('T')[0];
    if (dates.has(ds)) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const longest = Math.max(current, prevStreakData?.longest || 0);
  return {
    current,
    longest,
    lastLogDate: logs[logs.length - 1]?.date || null,
    previousStreak: prevStreakData?.previousStreak || 0,
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [emergingCorrelations, setEmergingCorrelations] = useState<Correlation[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [coldStartContent, setColdStartContent] = useState<Insight[]>([]);
  const [weeklyDigest, setWeeklyDigest] = useState<WeeklyDigest | null>(null);
  const [proactiveInsights, setProactiveInsights] = useState<Insight[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [dailyFocusAction, setDailyFocusAction] = useState<Recommendation | null>(null);
  const [streak, setStreak] = useState<StreakData>(defaultStreak);
  const [newlyUnlocked, setNewlyUnlocked] = useState<SignalKey[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [storedLogs, storedSettings, storedStreak] = await Promise.all([
        AsyncStorage.getItem(LOGS_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(STREAK_KEY),
      ]);
      const parsedSettings = storedSettings ? { ...defaultSettings, ...JSON.parse(storedSettings) } : defaultSettings;
      setSettings(parsedSettings);

      const parsedStreak = storedStreak ? { ...defaultStreak, ...JSON.parse(storedStreak) } : defaultStreak;
      
      if (storedLogs) {
        const parsed: DayLog[] = JSON.parse(storedLogs);
        setLogs(parsed);
        const newStreak = calculateStreak(parsed, parsedStreak);
        setStreak(newStreak);
        await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
        runAnalysis(parsed, parsedSettings);
      } else {
        setStreak(parsedStreak);
        const cold = generateColdStartContent(parsedSettings.activeSignals);
        setColdStartContent(cold);
      }
    } catch (e) {
      console.warn('Failed to load data', e);
    }
  };

  const runAnalysis = useCallback((data: DayLog[], s?: AppSettings) => {
    const activeSettings = s || settings;
    
    const cold = generateColdStartContent(activeSettings.activeSignals);
    setColdStartContent(cold);
    
    if (data.length >= 7) {
      const corrs = computeCorrelations(data);
      setCorrelations(corrs);
      const emerging = computeEmergingCorrelations(data, corrs);
      setEmergingCorrelations(emerging);
      const ins = generateInsights(data, corrs);
      setInsights(ins);
      const recs = generateRecommendations(data, corrs, activeSettings.activeSignals, activeSettings.focusSignal);
      setRecommendations(recs);
      if (recs.length > 0) setDailyFocusAction(recs[0]);

      const digest = generateWeeklyDigest(data, corrs, activeSettings.activeSignals);
      setWeeklyDigest(digest);

      const proactive = generateProactiveInsights(data, corrs, activeSettings.activeSignals);
      setProactiveInsights(proactive);
    } else if (data.length > 0) {
      const recs = generateRecommendations(data, [], activeSettings.activeSignals, activeSettings.focusSignal);
      setRecommendations(recs);
      if (recs.length > 0) setDailyFocusAction(recs[0]);
      const ins = generateInsights(data, []);
      setInsights(ins);
      setWeeklyDigest(null);
      setProactiveInsights([]);
      setEmergingCorrelations([]);
    }
  }, [settings]);

  const addLog = async (log: DayLog) => {
    try {
      const updated = [...logs.filter(l => l.date !== log.date), log].sort((a, b) => a.date.localeCompare(b.date));
      setLogs(updated);
      await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(updated));
      runAnalysis(updated);

      const newStreak = calculateStreak(updated, streak);
      setStreak(newStreak);
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
      
      const totalAfter = updated.length;
      const currentUnlocked = settings.unlockedSignals;
      const available = CHOOSABLE_SIGNALS.filter(s => !currentUnlocked.includes(s));

      let toUnlock: SignalKey[] = [];
      if (totalAfter >= 14 && available.length > 0) {
        toUnlock = [...available];
      } else if (totalAfter >= 7 && available.length > 0) {
        toUnlock = available.slice(0, 2);
      }

      if (toUnlock.length > 0) {
        const newUnlocked = [...currentUnlocked, ...toUnlock];
        setNewlyUnlocked(toUnlock);
        await updateSettings({ unlockedSignals: newUnlocked });
      }
    } catch (e) {
      console.warn('Failed to save log', e);
    }
  };

  const deleteLog = async (date: string) => {
    try {
      const updated = logs.filter(l => l.date !== date);
      setLogs(updated);
      await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(updated));
      
      const newStreak = calculateStreak(updated, streak);
      setStreak(newStreak);
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
      
      runAnalysis(updated);
    } catch (e) {
      console.warn('Failed to delete log', e);
    }
  };

  const updateSettings = async (partial: Partial<AppSettings>) => {
    try {
      const updated = { ...settings, ...partial };
      setSettings(updated);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  };

  const clearNewlyUnlocked = () => setNewlyUnlocked([]);

  const resetAllData = async () => {
    try {
      setLogs([]);
      setSettings(defaultSettings);
      setCorrelations([]);
      setEmergingCorrelations([]);
      setInsights([]);
      setRecommendations([]);
      setColdStartContent([]);
      setWeeklyDigest(null);
      setProactiveInsights([]);
      setStreak(defaultStreak);
      setDailyFocusAction(null);
      setNewlyUnlocked([]);
      await AsyncStorage.multiRemove([LOGS_KEY, SETTINGS_KEY]);
    } catch (e) {
      console.warn('Failed to reset data', e);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayLogged = logs.some(l => l.date === today);

  return (
    <DataContext.Provider value={{
      logs, correlations, emergingCorrelations, insights, recommendations, coldStartContent,
      weeklyDigest, proactiveInsights, todayLogged, totalDays: logs.length, settings, dailyFocusAction,
      streak, newlyUnlocked,
      addLog, deleteLog, updateSettings, refreshAnalysis: () => runAnalysis(logs),
      clearNewlyUnlocked, resetAllData,
    }}>
      {children}
    </DataContext.Provider>
  );
}
