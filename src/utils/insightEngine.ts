// Meridian Insight Engine — Transforms correlations + data into natural language insights
import { SignalKey, SignalConfig } from '../styles/theme';
import { Correlation, predictTomorrow, dayOfWeekAverages } from './correlationEngine';
import knowledgeBase from '../content/knowledge-base.json';

interface DayLog {
  date: string;
  signals: Partial<Record<SignalKey, number | boolean>>;
}

export interface Insight {
  id: string;
  type: 'correlation' | 'prediction' | 'anomaly' | 'milestone' | 'general';
  signalA?: SignalKey;
  signalB?: SignalKey;
  title: string;
  text: string;
  detail?: string;
  strength?: string;
  coefficient?: number;
  isNew?: boolean;
  createdAt: string;
}

function getKnowledgeEntry(signalA: string, signalB: string, direction: string) {
  return knowledgeBase.correlations.find(k => {
    const matchForward = k.signalA === signalA && k.signalB === signalB;
    const matchReverse = k.signalA === signalB && k.signalB === signalA;
    return (matchForward || matchReverse) && (k.direction === direction || k.direction === 'bidirectional' || k.direction === 'mixed');
  });
}

export function generateInsights(logs: DayLog[], correlations: Correlation[]): Insight[] {
  const insights: Insight[] = [];
  const now = new Date().toISOString();

  // Correlation insights
  for (const corr of correlations) {
    const kb = getKnowledgeEntry(corr.signalA, corr.signalB, corr.direction);

    const sigALabel = SignalConfig[corr.signalA]?.label || corr.signalA;
    const sigBLabel = SignalConfig[corr.signalB]?.label || corr.signalB;

    const title = kb?.title || `${sigALabel} and ${sigBLabel} are connected`;
    const lagText = corr.lag > 0 ? ` (with a ${corr.lag}-day delay)` : '';
    const dirText = corr.direction === 'positive' ? 'rise and fall together' : 'move in opposite directions';

    const text = `your ${sigALabel} and ${sigBLabel} ${dirText}${lagText}. correlation: ${Math.abs(corr.coefficient).toFixed(2)} (${corr.strength}).`;
    const detail = kb?.explanation || undefined;

    insights.push({
      id: `corr-${corr.signalA}-${corr.signalB}`,
      type: 'correlation',
      signalA: corr.signalA,
      signalB: corr.signalB,
      title,
      text,
      detail,
      strength: corr.strength,
      coefficient: corr.coefficient,
      createdAt: now,
    });
  }

  // Milestone insights
  const totalDays = logs.length;
  const milestones = [
    { day: 1, text: 'day 1 logged. every journey starts here. patterns need at least 7 days to emerge.' },
    { day: 3, text: '3 days mapped. your signal baselines are forming.' },
    { day: 7, text: '7 days. your first connections are ready. check your network.' },
    { day: 14, text: '2 weeks of data. predictions are now available.' },
    { day: 30, text: '30 days. your body map is becoming something real.' },
    { day: 60, text: '60 days. deep enough for cycle detection now.' },
    { day: 90, text: '90 days. your correlation map is rich and personal.' },
  ];

  for (const ms of milestones) {
    if (totalDays >= ms.day) {
      insights.push({
        id: `milestone-${ms.day}`,
        type: 'milestone',
        title: `${ms.day} days mapped`,
        text: ms.text,
        createdAt: now,
      });
    }
  }

  // Prediction insights (after 14 days)
  if (totalDays >= 14) {
    const predSignals: SignalKey[] = ['energy', 'mood', 'focus'];
    for (const sig of predSignals) {
      const pred = predictTomorrow(logs, correlations, sig);
      if (pred) {
        const label = SignalConfig[sig]?.label || sig;
        insights.push({
          id: `pred-${sig}`,
          type: 'prediction',
          signalA: sig,
          title: `tomorrow's ${label} forecast`,
          text: `predicted ${label}: ${pred.value.toFixed(1)}/5 (${pred.confidence}% confidence). based on your recent patterns.`,
          createdAt: now,
        });
      }
    }
  }

  // General insights from knowledge base
  if (totalDays >= 14) {
    // Check if sleep is keystone
    const sleepCorrs = correlations.filter(c => c.signalA === 'sleep' || c.signalB === 'sleep');
    if (sleepCorrs.length >= 3) {
      const gen = knowledgeBase.generalInsights.find(g => g.id === 'gen-sleep-foundation');
      if (gen) {
        insights.push({
          id: 'gen-sleep-foundation',
          type: 'general',
          title: gen.title,
          text: gen.text,
          createdAt: now,
        });
      }
    }

    // Exercise universal benefit
    const exCorrs = correlations.filter(c =>
      (c.signalA === 'exercise' || c.signalB === 'exercise') && c.direction === 'positive'
    );
    if (exCorrs.length >= 2) {
      const gen = knowledgeBase.generalInsights.find(g => g.id === 'gen-exercise-universal');
      if (gen) {
        insights.push({
          id: 'gen-exercise-universal',
          type: 'general',
          title: gen.title,
          text: gen.text,
          createdAt: now,
        });
      }
    }
  }

  return insights;
}
