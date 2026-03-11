import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import { Colors, Typography, Spacing, SignalConfig, SIGNAL_KEYS, SignalKey } from '../styles/theme';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';

const DAYS = ['m', 't', 'w', 't', 'f', 's', 's'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export function HistoryScreen() {
  const { logs, totalDays, deleteLog, settings } = useData();
  const { colors, isDark } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  // Improvement #10: trend timeline state
  const [trendRange, setTrendRange] = useState<30 | 60 | 90>(30);
  const [visibleTrendSignals, setVisibleTrendSignals] = useState<Set<SignalKey>>(new Set(['sleep', 'energy', 'mood']));
  const [selectedTrendDay, setSelectedTrendDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toLowerCase();

  const logMap = useMemo(() => {
    const map = new Map<string, typeof logs[0]>();
    logs.forEach(l => map.set(l.date, l));
    return map;
  }, [logs]);

  const navigateMonth = (dir: number) => {
    setCurrentDate(new Date(year, month + dir, 1));
    setSelectedDay(null);
  };

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

  // Improvement #10: trend data
  const trendData = useMemo(() => {
    const recentLogs = logs.slice(-trendRange);
    return recentLogs.map(l => {
      const vals: Partial<Record<SignalKey, number>> = {};
      for (const sig of SIGNAL_KEYS) {
        const v = l.signals[sig];
        if (v === undefined || v === null) continue;
        vals[sig] = typeof v === 'boolean' ? (v ? 1 : 0) : v;
      }
      return { date: l.date, values: vals };
    });
  }, [logs, trendRange]);

  const selectedLog = selectedDay ? logMap.get(selectedDay) : null;

  const toggleTrendSignal = (sig: SignalKey) => {
    setVisibleTrendSignals(prev => {
      const next = new Set(prev);
      if (next.has(sig)) next.delete(sig);
      else next.add(sig);
      return next;
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.deepSpace }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.starlight }]}>history</Text>

      {totalDays === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={[styles.emptyTitle, { color: colors.starlight }]}>no logs yet</Text>
          <Text style={[styles.emptyText, { color: colors.starlightDim }]}>no entries yet. tap + to log your first signals.</Text>
        </View>
      ) : (
        <>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButton} accessibilityLabel="previous month">
              <Text style={[styles.navArrow, { color: colors.nebulaPurple }]}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: colors.starlight }]}>{monthName}</Text>
            <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButton} accessibilityLabel="next month">
              <Text style={[styles.navArrow, { color: colors.nebulaPurple }]}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {DAYS.map((d, i) => (
              <Text key={`header-${i}`} style={[styles.dayHeader, { color: colors.starlightFaint }]}>{d}</Text>
            ))}
            {Array.from({ length: firstDay }, (_, i) => (
              <View key={`empty-${i}`} style={styles.calendarCell} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const log = logMap.get(dateStr);
              const signalCount = log ? Object.keys(log.signals).length : 0;
              const isSelected = selectedDay === dateStr;
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              let bgColor = colors.surface2;
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
                    isSelected && [styles.calendarCellSelected, { borderColor: colors.nebulaPurple }],
                    isToday && [styles.calendarCellToday, { borderColor: colors.auroraTeal }],
                  ]}
                  onPress={() => setSelectedDay(isSelected ? null : dateStr)}
                  accessibilityLabel={`${dateStr}: ${signalCount} signals logged`}
                >
                  <Text style={[
                    styles.dayNumber,
                    { color: colors.starlightFaint },
                    signalCount > 0 && [styles.dayNumberActive, { color: colors.starlight }],
                  ]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Improvement #3: Calendar heatmap legend */}
          <View style={styles.legendRow}>
            <Text style={[styles.legendLabel, { color: colors.starlightFaint }]}>fewer signals</Text>
            <View style={styles.legendGradient}>
              {[0.15, 0.3, 0.45, 0.6, 0.75, 0.85].map((alpha, i) => (
                <View key={i} style={[styles.legendBlock, { backgroundColor: `rgba(123, 104, 238, ${alpha})` }]} />
              ))}
            </View>
            <Text style={[styles.legendLabel, { color: colors.starlightFaint }]}>more signals</Text>
          </View>

          {/* Selected Day Detail */}
          {selectedLog && (
            <View style={[styles.dayDetail, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.dayDetailDate, { color: colors.nebulaPurple }]}>{selectedDay}</Text>
              {Object.entries(selectedLog.signals).map(([key, val]) => {
                const config = SignalConfig[key as SignalKey];
                if (!config) return null;
                const displayVal = typeof val === 'boolean' ? (val ? 'yes' : 'no') : String(val);
                return (
                  <View key={key} style={styles.signalRow}>
                    <Text style={styles.signalEmoji}>{config.emoji}</Text>
                    <Text style={[styles.signalLabel, { color: colors.starlight }]}>{config.label}</Text>
                    <Text style={[styles.signalValue, { color: config.color }]}>{displayVal}</Text>
                  </View>
                );
              })}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => setConfirmDelete(selectedDay)}
              >
                <Text style={[styles.deleteButtonText, { color: colors.ember }]}>delete this log</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Delete Confirmation Modal */}
          {confirmDelete && (
            <Modal visible transparent animationType="fade" onRequestClose={() => setConfirmDelete(null)}>
              <View style={styles.modalBackdrop}>
                <View style={[styles.modalCard, { backgroundColor: colors.surface2 }]}>
                  <Text style={[styles.modalTitle, { color: colors.starlight }]}>delete {(() => {
                    const d = new Date(confirmDelete + 'T12:00:00');
                    const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
                    return `${months[d.getMonth()]} ${d.getDate()} log`;
                  })()}?</Text>
                  <Text style={[styles.modalText, { color: colors.starlightDim }]}>this can't be undone.</Text>
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.modalCancel, { backgroundColor: colors.surface3 }]} onPress={() => setConfirmDelete(null)}>
                      <Text style={[styles.modalCancelText, { color: colors.starlightDim }]}>cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalDelete} onPress={async () => {
                      await deleteLog(confirmDelete);
                      setConfirmDelete(null);
                      setSelectedDay(null);
                    }}>
                      <Text style={[styles.modalDeleteText, { color: colors.ember }]}>delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* Sparklines */}
          {sparklines.length > 0 && (
            <View style={styles.sparklinesSection}>
              <Text style={[styles.sectionTitle, { color: colors.starlightDim }]}>60-day trends</Text>
              {sparklines.map(({ signal, values, avg }) => {
                const config = SignalConfig[signal];
                const max = Math.max(...values);
                const min = Math.min(...values);
                const range = max - min || 1;

                return (
                  <View key={signal} style={styles.sparklineRow}>
                    <View style={styles.sparklineLabel}>
                      <Text style={styles.sparklineEmoji}>{config.emoji}</Text>
                      <Text style={[styles.sparklineName, { color: colors.starlightDim }]}>{config.label}</Text>
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

          {/* Improvement #10: Interactive Trend Timeline */}
          {trendData.length > 3 && (
            <View style={styles.trendSection}>
              <Text style={[styles.sectionTitle, { color: colors.starlightDim }]}>interactive trends</Text>

              {/* Range toggle */}
              <View style={styles.trendRangeRow}>
                {([30, 60, 90] as const).map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.trendRangeButton, { backgroundColor: colors.surface2 }, trendRange === r && [styles.trendRangeButtonActive, { backgroundColor: colors.nebulaPurple + '30' }]]}
                    onPress={() => { setTrendRange(r); setSelectedTrendDay(null); }}
                  >
                    <Text style={[styles.trendRangeText, { color: colors.starlightFaint }, trendRange === r && [styles.trendRangeTextActive, { color: colors.nebulaPurple }]]}>{r}d</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Signal toggles */}
              <View style={styles.trendSignalRow}>
                {settings.activeSignals.map(sig => {
                  const cfg = SignalConfig[sig];
                  const active = visibleTrendSignals.has(sig);
                  return (
                    <TouchableOpacity
                      key={sig}
                      style={[styles.trendSignalPill, { backgroundColor: colors.surface2 }, active && { backgroundColor: cfg.color + '30', borderColor: cfg.color }]}
                      onPress={() => toggleTrendSignal(sig)}
                    >
                      <Text style={styles.trendSignalEmoji}>{cfg.emoji}</Text>
                      <Text style={[styles.trendSignalName, { color: colors.starlightFaint }, active && { color: cfg.color }]}>{cfg.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Chart area */}
              <View style={styles.trendChart}>
                {trendData.map((day, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.trendColumn}
                    onPress={() => setSelectedTrendDay(selectedTrendDay === idx ? null : idx)}
                    activeOpacity={0.7}
                  >
                    {Array.from(visibleTrendSignals).map(sig => {
                      const val = day.values[sig];
                      if (val === undefined) return null;
                      const cfg = SignalConfig[sig];
                      const maxVal = cfg.type === 'slider' ? (cfg.max || 12) : cfg.type === 'emoji' ? 5 : 1;
                      const height = Math.max(2, (val / maxVal) * 40);
                      return (
                        <View
                          key={sig}
                          style={[styles.trendDot, {
                            height,
                            backgroundColor: cfg.color,
                            opacity: selectedTrendDay === idx ? 1 : 0.6,
                          }]}
                        />
                      );
                    })}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Selected day tooltip */}
              {selectedTrendDay !== null && trendData[selectedTrendDay] && (
                <View style={[styles.trendTooltip, { backgroundColor: colors.surface2 }]}>
                  <Text style={[styles.trendTooltipDate, { color: colors.nebulaPurple }]}>{trendData[selectedTrendDay].date}</Text>
                  {Array.from(visibleTrendSignals).map(sig => {
                    const val = trendData[selectedTrendDay].values[sig];
                    if (val === undefined) return null;
                    const cfg = SignalConfig[sig];
                    return (
                      <Text key={sig} style={[styles.trendTooltipVal, { color: cfg.color }]}>
                        {cfg.emoji} {cfg.label}: {typeof val === 'number' && val % 1 !== 0 ? val.toFixed(1) : val}
                      </Text>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.deepSpace },
  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: Platform.OS === 'ios' ? 60 : 48 },
  title: { ...Typography.display, marginBottom: 24 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { ...Typography.heading, marginBottom: 8 },
  emptyText: { ...Typography.caption, textAlign: 'center' },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  navButton: { padding: 12, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  navArrow: { ...Typography.heading, color: Colors.nebulaPurple },
  monthLabel: { ...Typography.bodyBold },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 12 },
  dayHeader: { width: `${100 / 7 - 1.5}%`, textAlign: 'center', ...Typography.small, color: Colors.starlightFaint, marginBottom: 8 },
  calendarCell: {
    width: `${100 / 7 - 1.5}%`, aspectRatio: 1, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface2,
  },
  calendarCellSelected: { borderWidth: 2, borderColor: Colors.nebulaPurple },
  calendarCellToday: { borderWidth: 1, borderColor: Colors.auroraTeal },
  dayNumber: { ...Typography.small, color: Colors.starlightFaint },
  dayNumberActive: { color: Colors.starlight, fontFamily: 'Nunito_600SemiBold' },
  // Improvement #3: legend
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
  legendLabel: { ...Typography.small, color: Colors.starlightFaint, fontSize: 9 },
  legendGradient: { flexDirection: 'row', gap: 2 },
  legendBlock: { width: 16, height: 8, borderRadius: 2 },
  dayDetail: { backgroundColor: Colors.surface2, borderRadius: Spacing.borderRadius, padding: Spacing.cardPadding, marginBottom: 24 },
  dayDetailDate: { ...Typography.caption, color: Colors.nebulaPurple, marginBottom: 12 },
  signalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  signalEmoji: { fontSize: 20, width: 28 },
  signalLabel: { ...Typography.body, flex: 1 },
  signalValue: { ...Typography.bodyBold },
  sparklinesSection: { marginTop: 16 },
  sectionTitle: { ...Typography.caption, color: Colors.starlightDim, marginBottom: 16 },
  sparklineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  sparklineLabel: { flexDirection: 'row', alignItems: 'center', width: 90, gap: 6 },
  sparklineEmoji: { fontSize: 16 },
  sparklineName: { ...Typography.small, color: Colors.starlightDim },
  sparklineChart: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', height: 28, gap: 1 },
  sparklineBar: { flex: 1, borderRadius: 1, minWidth: 2 },
  sparklineAvg: { ...Typography.caption, width: 30, textAlign: 'right' },
  deleteButton: {
    marginTop: 16, paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.1)', borderRadius: 12, alignItems: 'center',
  },
  deleteButtonText: { ...Typography.caption, color: Colors.ember },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: Colors.surface2, borderRadius: Spacing.borderRadius, padding: 24, width: 280, alignItems: 'center' },
  modalTitle: { ...Typography.bodyBold, marginBottom: 8 },
  modalText: { ...Typography.caption, color: Colors.starlightDim, marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12, backgroundColor: Colors.surface3 },
  modalCancelText: { ...Typography.bodyBold, color: Colors.starlightDim },
  modalDelete: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12, backgroundColor: 'rgba(255, 107, 107, 0.2)' },
  modalDeleteText: { ...Typography.bodyBold, color: Colors.ember },
  // Improvement #10: trend styles
  trendSection: { marginTop: 32 },
  trendRangeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  trendRangeButton: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, backgroundColor: Colors.surface2 },
  trendRangeButtonActive: { backgroundColor: Colors.nebulaPurple + '30' },
  trendRangeText: { ...Typography.small, color: Colors.starlightFaint },
  trendRangeTextActive: { color: Colors.nebulaPurple },
  trendSignalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  trendSignalPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: 'transparent',
  },
  trendSignalEmoji: { fontSize: 12 },
  trendSignalName: { ...Typography.small, color: Colors.starlightFaint },
  trendChart: { flexDirection: 'row', alignItems: 'flex-end', height: 50, gap: 1, marginBottom: 8 },
  trendColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 1, minWidth: 2 },
  trendDot: { width: '100%', borderRadius: 1, minWidth: 2 },
  trendTooltip: {
    backgroundColor: Colors.surface2, borderRadius: 12, padding: 12, marginTop: 8,
  },
  trendTooltipDate: { ...Typography.small, color: Colors.nebulaPurple, marginBottom: 4 },
  trendTooltipVal: { ...Typography.small, marginVertical: 1 },
});
