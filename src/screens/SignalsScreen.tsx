import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Share, Alert, Switch } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { Colors, Typography, Spacing, SignalConfig, SIGNAL_KEYS, CORE_SIGNALS, SignalKey } from '../styles/theme';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import * as Notifications from 'expo-notifications';

export function SignalsScreen() {
  const { settings, updateSettings, totalDays, logs } = useData();
  const { colors, isDark } = useTheme();

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

  const setFocusSignal = async (signal: SignalKey | undefined) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSettings({ focusSignal: signal });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.deepSpace }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: colors.starlight }]}>signals</Text>
      <Text style={[styles.subtitle, { color: colors.starlightDim }]}>choose which signals to track daily. core signals are always active.</Text>

      {SIGNAL_KEYS.map(sig => {
        const config = SignalConfig[sig];
        const isCore = CORE_SIGNALS.includes(sig);
        const isActive = settings.activeSignals.includes(sig);
        const unlocked = isUnlocked(sig);
        const daysLeft = daysUntilUnlock(sig);

        return (
          <TouchableOpacity
            key={sig}
            style={[
              styles.signalRow,
              { backgroundColor: colors.surface2, borderColor: 'transparent' },
              isActive && { borderColor: colors.nebulaPurple + '40' },
              !unlocked && styles.signalRowLocked,
            ]}
            onPress={() => unlocked ? toggleSignal(sig) : null}
            activeOpacity={unlocked ? 0.7 : 1}
            accessibilityLabel={`${config.label}: ${isActive ? 'active' : 'inactive'}`}
          >
            <Text style={styles.signalEmoji}>{config.emoji}</Text>
            <View style={styles.signalInfo}>
              <Text style={[styles.signalName, { color: colors.starlight }]}>{config.label}</Text>
              <Text style={[styles.signalDesc, { color: colors.starlightDim }]}>{config.description}</Text>
            </View>
            {isCore ? (
              <View style={[styles.coreBadge, { backgroundColor: colors.auroraTeal + '20' }]}><Text style={[styles.coreBadgeText, { color: colors.auroraTeal }]}>core</Text></View>
            ) : unlocked ? (
              <Switch
                value={isActive}
                onValueChange={() => toggleSignal(sig)}
                trackColor={{ false: colors.surface3, true: colors.nebulaPurple + '60' }}
                thumbColor={isActive ? colors.nebulaPurple : colors.starlightFaint}
              />
            ) : (
              <View style={styles.lockBadge}>
                <Text style={[styles.lockBadgeText, { color: colors.starlightFaint }]}>
                  {daysLeft ? `🔒 ${daysLeft}d` : '🔒'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      <Text style={[styles.footerNote, { color: colors.starlightFaint }]}>
        more signals unlock as you build the logging habit. consistency is the key.
      </Text>

      {/* Focus Signal / Goal Setting */}
      <View style={[styles.goalSection, { backgroundColor: colors.surface2 }]}>
        <Text style={[styles.goalTitle, { color: colors.starlight }]}>🎯 your goal</Text>
        <Text style={[styles.goalDesc, { color: colors.starlightDim }]}>pick one signal to focus on. recommendations and insights will prioritize it.</Text>
        <View style={styles.goalGrid}>
          {settings.activeSignals.map(sig => {
            const config = SignalConfig[sig];
            const isFocus = settings.focusSignal === sig;
            return (
              <TouchableOpacity
                key={sig}
                style={[styles.goalPill, { backgroundColor: isFocus ? config.color + '30' : colors.surface3, borderColor: isFocus ? config.color : 'transparent' }]}
                onPress={() => setFocusSignal(isFocus ? undefined : sig)}
              >
                <Text style={styles.goalEmoji}>{config.emoji}</Text>
                <Text style={[styles.goalName, { color: isFocus ? config.color : colors.starlightDim }]}>{config.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {settings.focusSignal && (
          <Text style={[styles.goalActive, { color: colors.nebulaPurple }]}>
            focusing on: {SignalConfig[settings.focusSignal]?.label || settings.focusSignal}
          </Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: Platform.OS === 'ios' ? 60 : 48 },
  title: { ...Typography.display, marginBottom: 8 },
  subtitle: { ...Typography.caption, marginBottom: 32 },
  signalRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 16, marginBottom: 10, gap: 14,
    borderWidth: 2,
  },
  signalRowLocked: { opacity: 0.5 },
  signalEmoji: { fontSize: 28 },
  signalInfo: { flex: 1 },
  signalName: { ...Typography.bodyBold, marginBottom: 2 },
  signalDesc: { ...Typography.small },
  coreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  coreBadgeText: { ...Typography.small },


  lockBadge: { paddingHorizontal: 10, paddingVertical: 4 },
  lockBadgeText: { ...Typography.small },
  footerNote: { ...Typography.caption, textAlign: 'center', marginTop: 24, lineHeight: 20 },
  goalSection: { marginTop: 32, borderRadius: 16, padding: 20 },
  goalTitle: { ...Typography.bodyBold, marginBottom: 6 },
  goalDesc: { ...Typography.caption, marginBottom: 16, lineHeight: 20 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1,
  },
  goalEmoji: { fontSize: 16 },
  goalName: { ...Typography.small },
  goalActive: { ...Typography.small, marginTop: 12, textAlign: 'center' },
});
