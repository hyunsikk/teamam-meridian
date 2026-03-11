import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Share, Alert, Switch, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing } from '../styles/theme';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import * as Notifications from 'expo-notifications';

export function SettingsScreen() {
  const { settings, updateSettings, logs, resetAllData, loadSampleData } = useData();
  const { colors, isDark, setThemeMode } = useTheme();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  // Reminder scheduling
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

  const handleResetData = () => {
    Alert.alert(
      'reset all data',
      'this will permanently delete all your logs, settings, and insights. this cannot be undone.',
      [
        { text: 'cancel', style: 'cancel' },
        {
          text: 'reset everything',
          style: 'destructive',
          onPress: () => {
            resetAllData();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.deepSpace }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: colors.starlight }]}>settings</Text>

      {/* APPEARANCE */}
      <Text style={[styles.sectionHeader, { color: colors.starlightFaint }]}>appearance</Text>
      <View style={[styles.card, { backgroundColor: colors.surface2 }]}>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.starlight }]}>dark mode</Text>
          <Switch
            value={isDark}
            onValueChange={(val) => setThemeMode(val ? 'dark' : 'light')}
            trackColor={{ false: colors.surface3, true: colors.nebulaPurple + '60' }}
            thumbColor={isDark ? colors.nebulaPurple : colors.starlightFaint}
          />
        </View>
      </View>

      {/* NOTIFICATIONS */}
      <Text style={[styles.sectionHeader, { color: colors.starlightFaint }]}>notifications</Text>
      <View style={[styles.card, { backgroundColor: colors.surface2 }]}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: colors.starlight }]}>daily reminder</Text>
            <Text style={[styles.rowCaption, { color: colors.starlightDim }]}>get a nudge if you haven't logged today</Text>
          </View>
          <Switch
            value={settings.reminderEnabled}
            onValueChange={toggleReminder}
            trackColor={{ false: colors.surface3, true: colors.nebulaPurple + '60' }}
            thumbColor={settings.reminderEnabled ? colors.nebulaPurple : colors.starlightFaint}
          />
        </View>
        {settings.reminderEnabled && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.starlight }]}>reminder time</Text>
              <View style={styles.timeRow}>
                <TouchableOpacity onPress={() => adjustReminderTime(-1)} style={[styles.timeBtn, { backgroundColor: colors.surface3 }]}>
                  <Text style={[styles.timeBtnText, { color: colors.starlight }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.timeValue, { color: colors.nebulaPurple }]}>
                  {String(settings.reminderHour ?? 20).padStart(2, '0')}:{String(settings.reminderMinute ?? 0).padStart(2, '0')}
                </Text>
                <TouchableOpacity onPress={() => adjustReminderTime(1)} style={[styles.timeBtn, { backgroundColor: colors.surface3 }]}>
                  <Text style={[styles.timeBtnText, { color: colors.starlight }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>

      {/* DATA */}
      <Text style={[styles.sectionHeader, { color: colors.starlightFaint }]}>data</Text>
      <View style={[styles.card, { backgroundColor: colors.surface2 }]}>
        <TouchableOpacity style={styles.row} onPress={handleExportData} disabled={exporting}>
          <Text style={[styles.rowLabel, { color: colors.starlight }]}>export data (JSON)</Text>
          <Text style={[styles.rowAction, { color: colors.nebulaPurple }]}>{exporting ? 'exporting...' : '→'}</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <TouchableOpacity style={styles.row} onPress={() => {
          Alert.alert('load sample data', '30 days of realistic health data will be loaded. existing data will be replaced.', [
            { text: 'cancel', style: 'cancel' },
            { text: 'load', onPress: () => loadSampleData() },
          ]);
        }}>
          <Text style={[styles.rowLabel, { color: colors.nebulaPurple }]}>load sample data</Text>
          <Text style={[styles.rowAction, { color: colors.nebulaPurple }]}>→</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <TouchableOpacity style={styles.row} onPress={handleResetData}>
          <Text style={[styles.rowLabel, { color: colors.ember }]}>reset all data</Text>
          <Text style={[styles.rowAction, { color: colors.ember }]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* ABOUT */}
      <Text style={[styles.sectionHeader, { color: colors.starlightFaint }]}>about</Text>
      <View style={[styles.card, { backgroundColor: colors.surface2 }]}>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.starlight }]}>app version</Text>
          <Text style={[styles.rowValue, { color: colors.starlightDim }]}>1.1.0</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <View style={styles.row}>
          <Text style={[styles.rowCaption, { color: colors.starlightDim }]}>
            meridian provides general wellness information based on published research. it does not diagnose, treat, or cure any medical condition. always consult a qualified healthcare provider.
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: Platform.OS === 'ios' ? 60 : 48 },
  title: { ...Typography.display, marginBottom: 24 },
  sectionHeader: {
    ...Typography.small,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 24,
    fontFamily: 'Nunito_600SemiBold',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  rowLabel: { ...Typography.body },
  rowCaption: { ...Typography.small, lineHeight: 18, marginTop: 2 },
  rowValue: { ...Typography.body },
  rowAction: { ...Typography.bodyBold, fontSize: 18 },
  divider: { height: 1, marginHorizontal: 16 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  timeBtnText: { ...Typography.heading, fontSize: 16 },
  timeValue: { ...Typography.bodyBold, fontSize: 18 },
});
