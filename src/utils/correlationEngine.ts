// Meridian Correlation Engine — On-device statistical analysis
// Computes Pearson correlations between all signal pairs with lag analysis

import { SignalKey, SIGNAL_KEYS } from '../styles/theme';

interface DayLog {
  date: string;
  signals: Partial<Record<SignalKey, number | boolean>>;
}

export interface Correlation {
  signalA: SignalKey;
  signalB: SignalKey;
  coefficient: number; // Pearson r, -1 to 1
  lag: number; // days (0 = same day, 1 = A leads B by 1 day, etc.)
  sampleSize: number;
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative';
}

// Convert signal value to numeric for correlation
function signalToNumeric(val: number | boolean | undefined): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'boolean') return val ? 1 : 0;
  return val;
}

// Extract time series for a signal from logs
function extractSeries(logs: DayLog[], signal: SignalKey): (number | null)[] {
  return logs.map(log => signalToNumeric(log.signals[signal]));
}

// Pearson correlation coefficient
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

// Compute correlations between all signal pairs with lag 0-3
export function computeCorrelations(logs: DayLog[]): Correlation[] {
  const results: Correlation[] = [];
  const numericSignals: SignalKey[] = SIGNAL_KEYS;

  for (let i = 0; i < numericSignals.length; i++) {
    for (let j = i + 1; j < numericSignals.length; j++) {
      const sigA = numericSignals[i];
      const sigB = numericSignals[j];
      const seriesA = extractSeries(logs, sigA);
      const seriesB = extractSeries(logs, sigB);

      // Test lags 0-3
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

        if (absR >= 0.25 && n >= 5) {
          results.push({
            signalA: sigA,
            signalB: sigB,
            coefficient: Math.round(r * 100) / 100,
            lag,
            sampleSize: n,
            strength: absR >= 0.6 ? 'strong' : absR >= 0.4 ? 'moderate' : 'weak',
            direction: r > 0 ? 'positive' : 'negative',
          });
        }
      }
    }
  }

  // Keep only the strongest lag for each pair
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

// Compute rolling average for a signal
export function rollingAverage(logs: DayLog[], signal: SignalKey, window: number = 7): number[] {
  const series = extractSeries(logs, signal);
  const result: number[] = [];

  for (let i = 0; i < series.length; i++) {
    const start = Math.max(0, i - window + 1);
    const windowVals = series.slice(start, i + 1).filter((v): v is number => v !== null);
    result.push(windowVals.length > 0 ? windowVals.reduce((a, b) => a + b, 0) / windowVals.length : 0);
  }

  return result;
}

// Detect anomalies (values > 2σ from rolling mean)
export function detectAnomalies(logs: DayLog[], signal: SignalKey): { date: string; value: number; zscore: number }[] {
  const series = extractSeries(logs, signal);
  const anomalies: { date: string; value: number; zscore: number }[] = [];

  if (series.length < 7) return anomalies;

  const validValues = series.filter((v): v is number => v !== null);
  const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  const stdDev = Math.sqrt(validValues.reduce((a, b) => a + (b - mean) ** 2, 0) / validValues.length);

  if (stdDev === 0) return anomalies;

  for (let i = 0; i < logs.length; i++) {
    const val = series[i];
    if (val !== null) {
      const z = (val - mean) / stdDev;
      if (Math.abs(z) > 2) {
        anomalies.push({ date: logs[i].date, value: val, zscore: Math.round(z * 10) / 10 });
      }
    }
  }

  return anomalies;
}

// Simple prediction based on recent trends and correlations
export function predictTomorrow(
  logs: DayLog[],
  correlations: Correlation[],
  signal: SignalKey
): { value: number; confidence: number } | null {
  if (logs.length < 14) return null;

  const series = extractSeries(logs, signal);
  const recent = series.slice(-7).filter((v): v is number => v !== null);
  if (recent.length < 3) return null;

  // Base prediction: weighted recent average (exponential decay)
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < recent.length; i++) {
    const weight = Math.pow(0.7, recent.length - 1 - i); // More recent = higher weight
    weightedSum += recent[i] * weight;
    weightTotal += weight;
  }
  let prediction = weightedSum / weightTotal;

  // Adjust based on correlations with other signals
  const lastLog = logs[logs.length - 1];
  for (const corr of correlations) {
    if (corr.signalB === signal && corr.lag > 0) {
      const offsetIdx = logs.length - 1 - corr.lag;
      if (offsetIdx >= 0) {
        const aVal = signalToNumeric(logs[offsetIdx].signals[corr.signalA]);
        if (aVal !== null) {
          // Simple adjustment based on whether the correlated signal was above/below average
          const aSeries = extractSeries(logs, corr.signalA).filter((v): v is number => v !== null);
          const aMean = aSeries.reduce((a, b) => a + b, 0) / aSeries.length;
          const deviation = (aVal - aMean) * corr.coefficient * 0.2;
          prediction += deviation;
        }
      }
    }
  }

  // Confidence based on data amount and correlation strength
  const baseConfidence = Math.min(logs.length / 30, 1) * 0.7;
  const corrBoost = correlations.filter(c => c.signalB === signal || c.signalA === signal).length * 0.05;
  const confidence = Math.min(baseConfidence + corrBoost, 0.85);

  return {
    value: Math.round(prediction * 10) / 10,
    confidence: Math.round(confidence * 100),
  };
}

// Day-of-week analysis
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
