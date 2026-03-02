import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Share, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { Colors, Typography, Spacing, SignalConfig, SIGNAL_KEYS, CORE_SIGNALS, SignalKey } from '../styles/theme';
import { useData } from '../context/DataContext';
import * as Notifications from 'expo-notifications';

export function SettingsScreen() {
  const { settings, updateSettings, totalDays, logs } = useData();
  const [exporting, setExporting] = useState(false);

  // Improvement #6: reminder scheduling
  const scheduleReminder = async (hour: number, minute: number) => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('notifications disabled', 'enable notifications in your device settings to use reminders.');
        return false;
      }
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'meridian',
          body: "you haven't logged today",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      return true;
    } catch (e) {
      console.warn('Failed to schedule notification', e);
      return false;
    }
  };

  const cancelReminder = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.warn('Failed to cancel notification', e);
    }
  };

  const toggleReminder = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (settings.reminderEnabled) {
      await cancelReminder();
      await updateSettings({ reminderEnabled: false });
    } else {
      const hour = settings.reminderHour ?? 20;
      const minute = settings.reminderMinute ?? 0;
      const success = await scheduleReminder(hour, minute);
      if (success) {
        await updateSettings({ reminderEnabled: true, reminderHour: hour, reminderMinute: minute });
      }
    }
  };

  const adjustReminderTime = async (dir: number) => {
    const currentHour = settings.reminderHour ?? 20;
    const newHour = Math.max(6, Math.min(23, currentHour + dir));
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    await updateSettings({ reminderHour: newHour });
    if (settings.reminderEnabled) {
      await scheduleReminder(newHour, settings.reminderMinute ?? 0);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const exportData = JSON.stringify({ logs, settings, exportedAt: new Date().toISOString() }, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meridian-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ message: exportData, title: 'meridian data export' });
      }
    } catch (e) {
      Alert.alert('export failed', 'something went wrong. try again.');
    } finally {
      setExporting(false);
    }
  };

  const toggleSignal = async (signal: SignalKey) => {
    if (CORE_SIGNALS.includes(signal)) return;
    
    const current = settings.activeSignals;
    let updated: SignalKey[];
    if (current.includes(signal)) {
      updated = current.filter(s => s !== signal);
    } else {
      updated = [...current, signal];
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSettings({ activeSignals: updated });
  };

  const isUnlocked = (signal: SignalKey): boolean => {
    return settings.unlockedSignals.includes(signal);
  };

  const daysUntilUnlock = (signal: SignalKey): number | null => {
    if (isUnlocked(signal)) return null;
    if (totalDays < 7) return 7 - totalDays;
    if (totalDays < 14) return 14 - totalDays;
    return 0;
  };

  // Improvement #8: focus signal
  const setFocusSignal = async (signal: SignalKey | undefined) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSettings({ focusSignal: signal });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>signals</Text>
      <Text style={styles.subtitle}>choose which signals to track daily. core signals are always active.</Text>

      {SIGNAL_KEYS.map(sig => {
        const config = SignalConfig[sig];
        const isCore = CORE_SIGNALS.includes(sig);
        const isActive = settings.activeSignals.includes(sig);
        const unlocked = isUnlocked(sig);
        const daysLeft = daysUntilUnlock(sig);

        return (
          <TouchableOpacity
            key={sig}
            style={[styles.signalRow, isActive && styles.signalRowActive, !unlocked && styles.signalRowLocked]}
            onPress={() => unlocked ? toggleSignal(sig) : null}
            activeOpacity={unlocked ? 0.7 : 1}
            accessibilityLabel={`${config.label}: ${isActive ? 'active' : 'inactive'}`}
          >
            <Text style={styles.signalEmoji}>{config.emoji}</Text>
            <View style={styles.signalInfo}>
              <Text style={styles.signalName}>{config.label}</Text>
              <Text style={styles.signalDesc}>{config.description}</Text>
            </View>
            {isCore ? (
              <View style={styles.coreBadge}><Text style={styles.coreBadgeText}>core</Text></View>
            ) : unlocked ? (
              <View style={[styles.toggle, isActive && styles.toggleActive]}>
                <View style={[styles.toggleDot, isActive && styles.toggleDotActive]} />
              </View>
            ) : (
              <View style={styles.lockBadge}>
                <Text style={styles.lockBadgeText}>
                  {daysLeft ? `🔒 ${daysLeft}d` : '🔒'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      <Text style={styles.footerNote}>
        more signals unlock as you build the logging habit. consistency is the key.
      </Text>

      {/* Improvement #8: Focus Signal / Goal Setting */}
      <View style={styles.goalSection}>
        <Text style={styles.goalTitle}>🎯 your goal</Text>
        <Text style={styles.goalDesc}>pick one signal to focus on. recommendations and insights will prioritize it.</Text>
        <View style={styles.goalGrid}>
          {settings.activeSignals.map(sig => {
            const config = SignalConfig[sig];
            const isFocus = settings.focusSignal === sig;
            return (
              <TouchableOpacity
                key={sig}
                style={[styles.goalPill, isFocus && { backgroundColor: config.color + '30', borderColor: config.color }]}
                onPress={() => setFocusSignal(isFocus ? undefined : sig)}
              >
                <Text style={styles.goalEmoji}>{config.emoji}</Text>
                <Text style={[styles.goalName, isFocus && { color: config.color }]}>{config.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {settings.focusSignal && (
          <Text style={styles.goalActive}>
            focusing on: {SignalConfig[settings.focusSignal]?.label || settings.focusSignal}
          </Text>
        )}
      </View>

      {/* Improvement #6: Daily Reminder */}
      <View style={styles.reminderCard}>
        <Text style={styles.reminderTitle}>⏰ daily reminder</Text>
        <Text style={styles.reminderDesc}>get a nudge if you haven't logged today.</Text>
        <View style={styles.reminderRow}>
          <TouchableOpacity
            style={[styles.toggle, settings.reminderEnabled && styles.toggleActive]}
            onPress={toggleReminder}
          >
            <View style={[styles.toggleDot, settings.reminderEnabled && styles.toggleDotActive]} />
          </TouchableOpacity>
          <Text style={styles.reminderStatus}>{settings.reminderEnabled ? 'on' : 'off'}</Text>
        </View>
        {settings.reminderEnabled && (
          <View style={styles.reminderTimeRow}>
            <TouchableOpacity onPress={() => adjustReminderTime(-1)} style={styles.reminderTimeBtn}>
              <Text style={styles.reminderTimeBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.reminderTime}>
              {String(settings.reminderHour ?? 20).padStart(2, '0')}:{String(settings.reminderMinute ?? 0).padStart(2, '0')}
            </Text>
            <TouchableOpacity onPress={() => adjustReminderTime(1)} style={styles.reminderTimeBtn}>
              <Text style={styles.reminderTimeBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Data Export */}
      <View style={styles.exportCard}>
        <Text style={styles.exportDesc}>download all your data as json. your data, your choice.</Text>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportData}
          disabled={exporting}
          activeOpacity={0.7}
          accessibilityLabel="export your data"
          accessibilityRole="button"
        >
          <Text style={styles.exportButtonText}>{exporting ? 'exporting...' : 'export your data'}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.deepSpace },
  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: Platform.OS === 'ios' ? 60 : 48 },
  title: { ...Typography.display, marginBottom: 8 },
  subtitle: { ...Typography.caption, marginBottom: 32 },
  signalRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface2,
    padding: 16, borderRadius: 16, marginBottom: 10, gap: 14,
    borderWidth: 2, borderColor: 'transparent',
  },
  signalRowActive: { borderColor: Colors.nebulaPurple + '40' },
  signalRowLocked: { opacity: 0.5 },
  signalEmoji: { fontSize: 28 },
  signalInfo: { flex: 1 },
  signalName: { ...Typography.bodyBold, marginBottom: 2 },
  signalDesc: { ...Typography.small, color: Colors.starlightDim },
  coreBadge: { backgroundColor: Colors.auroraTeal + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  coreBadgeText: { ...Typography.small, color: Colors.auroraTeal },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: Colors.surface3, justifyContent: 'center', padding: 2 },
  toggleActive: { backgroundColor: Colors.nebulaPurple + '40' },
  toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.starlightFaint },
  toggleDotActive: { backgroundColor: Colors.nebulaPurple, alignSelf: 'flex-end' },
  lockBadge: { paddingHorizontal: 10, paddingVertical: 4 },
  lockBadgeText: { ...Typography.small, color: Colors.starlightFaint },
  footerNote: { ...Typography.caption, color: Colors.starlightFaint, textAlign: 'center', marginTop: 24, lineHeight: 20 },
  // Improvement #8: goal styles
  goalSection: { marginTop: 32, backgroundColor: Colors.surface2, borderRadius: 16, padding: 20 },
  goalTitle: { ...Typography.bodyBold, marginBottom: 6 },
  goalDesc: { ...Typography.caption, color: Colors.starlightDim, marginBottom: 16, lineHeight: 20 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: Colors.surface3, borderWidth: 1, borderColor: 'transparent',
  },
  goalEmoji: { fontSize: 16 },
  goalName: { ...Typography.small, color: Colors.starlightDim },
  goalActive: { ...Typography.small, color: Colors.nebulaPurple, marginTop: 12, textAlign: 'center' },
  // Improvement #6: reminder styles
  reminderCard: { backgroundColor: Colors.surface2, borderRadius: 16, padding: 20, marginTop: 20 },
  reminderTitle: { ...Typography.bodyBold, marginBottom: 6 },
  reminderDesc: { ...Typography.caption, color: Colors.starlightDim, marginBottom: 16, lineHeight: 20 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reminderStatus: { ...Typography.caption, color: Colors.starlightDim },
  reminderTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 },
  reminderTimeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface3, alignItems: 'center', justifyContent: 'center' },
  reminderTimeBtnText: { ...Typography.heading, color: Colors.starlight, fontSize: 18 },
  reminderTime: { ...Typography.bodyBold, color: Colors.nebulaPurple, fontSize: 20 },
  exportCard: { backgroundColor: Colors.surface2, borderRadius: 16, padding: 20, marginTop: 20 },
  exportDesc: { ...Typography.caption, color: Colors.starlightDim, marginBottom: 16, lineHeight: 20 },
  exportButton: { backgroundColor: Colors.surface3, paddingVertical: 14, borderRadius: 12, alignItems: 'center', minHeight: 48 },
  exportButtonText: { ...Typography.bodyBold, color: Colors.starlight },
});
