// Meridian v2 Insight Engine — Insights + Recommendations + Cold Start + Proactive
import { SignalKey, SignalConfig } from '../styles/theme';
import { Correlation, predictTomorrow, dayOfWeekAverages, signalStats } from './correlationEngine';
import knowledgeBase from '../content/knowledge-base.json';

interface DayLog {
  date: string;
  loggedAt?: string;
  signals: Partial<Record<SignalKey, number | boolean>>;
}

export interface Insight {
  id: string;
  type: 'correlation' | 'prediction' | 'anomaly' | 'milestone' | 'general' | 'coldstart' | 'education' | 'baseline' | 'proactive';
  signalA?: SignalKey;
  signalB?: SignalKey;
  title: string;
  text: string;
  detail?: string;
  personalDetail?: string;
  recommendation?: string;
  strength?: string;
  coefficient?: number;
  isNew?: boolean;
  createdAt: string;
  source?: string;
  sourceUrl?: string;
}

export interface Recommendation {
  id: string;
  title: string;
  action: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
  targetSignal: string;
  source?: string;
  sourceUrl?: string;
}

function getKnowledgeEntry(signalA: string, signalB: string, direction: string) {
  return (knowledgeBase as any).correlations.find((k: any) => {
    const matchForward = k.signalA === signalA && k.signalB === signalB;
    const matchReverse = k.signalA === signalB && k.signalB === signalA;
    return (matchForward || matchReverse) && (k.direction === direction || k.direction === 'bidirectional' || k.direction === 'mixed');
  });
}

function getRecommendationForCorrelation(signalA: string, signalB: string): any {
  return (knowledgeBase as any).correlations.find((k: any) => {
    const matchForward = k.signalA === signalA && k.signalB === signalB;
    const matchReverse = k.signalA === signalB && k.signalB === signalA;
    return (matchForward || matchReverse) && k.category === 'intervention';
  });
}

// Improvement #9: Generate personalized pattern description
function generatePersonalDetail(logs: DayLog[], corr: Correlation): string | undefined {
  const statsA = signalStats(logs, corr.signalA);
  const statsB = signalStats(logs, corr.signalB);
  if (!statsA || !statsB || statsA.stdDev === 0) return undefined;

  const labelA = SignalConfig[corr.signalA]?.label || corr.signalA;
  const labelB = SignalConfig[corr.signalB]?.label || corr.signalB;
  const threshold = statsA.mean - statsA.stdDev;

  // Compute average of B when A is below threshold vs above
  let lowBVals: number[] = [];
  let highBVals: number[] = [];

  for (let i = 0; i < logs.length; i++) {
    const aVal = logs[i].signals[corr.signalA];
    const bIdx = i + corr.lag;
    if (bIdx >= logs.length) continue;
    const bVal = logs[bIdx].signals[corr.signalB];
    if (aVal === undefined || aVal === null || bVal === undefined || bVal === null) continue;
    const aNum = typeof aVal === 'boolean' ? (aVal ? 1 : 0) : aVal;
    const bNum = typeof bVal === 'boolean' ? (bVal ? 1 : 0) : bVal;

    if (aNum < threshold) {
      lowBVals.push(bNum);
    } else {
      highBVals.push(bNum);
    }
  }

  if (lowBVals.length < 2 || highBVals.length < 2) return undefined;

  const lowAvg = (lowBVals.reduce((a, b) => a + b, 0) / lowBVals.length).toFixed(1);
  const highAvg = (highBVals.reduce((a, b) => a + b, 0) / highBVals.length).toFixed(1);
  const lagText = corr.lag > 0 ? ` the next day` : '';
  const unit = SignalConfig[corr.signalA]?.unit ? SignalConfig[corr.signalA].unit : '';

  return `when your ${labelA} drops below ${threshold.toFixed(1)}${unit}, your ${labelB} averages ${lowAvg}${lagText} (vs ${highAvg} normally).`;
}

