import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Colors, Typography, Spacing, SignalConfig, SIGNAL_KEYS, SignalKey } from '../styles/theme';
import { useData } from '../context/DataContext';
import { rollingAverage } from '../utils/correlationEngine';

const DAYS = ['m', 't', 'w', 't', 'f', 's', 's'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
}

export function HistoryScreen() {
  const { logs, totalDays } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toLowerCase();

  // Create log lookup
  const logMap = useMemo(() => {
    const map = new Map<string, typeof logs[0]>();
    logs.forEach(l => map.set(l.date, l));
    return map;
  }, [logs]);

  const navigateMonth = (dir: number) => {
    setCurrentDate(new Date(year, month + dir, 1));
    setSelectedDay(null);
  };

  // Sparkline data for each signal
  const sparklines = useMemo(() => {
    const result: { signal: SignalKey; values: number[]; avg: number }[] = [];
    for (const sig of SIGNAL_KEYS) {
      const vals = logs
        .slice(-60)
        .map(l => {
          const v = l.signals[sig];
          if (v === undefined || v === null) return null;
          if (typeof v === 'boolean') return v ? 1 : 0;
          return v;
        })
        .filter((v): v is number => v !== null);

      if (vals.length > 2) {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        result.push({ signal: sig, values: vals, avg: Math.round(avg * 10) / 10 });
      }
    }
    return result;
  }, [logs]);

  // Selected day data
  const selectedLog = selectedDay ? logMap.get(selectedDay) : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>history</Text>

      {totalDays === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>no logs yet</Text>
          <Text style={styles.emptyText}>start logging to see your history here.</Text>
        </View>
      ) : (
        <>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButton} accessibilityLabel="previous month">
              <Text style={styles.navArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthName}</Text>
            <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButton} accessibilityLabel="next month">
              <Text style={styles.navArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {/* Day headers */}
            {DAYS.map((d, i) => (
              <Text key={`header-${i}`} style={styles.dayHeader}>{d}</Text>
            ))}

            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }, (_, i) => (
              <View key={`empty-${i}`} style={styles.calendarCell} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const log = logMap.get(dateStr);
              const signalCount = log ? Object.keys(log.signals).length : 0;
              const isSelected = selectedDay === dateStr;
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              // Color based on completeness
              let bgColor = Colors.surface2;
              if (signalCount > 0) {
                const alpha = Math.min(signalCount / 8, 1) * 0.7 + 0.15;
                bgColor = `rgba(123, 104, 238, ${alpha})`;
              }

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.calendarCell,
                    { backgroundColor: bgColor },
                    isSelected && styles.calendarCellSelected,
                    isToday && styles.calendarCellToday,
                  ]}
                  onPress={() => setSelectedDay(isSelected ? null : dateStr)}
                  accessibilityLabel={`${dateStr}: ${signalCount} signals logged`}
                >
                  <Text style={[
                    styles.dayNumber,
                    signalCount > 0 && styles.dayNumberActive,
                  ]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Day Detail */}
          {selectedLog && (
            <View style={styles.dayDetail}>
              <Text style={styles.dayDetailDate}>{selectedDay}</Text>
              {Object.entries(selectedLog.signals).map(([key, val]) => {
                const config = SignalConfig[key as SignalKey];
                if (!config) return null;
                const displayVal = typeof val === 'boolean' ? (val ? 'yes' : 'no') : String(val);
                return (
                  <View key={key} style={styles.signalRow}>
                    <Text style={styles.signalEmoji}>{config.emoji}</Text>
                    <Text style={styles.signalLabel}>{config.label}</Text>
                    <Text style={[styles.signalValue, { color: config.color }]}>{displayVal}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Sparklines */}
          {sparklines.length > 0 && (
            <View style={styles.sparklinesSection}>
              <Text style={styles.sectionTitle}>60-day trends</Text>
              {sparklines.map(({ signal, values, avg }) => {
                const config = SignalConfig[signal];
                const max = Math.max(...values);
                const min = Math.min(...values);
                const range = max - min || 1;

                return (
                  <View key={signal} style={styles.sparklineRow}>
                    <View style={styles.sparklineLabel}>
                      <Text style={styles.sparklineEmoji}>{config.emoji}</Text>
                      <Text style={styles.sparklineName}>{config.label}</Text>
                    </View>
                    <View style={styles.sparklineChart}>
                      {values.map((v, i) => (
                        <View
                          key={i}
                          style={[
                            styles.sparklineBar,
                            {
                              height: 4 + ((v - min) / range) * 20,
                              backgroundColor: config.color,
                              opacity: 0.3 + (i / values.length) * 0.7,
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={[styles.sparklineAvg, { color: config.color }]}>
                      {avg}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepSpace,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
  },
  title: {
    ...Typography.display,
    marginBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    ...Typography.heading,
    marginBottom: 8,
  },
  emptyText: {
    ...Typography.caption,
    textAlign: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    ...Typography.heading,
    color: Colors.nebulaPurple,
  },
  monthLabel: {
    ...Typography.bodyBold,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 24,
  },
  dayHeader: {
    width: `${100 / 7 - 1.5}%`,
    textAlign: 'center',
    ...Typography.small,
    color: Colors.starlightFaint,
    marginBottom: 8,
  },
  calendarCell: {
    width: `${100 / 7 - 1.5}%`,
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface2,
  },
  calendarCellSelected: {
    borderWidth: 2,
    borderColor: Colors.nebulaPurple,
  },
  calendarCellToday: {
    borderWidth: 1,
    borderColor: Colors.auroraTeal,
  },
  dayNumber: {
    ...Typography.small,
    color: Colors.starlightFaint,
  },
  dayNumberActive: {
    color: Colors.starlight,
    fontFamily: 'Nunito_600SemiBold',
  },
  dayDetail: {
    backgroundColor: Colors.surface2,
    borderRadius: Spacing.borderRadius,
    padding: Spacing.cardPadding,
    marginBottom: 24,
  },
  dayDetailDate: {
    ...Typography.caption,
    color: Colors.nebulaPurple,
    marginBottom: 12,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  signalEmoji: {
    fontSize: 20,
    width: 28,
  },
  signalLabel: {
    ...Typography.body,
    flex: 1,
  },
  signalValue: {
    ...Typography.bodyBold,
  },
  sparklinesSection: {
    marginTop: 16,
  },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.starlightDim,
    marginBottom: 16,
  },
  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sparklineLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
    gap: 6,
  },
  sparklineEmoji: {
    fontSize: 16,
  },
  sparklineName: {
    ...Typography.small,
    color: Colors.starlightDim,
  },
  sparklineChart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 28,
    gap: 1,
  },
  sparklineBar: {
    flex: 1,
    borderRadius: 1,
    minWidth: 2,
  },
  sparklineAvg: {
    ...Typography.caption,
    width: 30,
    textAlign: 'right',
  },
});
