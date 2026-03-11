// Generate realistic sample data for testing all user journeys
// Covers: 30 days of logs with realistic patterns and correlations

import { DayLog } from '../context/DataContext';
import { SignalKey } from '../styles/theme';

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

// Simulate realistic body signal patterns with correlations:
// - Poor sleep → low energy next day
// - Exercise → better mood
// - High stress → headache likelihood increases
// - Good sleep + exercise → high focus
export function generateSampleData(): DayLog[] {
  const logs: DayLog[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

    // Base patterns with day-of-week variation
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekProgress = i / 30; // 0 = oldest, 1 = newest

    // Sleep: 5-9 hours, better on weekends, improving over time
    const baseSleep = isWeekend ? 7.5 : 6.5;
    const sleepVariance = (Math.sin(i * 0.7) * 1.2) + (weekProgress * 0.5);
    const sleep = Math.round((baseSleep + sleepVariance) * 2) / 2; // Round to 0.5
    const clampedSleep = Math.max(4, Math.min(10, sleep));

    // Energy: correlated with previous night's sleep
    const prevSleep = i < 29 ? clampedSleep : 7;
    const energyBase = prevSleep >= 7 ? 4 : prevSleep >= 6 ? 3 : prevSleep >= 5 ? 2 : 1;
    const energyNoise = Math.floor(Math.random() * 2) - (Math.random() > 0.7 ? 1 : 0);
    const energy = Math.max(1, Math.min(5, energyBase + energyNoise));

    // Mood: correlated with energy and exercise
    const exercised = isWeekend ? Math.random() > 0.3 : Math.random() > 0.6;
    const moodBase = energy >= 4 ? 4 : energy >= 3 ? 3 : 2;
    const moodBoost = exercised ? 1 : 0;
    const moodNoise = Math.floor(Math.random() * 2) - (Math.random() > 0.6 ? 1 : 0);
    const mood = Math.max(1, Math.min(5, moodBase + moodBoost + moodNoise));

    // Focus: correlated with sleep + exercise
    const focusBase = clampedSleep >= 7 && exercised ? 5 : clampedSleep >= 7 ? 4 : clampedSleep >= 6 ? 3 : 2;
    const focusNoise = Math.floor(Math.random() * 2) - (Math.random() > 0.5 ? 1 : 0);
    const focus = Math.max(1, Math.min(5, focusBase + focusNoise));

    // Stress: higher on weekdays, lower with exercise
    const stressBase = isWeekend ? 2 : 3;
    const stressExercise = exercised ? -1 : 0;
    const stressNoise = Math.floor(Math.random() * 2);
    const stress = Math.max(1, Math.min(5, stressBase + stressExercise + stressNoise));

    // Headache: more likely with poor sleep + high stress
    const headacheChance = (clampedSleep < 6 ? 0.4 : 0.1) + (stress >= 4 ? 0.3 : 0);
    const headache = Math.random() < headacheChance;

    // Digestion: occasional, slightly correlated with stress
    const digestionChance = stress >= 4 ? 0.3 : 0.1;
    const digestion = Math.random() < digestionChance;

    // Skip some days randomly (realistic - people don't log every day)
    if (Math.random() < 0.08 && i > 2 && i < 27) continue;

    const signals: Partial<Record<SignalKey, number | boolean>> = {
      sleep: clampedSleep,
      energy,
      mood,
      focus,
      stress,
      headache,
      exercise: exercised,
      digestion,
    };

    const loggedAt = new Date(date);
    loggedAt.setHours(20 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));

    logs.push({
      date: dateStr,
      loggedAt: loggedAt.toISOString(),
      signals,
    });
  }

  return logs;
}

export const SAMPLE_SETTINGS = {
  activeSignals: ['sleep', 'energy', 'mood', 'focus', 'stress', 'headache', 'exercise', 'digestion'] as SignalKey[],
  unlockedSignals: ['sleep', 'energy', 'mood', 'focus', 'stress', 'headache', 'exercise', 'digestion'] as SignalKey[],
  onboardingComplete: true,
  focusSignal: 'focus' as SignalKey,
  reminderEnabled: false,
  reminderHour: 20,
  reminderMinute: 0,
};

export const SAMPLE_STREAK = {
  current: 7,
  longest: 14,
  lastLogDate: new Date().toISOString().split('T')[0],
  previousStreak: 10,
};