export function generateInsights(logs: DayLog[], correlations: Correlation[]): Insight[] {
  const insights: Insight[] = [];
  const now = new Date().toISOString();

  for (const corr of correlations) {
    const kb = getKnowledgeEntry(corr.signalA, corr.signalB, corr.direction);
    const intervention = getRecommendationForCorrelation(corr.signalA, corr.signalB);

    const sigALabel = SignalConfig[corr.signalA]?.label || corr.signalA;
    const sigBLabel = SignalConfig[corr.signalB]?.label || corr.signalB;
    const title = kb?.title || `${sigALabel} and ${sigBLabel} are connected`;
    const lagText = corr.lag > 0 ? ` (with a ${corr.lag}-day delay)` : '';
    const dirText = corr.direction === 'positive' ? 'rise and fall together' : 'move in opposite directions';
    const text = `your ${sigALabel} and ${sigBLabel} ${dirText}${lagText}. correlation: ${Math.abs(corr.coefficient).toFixed(2)} (${corr.strength}).`;

    const personalDetail = generatePersonalDetail(logs, corr);

    insights.push({
      id: `corr-${corr.signalA}-${corr.signalB}`,
      type: 'correlation',
      signalA: corr.signalA,
      signalB: corr.signalB,
      title,
      text,
      detail: kb?.explanation,
      personalDetail,
      recommendation: intervention?.recommendation || kb?.recommendation,
      strength: corr.strength,
      coefficient: corr.coefficient,
      createdAt: now,
      source: kb?.source,
      sourceUrl: kb?.sourceUrl,
    });
  }

  // Milestone insights
  const totalDays = logs.length;
  const milestones = [
    { day: 1, text: 'day 1 mapped. while your patterns emerge, here\'s what science knows.' },
    { day: 3, text: '3 days in. your baselines are forming.' },
    { day: 7, text: '7 days. your first personal connections are live.' },
    { day: 14, text: '2 weeks. predictions are now available.' },
    { day: 30, text: '30 days. your body map is becoming deeply personal.' },
  ];
  for (const ms of milestones) {
    if (totalDays >= ms.day) {
      insights.push({ id: `milestone-${ms.day}`, type: 'milestone', title: `${ms.day} day${ms.day > 1 ? 's' : ''} mapped`, text: ms.text, createdAt: now });
    }
  }

  // Predictions (14+ days)
  if (totalDays >= 14) {
    const predSignals: SignalKey[] = ['energy', 'mood', 'focus'];
    for (const sig of predSignals) {
      const pred = predictTomorrow(logs, correlations, sig);
      if (pred) {
        const label = SignalConfig[sig]?.label || sig;
        insights.push({
          id: `pred-${sig}`, type: 'prediction', signalA: sig,
          title: `tomorrow's ${label} forecast`,
          text: `predicted ${label}: ${pred.value.toFixed(1)}/5 (${pred.confidence}% confidence).`,
          createdAt: now,
        });
      }
    }
  }

  // General pattern insights
  if (totalDays >= 14) {
    const sleepCorrs = correlations.filter(c => c.signalA === 'sleep' || c.signalB === 'sleep');
    if (sleepCorrs.length >= 3) {
      insights.push({
        id: 'gen-sleep-foundation', type: 'general',
        title: 'sleep is your keystone signal',
        text: 'in your data, sleep connects to more signals than any other. improving sleep tends to improve everything downstream.',
        createdAt: now,
      });
    }
    const exCorrs = correlations.filter(c => (c.signalA === 'exercise' || c.signalB === 'exercise') && c.direction === 'positive');
    if (exCorrs.length >= 2) {
      insights.push({
        id: 'gen-exercise-universal', type: 'general',
        title: 'exercise boosts everything',
        text: `your exercise data shows positive connections to ${exCorrs.length} other signals. exercise is your universal lever.`,
        createdAt: now,
      });
    }
  }

  return insights;
}

