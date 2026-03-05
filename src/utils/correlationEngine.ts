// Meridian Correlation Engine — On-device statistical analysis
// Computes Pearson correlations between all signal pairs with lag analysis

import { SignalKey, SIGNAL_KEYS, SignalConfig } from '../styles/theme';

// Signal value ranges for clamping predictions
const SIGNAL_CONFIGS: Record<string, { min: number; max: number }> = {};
for (const key of SIGNAL_KEYS) {
  const cfg = SignalConfig[key];
  if (cfg.type === 'slider') {
    SIGNAL_CONFIGS[key] = { min: cfg.min ?? 0, max: cfg.max ?? 12 };
  } else if (cfg.type === 'emoji') {
    SIGNAL_CONFIGS[key] = { min: 1, max: 5 };
  } else if (cfg.type === 'toggle') {
    SIGNAL_CONFIGS[key] = { min: 0, max: 1 };
  }
}

interface DayLog {
  date: string;
  signals: Partial<Record<SignalKey, number | boolean>>;
}

export interface Correlation {
  signalA: SignalKey;
  signalB: SignalKey;
  coefficient: number;
  lag: number;
  sampleSize: number;
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative';
  confidence: 'high' | 'medium' | 'low';
  emerging?: boolean;
}

function signalToNumeric(val: number | boolean | undefined): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'boolean') return val ? 1 : 0;
  return val;
}

function extractSeries(logs: DayLog[], signal: SignalKey): (number | null)[] {
  return logs.map(log => signalToNumeric(log.signals[signal]));
}

function pearson(x: number[], y: number[]): { r: number; n: number } {
  const n = x.length;
  if (n < 5) return { r: 0, n: 0 };

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    sumXY += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }

  const denom = Math.sqrt(sumX2 * sumY2);
  if (denom === 0) return { r: 0, n };
  return { r: sumXY / denom, n };
}

function computeCorrelationsWithThreshold(logs: DayLog[], threshold: number): Correlation[] {
  const results: Correlation[] = [];
  const numericSignals: SignalKey[] = SIGNAL_KEYS;

  for (let i = 0; i < numericSignals.length; i++) {
    for (let j = i + 1; j < numericSignals.length; j++) {
      const sigA = numericSignals[i];
      const sigB = numericSignals[j];
      const seriesA = extractSeries(logs, sigA);
      const seriesB = extractSeries(logs, sigB);

      for (let lag = 0; lag <= 3; lag++) {
        const pairedX: number[] = [];
        const pairedY: number[] = [];

        for (let k = 0; k < seriesA.length - lag; k++) {
          const a = seriesA[k];
          const b = seriesB[k + lag];
          if (a !== null && b !== null) {
            pairedX.push(a);
            pairedY.push(b);
          }
        }

        const { r, n } = pearson(pairedX, pairedY);
        const absR = Math.abs(r);

        if (absR >= threshold && n >= 5) {
          const confidence: 'high' | 'medium' | 'low' =
            n >= 21 && absR >= 0.5 ? 'high' :
            n >= 14 && absR >= 0.35 ? 'medium' : 'low';
          results.push({
            signalA: sigA,
            signalB: sigB,
            coefficient: Math.round(r * 100) / 100,
            lag,
            sampleSize: n,
            strength: absR >= 0.6 ? 'strong' : absR >= 0.4 ? 'moderate' : 'weak',
            direction: r > 0 ? 'positive' : 'negative',
            confidence,
          });
        }
      }
    }
  }

  const bestPerPair = new Map<string, Correlation>();
  for (const corr of results) {
    const key = `${corr.signalA}-${corr.signalB}`;
    const existing = bestPerPair.get(key);
    if (!existing || Math.abs(corr.coefficient) > Math.abs(existing.coefficient)) {
      bestPerPair.set(key, corr);
    }
  }

  return Array.from(bestPerPair.values()).sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
}

export function computeCorrelations(logs: DayLog[]): Correlation[] {
  return computeCorrelationsWithThreshold(logs, 0.25);
}

// Improvement #12: Emerging correlations (lower threshold, exclude already-found)
export function computeEmergingCorrelations(logs: DayLog[], mainCorrelations: Correlation[]): Correlation[] {
  const allLow = computeCorrelationsWithThreshold(logs, 0.15);
  const mainKeys = new Set(mainCorrelations.map(c => `${c.signalA}-${c.signalB}`));
  return allLow
    .filter(c => !mainKeys.has(`${c.signalA}-${c.signalB}`))
    .map(c => ({ ...c, emerging: true }));
}

// Note: rollingAverage and detectAnomalies removed - were exported but never used (dead code)

export function predictTomorrow(
  logs: DayLog[],
  correlations: Correlation[],
  signal: SignalKey
): { value: number; confidence: number } | null {
  if (logs.length < 14) return null;

  const series = extractSeries(logs, signal);
  const recent = series.slice(-7).filter((v): v is number => v !== null);
  if (recent.length < 3) return null;

  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < recent.length; i++) {
    const weight = Math.pow(0.7, recent.length - 1 - i);
    weightedSum += recent[i] * weight;
    weightTotal += weight;
  }
  let prediction = weightedSum / weightTotal;

  for (const corr of correlations) {
    if (corr.signalB === signal && corr.lag > 0) {
      const offsetIdx = logs.length - 1 - corr.lag;
      if (offsetIdx >= 0) {
        const aVal = signalToNumeric(logs[offsetIdx].signals[corr.signalA]);
        if (aVal !== null) {
          const aSeries = extractSeries(logs, corr.signalA).filter((v): v is number => v !== null);
          if (aSeries.length === 0) continue;
          const aMean = aSeries.reduce((a, b) => a + b, 0) / aSeries.length;
          const deviation = (aVal - aMean) * corr.coefficient * 0.2;
          prediction += deviation;
        }
      }
    }
  }

  const config = SIGNAL_CONFIGS[signal];
  if (config) {
    prediction = Math.max(config.min, Math.min(config.max, prediction));
  }

  const baseConfidence = Math.min(logs.length / 30, 1) * 0.7;
  const corrBoost = correlations.filter(c => c.signalB === signal || c.signalA === signal).length * 0.05;
  const confidence = Math.min(baseConfidence + corrBoost, 0.85);

  return {
    value: Math.round(prediction * 10) / 10,
    confidence: Math.round(confidence * 100),
  };
}

export function dayOfWeekAverages(logs: DayLog[], signal: SignalKey): Record<number, number> {
  const byDay: Record<number, number[]> = {};
  for (const log of logs) {
    const dow = new Date(log.date + 'T12:00:00').getDay();
    const val = signalToNumeric(log.signals[signal]);
    if (val !== null) {
      if (!byDay[dow]) byDay[dow] = [];
      byDay[dow].push(val);
    }
  }

  const result: Record<number, number> = {};
  for (const [dow, vals] of Object.entries(byDay)) {
    result[Number(dow)] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }
  return result;
}

// Helper: compute mean and stddev for a signal
export function signalStats(logs: DayLog[], signal: SignalKey): { mean: number; stdDev: number; values: number[] } | null {
  const vals: number[] = [];
  for (const log of logs) {
    const v = signalToNumeric(log.signals[signal]);
    if (v !== null) vals.push(v);
  }
  if (vals.length < 3) return null;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const stdDev = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
  return { mean, stdDev, values: vals };
}
