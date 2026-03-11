import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView,
  Dimensions, Platform, PanResponder, Animated as RNAnimated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, SignalConfig, SignalKey } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = Math.min(SCREEN_WIDTH - 80, 280);

interface Props {
  onClose: () => void;
}

export function QuickLogSheet({ onClose }: Props) {
  const { colors } = useTheme();
  const { addLog, logs, settings } = useData();
  const activeSignals = settings.activeSignals;
  const today = new Date().toISOString().split('T')[0];
  const existingLog = logs.find(l => l.date === today);

  // Pre-fill with existing values or smart defaults
  const getDefault = (sig: SignalKey): number | boolean | undefined => {
    if (existingLog?.signals[sig] !== undefined) return existingLog.signals[sig];
    return undefined;
  };

  const [values, setValues] = useState<Partial<Record<SignalKey, number | boolean>>>(() => {
    const initial: Partial<Record<SignalKey, number | boolean>> = {};
    activeSignals.forEach(sig => {
      const existing = getDefault(sig as SignalKey);
      if (existing !== undefined) initial[sig as SignalKey] = existing;
    });
    return initial;
  });

  // Sleep slider state
  const initialSleep = typeof values.sleep === 'number' ? values.sleep : 7;
  const sliderX = useRef(new RNAnimated.Value(SLIDER_WIDTH * (initialSleep / 12))).current;
  const [sliderDisplayValue, setSliderDisplayValue] = useState(initialSleep);
  const sliderXRef = useRef(SLIDER_WIDTH * (initialSleep / 12));

  const handleValue = (sig: SignalKey, val: number | boolean) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setValues(prev => ({ ...prev, [sig]: val }));
  };

  const handleSave = async () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const filledValues = { ...(existingLog?.signals || {}), ...values };
    await addLog({
      date: today,
      loggedAt: new Date().toISOString(),
      signals: filledValues,
    });
    onClose();
  };

  const filledCount = activeSignals.filter(sig => values[sig as SignalKey] !== undefined).length;
  const totalCount = activeSignals.length;

  // Sleep slider PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const locationX = evt.nativeEvent.locationX;
        const clamped = Math.max(0, Math.min(SLIDER_WIDTH, locationX));
        sliderXRef.current = clamped;
        sliderX.setValue(clamped);
        const raw = (clamped / SLIDER_WIDTH) * 12;
        const snapped = Math.round(raw * 2) / 2;
        setSliderDisplayValue(snapped);
        handleValue('sleep', snapped);
      },
      onPanResponderMove: (_, gs) => {
        const newX = Math.max(0, Math.min(SLIDER_WIDTH, sliderXRef.current + gs.dx));
        sliderX.setValue(newX);
        const raw = (newX / SLIDER_WIDTH) * 12;
        const snapped = Math.round(raw * 2) / 2;
        if (snapped !== sliderDisplayValue) {
          setSliderDisplayValue(snapped);
          handleValue('sleep', snapped);
          if (Platform.OS !== 'web') Haptics.selectionAsync();
        }
      },
      onPanResponderRelease: (_, gs) => {
        const newX = Math.max(0, Math.min(SLIDER_WIDTH, sliderXRef.current + gs.dx));
        sliderXRef.current = newX;
        const raw = (newX / SLIDER_WIDTH) * 12;
        const snapped = Math.round(raw * 2) / 2;
        const snappedX = (snapped / 12) * SLIDER_WIDTH;
        RNAnimated.spring(sliderX, { toValue: snappedX, useNativeDriver: false, friction: 8 }).start();
        sliderXRef.current = snappedX;
        setSliderDisplayValue(snapped);
        handleValue('sleep', snapped);
      },
    })
  ).current;

  const renderSignal = (sig: SignalKey) => {
    const config = SignalConfig[sig];
    if (!config) return null;
    const currentValue = values[sig];

    return (
      <View key={sig} style={[
        styles.signalSection,
        { borderBottomColor: colors.divider },
        config.type === 'toggle' && styles.signalSectionCompact,
      ]}>
        <View style={styles.signalHeader}>
          <Text style={styles.signalEmoji}>{config.emoji}</Text>
          <Text style={[styles.signalLabel, { color: colors.starlight }]}>{config.label}</Text>
          {config.type === 'toggle' ? (
            <View style={styles.toggleInlineRow}>
              <TouchableOpacity
                onPress={() => handleValue(sig, false)}
                style={[
                  styles.toggleInlineOption,
                  { backgroundColor: colors.surface3 },
                  currentValue === false && { backgroundColor: colors.auroraTeal + '20', borderColor: colors.auroraTeal },
                ]}
              >
                <Text style={[styles.toggleInlineText, { color: colors.starlightDim }, currentValue === false && { color: colors.auroraTeal }]}>no</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleValue(sig, true)}
                style={[
                  styles.toggleInlineOption,
                  { backgroundColor: colors.surface3 },
                  currentValue === true && { backgroundColor: config.color + '25', borderColor: config.color },
                ]}
              >
                <Text style={[styles.toggleInlineText, { color: colors.starlightDim }, currentValue === true && { color: config.color }]}>yes</Text>
              </TouchableOpacity>
            </View>
          ) : currentValue !== undefined ? (
            <Text style={[styles.signalValue, { color: config.color }]}>
              {config.type === 'slider' ? `${currentValue}h` : `${currentValue}/5`}
            </Text>
          ) : null}
        </View>

        {config.type === 'emoji' && config.options && (
          <View style={styles.emojiRow}>
            {config.options.map((opt, i) => {
              const val = i + 1;
              const selected = currentValue === val;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleValue(sig, val)}
                  style={[
                    styles.emojiOption,
                    { backgroundColor: colors.surface3 },
                    selected && { backgroundColor: config.color + '25', borderColor: config.color },
                  ]}
                >
                  <Text style={[styles.emojiText, selected && styles.emojiTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {config.type === 'slider' && (
          <View style={styles.sliderArea}>
            <View style={styles.sliderWrapper} {...panResponder.panHandlers}>
              <View style={[styles.sliderTrack, { width: SLIDER_WIDTH, backgroundColor: colors.surface3 }]}>
                <RNAnimated.View style={[styles.sliderFill, { width: sliderX, backgroundColor: config.color }]} />
              </View>
              <RNAnimated.View
                style={[styles.sliderThumb, {
                  backgroundColor: config.color,
                  borderColor: colors.surface2,
                  transform: [{ translateX: RNAnimated.subtract(sliderX, 12) }],
                }]}
              />
            </View>
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabelText, { color: colors.starlightFaint }]}>0h</Text>
              <Text style={[styles.sliderLabelText, { color: config.color, fontFamily: 'Nunito_700Bold', fontSize: 14 }]}>
                {typeof currentValue === 'number' ? currentValue.toFixed(1) : sliderDisplayValue.toFixed(1)}h
              </Text>
              <Text style={[styles.sliderLabelText, { color: colors.starlightFaint }]}>12h</Text>
            </View>
          </View>
        )}

        {/* Toggle: no separate input area — inline in the header */}
      </View>
    );
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface2 }]}>
          <View style={[styles.handle, { backgroundColor: colors.divider }]} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.title, { color: colors.starlight }]}>
                {existingLog ? 'update today' : 'log today'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.starlightDim }]}>
                {filledCount}/{totalCount} signals
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: colors.starlightFaint }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* All signals in one scroll */}
          <ScrollView
            style={styles.signalList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.signalListContent}
          >
            {activeSignals.map(sig => renderSignal(sig as SignalKey))}
          </ScrollView>

          {/* Save button with gradient backdrop */}
          <View style={styles.saveArea}>
            <View style={[styles.saveGradient, { backgroundColor: colors.surface2 }]} />
            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveButton,
                { backgroundColor: filledCount > 0 ? colors.nebulaPurple : colors.surface3 },
              ]}
              disabled={filledCount === 0}
            >
              <Text style={[styles.saveText, { color: filledCount > 0 ? '#fff' : colors.starlightFaint }]}>
                {filledCount === 0 ? 'tap to log' : existingLog ? `update (${filledCount}/${totalCount})` : `save (${filledCount}/${totalCount})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  sheet: {
    borderTopLeftRadius: Spacing.sheetRadius, borderTopRightRadius: Spacing.sheetRadius,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { ...Typography.heading, marginBottom: 2 },
  subtitle: { ...Typography.caption },
  closeButton: { padding: 8, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 20 },

  // Signal list
  signalList: { flex: 1 },
  signalListContent: { paddingBottom: 20 },

  // Signal section
  signalSection: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  signalSectionCompact: { marginBottom: 8, paddingBottom: 8 },
  signalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  signalEmoji: { fontSize: 22 },
  signalLabel: { ...Typography.bodyBold, flex: 1 },
  signalValue: { ...Typography.caption },

  // Emoji options (compact)
  emojiRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  emojiOption: {
    width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  emojiText: { fontSize: 26, opacity: 0.4 },
  emojiTextSelected: { opacity: 1, fontSize: 30 },

  // Slider (sleep)
  sliderArea: { alignItems: 'center' },
  sliderWrapper: { width: SLIDER_WIDTH, height: 36, justifyContent: 'center' },
  sliderTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  sliderFill: { height: '100%', borderRadius: 3 },
  sliderThumb: {
    position: 'absolute', top: 6, width: 24, height: 24, borderRadius: 12,
    borderWidth: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 3,
  },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', width: SLIDER_WIDTH, marginTop: 6 },
  sliderLabelText: { ...Typography.small, fontSize: 10 },

  // Toggle (compact inline yes/no)
  toggleInlineRow: { flexDirection: 'row', gap: 10 },
  toggleInlineOption: {
    paddingHorizontal: 22, paddingVertical: 10, borderRadius: 12,
    borderWidth: 2, borderColor: 'transparent',
  },
  toggleInlineText: { ...Typography.caption, fontFamily: 'Nunito_700Bold' },

  // Save area
  saveArea: { position: 'relative', paddingTop: 8 },
  saveGradient: { position: 'absolute', top: -20, left: -Spacing.screenPadding, right: -Spacing.screenPadding, height: 20, opacity: 0.9 },
  saveButton: {
    paddingVertical: 16, borderRadius: Spacing.borderRadius,
    alignItems: 'center',
  },
  saveText: { ...Typography.bodyBold, fontSize: 16 },
});