export function generateRecommendations(logs: DayLog[], correlations: Correlation[], activeSignals: SignalKey[], focusSignal?: SignalKey): Recommendation[] {
  const recs: Recommendation[] = [];
  if (logs.length === 0) return recs;

  const lastLog = logs[logs.length - 1];
  const totalDays = logs.length;

  function recentAvg(signal: SignalKey, n: number = 7): number | null {
    const recent = logs.slice(-n);
    const vals = recent.map(l => {
      const v = l.signals[signal];
      if (v === undefined || v === null) return null;
      return typeof v === 'boolean' ? (v ? 1 : 0) : v;
    }).filter((v): v is number => v !== null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }

  function getBaseline(signal: SignalKey): number | null {
    const b = (knowledgeBase as any).baselines.find((bl: any) => bl.signal === signal);
    return b ? b.populationAverage : null;
  }

  const kbRecs = (knowledgeBase as any).recommendations || [];
  for (const kbRec of kbRecs) {
    const trigger = kbRec.trigger;
    if (!trigger) continue;
    
    const signal = trigger.signal as SignalKey;
    if (signal !== 'any' && !activeSignals.includes(signal)) continue;

    let triggered = false;
    const avg = recentAvg(signal);
    const baseline = getBaseline(signal);
    const lastVal = lastLog?.signals[signal];

    if (trigger.condition === 'below_threshold' && avg !== null && avg < (trigger.threshold || 0)) {
      triggered = true;
    } else if (trigger.condition === 'above_threshold' && avg !== null && avg > (trigger.threshold || 5)) {
      triggered = true;
    } else if (trigger.condition === 'below_average' && avg !== null && baseline !== null && avg < baseline) {
      triggered = true;
    } else if (trigger.condition === 'above_average' && avg !== null && baseline !== null && avg > baseline) {
      triggered = true;
    } else if (trigger.condition === 'true' && lastVal === true) {
      triggered = true;
    } else if (trigger.condition === 'false' && lastVal === false) {
      triggered = true;
    } else if (trigger.condition === 'log_streak_7' && totalDays >= 7) {
      triggered = true;
    }

    if (triggered) {
      recs.push({
        id: kbRec.id,
        title: kbRec.title,
        action: kbRec.action,
        rationale: kbRec.rationale,
        priority: kbRec.priority || 'medium',
        targetSignal: kbRec.targetSignal || signal,
        source: kbRec.source,
        sourceUrl: kbRec.sourceUrl,
      });
    }
  }

  // Improvement #4: logging time consistency recommendation
  if (totalDays >= 3) {
    recs.push({
      id: 'rec-log-time-consistency',
      title: 'consistent logging time',
      action: 'try logging around the same time each day for more consistent data.',
      rationale: 'time-of-day affects energy, mood, and focus. consistent timing reduces noise in your patterns.',
      priority: 'low',
      targetSignal: 'any',
    });
  }

  // Pre-7-day baseline comparisons
  if (totalDays < 7 && totalDays > 0) {
    for (const sig of activeSignals) {
      const avg = recentAvg(sig);
      const baseline = getBaseline(sig);
      if (avg !== null && baseline !== null) {
        const config = SignalConfig[sig];
        if (!config) continue;
        const isBelow = typeof avg === 'number' && avg < baseline;
        const bEntry = (knowledgeBase as any).baselines.find((b: any) => b.signal === sig);
        if (bEntry && isBelow) {
          recs.push({
            id: `baseline-compare-${sig}`,
            title: `your ${config.label} vs. population average`,
            action: `your ${config.label} is averaging ${typeof avg === 'number' ? avg.toFixed(1) : avg}. the recommended range is ${bEntry.recommendedRange[0]}-${bEntry.recommendedRange[1]}${bEntry.unit === 'hours' ? 'h' : ''}.`,
            rationale: bEntry.description,
            priority: 'low',
            targetSignal: sig,
          });
        }
      }
    }
  }

  // Sort by priority, with focus signal boosted
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recs.sort((a, b) => {
    // Improvement #8: boost focus signal recommendations
    const aFocus = focusSignal && a.targetSignal === focusSignal ? -1 : 0;
    const bFocus = focusSignal && b.targetSignal === focusSignal ? -1 : 0;
    if (aFocus !== bFocus) return aFocus - bFocus;
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const seen = new Set<string>();
  return recs.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

// Improvement #7: Proactive day-specific insights
export function generateProactiveInsights(logs: DayLog[], correlations: Correlation[], activeSignals: SignalKey[]): Insight[] {
  const insights: Insight[] = [];
  const now = new Date().toISOString();
  const today = new Date();
  const dow = today.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dow];

  if (logs.length < 14) return insights;

  // Check day-of-week dips
  for (const sig of activeSignals) {
    const avgs = dayOfWeekAverages(logs, sig);
    const allAvgs = Object.values(avgs);
    if (allAvgs.length < 5) continue;
    const overallAvg = allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length;
    const todayAvg = avgs[dow];
    if (todayAvg !== undefined && todayAvg < overallAvg - 0.5) {
      const label = SignalConfig[sig]?.label || sig;
      insights.push({
        id: `proactive-dow-${sig}`,
        type: 'proactive',
        signalA: sig,
        title: `⚡ heads up`,
        text: `last few ${dayName}s your ${label} averaged ${todayAvg.toFixed(1)}. might be worth paying extra attention today.`,
        createdAt: now,
      });
    }
  }

  // Check lag correlations for yesterday's impact
  const yesterday = logs[logs.length - 1];
  if (yesterday) {
    for (const corr of correlations) {
      if (corr.lag > 0) {
        const yVal = yesterday.signals[corr.signalA];
        if (yVal === undefined || yVal === null) continue;
        const yNum = typeof yVal === 'boolean' ? (yVal ? 1 : 0) : yVal;
        const stats = signalStats(logs, corr.signalA);
        if (!stats) continue;
        const labelA = SignalConfig[corr.signalA]?.label || corr.signalA;
        const labelB = SignalConfig[corr.signalB]?.label || corr.signalB;
        if (yNum < stats.mean - stats.stdDev && corr.direction === 'positive') {
          insights.push({
            id: `proactive-lag-${corr.signalA}-${corr.signalB}`,
            type: 'proactive',
            signalA: corr.signalA,
            signalB: corr.signalB,
            title: `⚡ heads up`,
            text: `yesterday's low ${labelA} may affect your ${labelB} tomorrow. consider prioritizing ${labelA} tonight.`,
            createdAt: now,
          });
          break; // Only show one lag warning
        }
      }
    }
  }

  return insights;
}

export interface WeeklyDigest {
  id: string;
  weekLabel: string;
  averages: { signal: SignalKey; avg: number; prevAvg: number | null; direction: '↑' | '↓' | '→' }[];
  strongestCorrelation: Correlation | null;
  summary: string;
  recommendation: string;
}

export function generateWeeklyDigest(logs: DayLog[], correlations: Correlation[], activeSignals: SignalKey[]): WeeklyDigest | null {
  if (logs.length < 7) return null;

  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const last7 = sorted.slice(-7);
  const prev7 = sorted.length >= 14 ? sorted.slice(-14, -7) : null;

  const weekStart = new Date(last7[0].date + 'T12:00:00');
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const weekLabel = `week of ${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}`;

  function avgForSignal(data: DayLog[], sig: SignalKey): number | null {
    const vals = data.map(l => {
      const v = l.signals[sig];
      if (v === undefined || v === null) return null;
      return typeof v === 'boolean' ? (v ? 1 : 0) : v;
    }).filter((v): v is number => v !== null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }

  const averages: WeeklyDigest['averages'] = [];
  const summaryParts: string[] = [];

  for (const sig of activeSignals) {
    const avg = avgForSignal(last7, sig);
    if (avg === null) continue;
    const prevAvg = prev7 ? avgForSignal(prev7, sig) : null;
    const direction: '↑' | '↓' | '→' = prevAvg === null ? '→' : avg > prevAvg + 0.2 ? '↑' : avg < prevAvg - 0.2 ? '↓' : '→';
    averages.push({ signal: sig, avg: Math.round(avg * 10) / 10, prevAvg: prevAvg !== null ? Math.round(prevAvg * 10) / 10 : null, direction });
    const label = SignalConfig[sig]?.label || sig;
    if (prevAvg !== null) {
      summaryParts.push(`${label} averaged ${avg.toFixed(1)} (${direction} from ${prevAvg.toFixed(1)})`);
    } else {
      summaryParts.push(`${label} averaged ${avg.toFixed(1)}`);
    }
  }

  const strongestCorrelation = correlations.length > 0 ? correlations[0] : null;
  if (strongestCorrelation) {
    const aLabel = SignalConfig[strongestCorrelation.signalA]?.label || strongestCorrelation.signalA;
    const bLabel = SignalConfig[strongestCorrelation.signalB]?.label || strongestCorrelation.signalB;
    summaryParts.push(`${aLabel} and ${bLabel} connected strongly`);
  }

  let recommendation = 'keep logging consistently for sharper insights.';
  if (strongestCorrelation) {
    const kb = getRecommendationForCorrelation(strongestCorrelation.signalA, strongestCorrelation.signalB);
    if (kb?.recommendation) {
      recommendation = `focus action: ${kb.recommendation}`;
    }
  }

  return {
    id: `weekly-digest-${last7[0].date}`,
    weekLabel,
    averages,
    strongestCorrelation,
    summary: summaryParts.slice(0, 3).join('. ') + '.',
    recommendation,
  };
}

export function generateColdStartContent(activeSignals: SignalKey[]): Insight[] {
  const insights: Insight[] = [];
  const now = new Date().toISOString();
  const kb = knowledgeBase as any;

  for (const cs of (kb.coldStart || [])) {
    if (cs.signalA && !activeSignals.includes(cs.signalA) && cs.signalB && !activeSignals.includes(cs.signalB)) continue;
    
    insights.push({
      id: cs.id,
      type: 'coldstart',
      signalA: cs.signalA,
      signalB: cs.signalB,
      title: cs.title,
      text: cs.content,
      source: cs.source,
      sourceUrl: cs.sourceUrl,
      createdAt: now,
    });
  }

  for (const edu of (kb.education || [])) {
    if (!activeSignals.includes(edu.signal as SignalKey)) continue;
    insights.push({
      id: edu.id,
      type: 'education',
      signalA: edu.signal as SignalKey,
      title: edu.title,
      text: edu.content,
      detail: edu.funFact ? `fun fact: ${edu.funFact}` : undefined,
      source: edu.source,
      sourceUrl: edu.sourceUrl,
      createdAt: now,
    });
  }

  for (const bl of (kb.baselines || [])) {
    if (!activeSignals.includes(bl.signal as SignalKey)) continue;
    insights.push({
      id: bl.id,
      type: 'baseline',
      signalA: bl.signal as SignalKey,
      title: bl.title,
      text: bl.description,
      detail: bl.ageVariation,
      source: bl.source,
      sourceUrl: bl.sourceUrl,
      createdAt: now,
    });
  }

  return insights;
}
