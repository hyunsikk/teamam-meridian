import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SignalKey, SIGNAL_KEYS } from '../styles/theme';
import { computeCorrelations, type Correlation } from '../utils/correlationEngine';
import { generateInsights, type Insight } from '../utils/insightEngine';

export interface DayLog {
  date: string; // YYYY-MM-DD
  signals: Partial<Record<SignalKey, number | boolean>>;
}

interface DataContextType {
  logs: DayLog[];
  correlations: Correlation[];
  insights: Insight[];
  todayLogged: boolean;
  totalDays: number;
  addLog: (log: DayLog) => Promise<void>;
  refreshAnalysis: () => void;
}

const DataContext = createContext<DataContextType>({
  logs: [],
  correlations: [],
  insights: [],
  todayLogged: false,
  totalDays: 0,
  addLog: async () => {},
  refreshAnalysis: () => {},
});

export const useData = () => useContext(DataContext);

const LOGS_KEY = '@meridian/logs';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(LOGS_KEY);
      if (stored) {
        const parsed: DayLog[] = JSON.parse(stored);
        setLogs(parsed);
        runAnalysis(parsed);
      }
    } catch (e) {
      console.warn('Failed to load data', e);
    }
  };

  const runAnalysis = useCallback((data: DayLog[]) => {
    if (data.length >= 7) {
      const corrs = computeCorrelations(data);
      setCorrelations(corrs);
      const ins = generateInsights(data, corrs);
      setInsights(ins);
    }
  }, []);

  const addLog = async (log: DayLog) => {
    const updated = [...logs.filter(l => l.date !== log.date), log].sort((a, b) => a.date.localeCompare(b.date));
    setLogs(updated);
    await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(updated));
    runAnalysis(updated);
  };

  const today = new Date().toISOString().split('T')[0];
  const todayLogged = logs.some(l => l.date === today);

  return (
    <DataContext.Provider value={{
      logs,
      correlations,
      insights,
      todayLogged,
      totalDays: logs.length,
      addLog,
      refreshAnalysis: () => runAnalysis(logs),
    }}>
      {children}
    </DataContext.Provider>
  );
}
