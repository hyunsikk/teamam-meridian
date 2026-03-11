import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Dimensions, Platform, PanResponder, Animated as RNAnimated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, SignalConfig, SignalKey } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = Math.min(SCREEN_WIDTH - 80, 300);

// Improvement #4: time-of-day prompt
function getTimeOfDayPrompt(signalType: string, label: string): string {
  const hour = new Date().getHours();
  if (signalType === 'slider') return 'how many hours?';
  if (signalType === 'toggle') return 'today?';
  if (hour >= 5 && hour < 12) return `how's your ${label} this morning?`;
  if (hour >= 12 && hour < 17) return `how's your ${label} this afternoon?`;
  return `how are you feeling this evening?`;
}

interface Props {
  onClose: () => void;
}

export function QuickLogSheet({ onClose }: Props) {
  const { colors } = useTheme();
  const { addLog, logs, settings } = useData();
  const activeSignals = settings.activeSignals;
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Partial<Record<SignalKey, number | boolean>>>({});

  // Smooth slider state
  const sliderX = useRef(new RNAnimated.Value(SLIDER_WIDTH * (7 / 12))).current;
  const [sliderDisplayValue, setSliderDisplayValue] = useState(7);
  const sliderXRef = useRef(SLIDER_WIDTH * (7 / 12));

  const currentSignal = activeSignals[stepIndex] as SignalKey;
  const config = SignalConfig[currentSignal];
  const isLast = stepIndex === activeSignals.length - 1;
  const today = new Date().toISOString().split('T')[0];
  const existingLog = logs.find(l => l.date === today);

  const handleValue = (val: number | boolean) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setValues(prev => ({ ...prev, [currentSignal]: val }));
  };

  const handleNext = () => {
    if (isLast) { handleDone(); } else { setStepIndex(prev => prev + 1); resetSlider(); }
  };

  const handleSkip = () => {
    if (isLast) { handleDone(); } else { setStepIndex(prev => prev + 1); resetSlider(); }
  };

  // Improvement #2: back button
  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1);
      resetSlider();
    }
  };

  const resetSlider = () => {
    const nextSignal = activeSignals[stepIndex + 1] as SignalKey | undefined;
    if (nextSignal) {
      const existing = values[nextSignal];
      const val = typeof existing === 'number' ? existing : 7;
      sliderXRef.current = SLIDER_WIDTH * (val / 12);
      sliderX.setValue(sliderXRef.current);
      setSliderDisplayValue(val);
    }
  };

  const handleDone = async () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addLog({
      date: today,
      loggedAt: new Date().toISOString(), // Improvement #4
      signals: { ...(existingLog?.signals || {}), ...values },
    });
    onClose();
  };

  // Improvement #1: smooth slider PanResponder
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
        const snapped = Math.round(raw * 2) / 2; // 0.5h increments
        setSliderDisplayValue(snapped);
        handleValue(snapped);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(0, Math.min(SLIDER_WIDTH, sliderXRef.current + gestureState.dx));
        sliderX.setValue(newX);
        const raw = (newX / SLIDER_WIDTH) * 12;
        const snapped = Math.round(raw * 2) / 2;
        if (snapped !== sliderDisplayValue) {
          setSliderDisplayValue(snapped);
          handleValue(snapped);
          if (Platform.OS !== 'web') Haptics.selectionAsync();
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const newX = Math.max(0, Math.min(SLIDER_WIDTH, sliderXRef.current + gestureState.dx));
        sliderXRef.current = newX;
        const raw = (newX / SLIDER_WIDTH) * 12;
        const snapped = Math.round(raw * 2) / 2;
        const snappedX = (snapped / 12) * SLIDER_WIDTH;
        RNAnimated.spring(sliderX, { toValue: snappedX, useNativeDriver: false, friction: 8 }).start();
        sliderXRef.current = snappedX;
        setSliderDisplayValue(snapped);
        handleValue(snapped);
      },
    })
  ).current;

  const currentValue = values[currentSignal];

  if (!config) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} accessibilityLabel="dismiss" accessibilityRole="button" />
        <View style={[styles.sheet, { backgroundColor: colors.surface2 }]}>
          <View style={[styles.handle, { backgroundColor: colors.divider }]} />

          {/* Progress */}
          <View style={styles.progressRow}>
            {activeSignals.map((_, i) => (
              <View key={i} style={[
                styles.progressDot,
                { backgroundColor: colors.surface3 },
                i === stepIndex && { backgroundColor: colors.nebulaPurple, width: 24 },
                i < stepIndex && { backgroundColor: colors.auroraTeal },
              ]} />
            ))}
          </View>

          <Text style={styles.emoji}>{config.emoji}</Text>
          <Text style={[styles.signalName, { color: colors.starlight }]}>{config.label}</Text>
          <Text style={[styles.prompt, { color: colors.starlightDim }]}>
            {getTimeOfDayPrompt(config.type, config.label)}
          </Text>

          <View style={styles.inputArea}>
            {config.type === 'emoji' && config.options && (
              <View style={styles.emojiRow}>
                {config.options.map((opt, i) => {
                  const val = i + 1;
                  const selected = currentValue === val;
                  return (
                    <TouchableOpacity
                      key={i} onPress={() => handleValue(val)}
                      style={[styles.emojiOption, { backgroundColor: colors.surface3 }, selected && { backgroundColor: config.color + '30', borderColor: config.color }]}
                      accessibilityLabel={`${config.label} level ${val}`}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.emojiText, selected && styles.emojiTextSelected]}>{opt}</Text>
                      <Text style={[styles.emojiVal, { color: colors.starlightFaint }, selected && { color: config.color }]}>{val}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Improvement #1: smooth draggable slider */}
            {config.type === 'slider' && (
              <View style={styles.sliderContainer}>
                <Text style={[styles.sliderValue, { color: config.color }]}>
                  {typeof currentValue === 'number' ? currentValue.toFixed(1) : sliderDisplayValue.toFixed(1)}h
                </Text>
                <View style={styles.smoothSliderWrapper} {...panResponder.panHandlers}>
                  <View style={[styles.smoothSliderTrack, { width: SLIDER_WIDTH, backgroundColor: colors.surface3 }]}>
                    <RNAnimated.View
                      style={[styles.smoothSliderFill, {
                        width: sliderX,
                        backgroundColor: config.color,
                      }]}
                    />
                  </View>
                  <RNAnimated.View
                    style={[styles.smoothSliderThumb, {
                      backgroundColor: config.color,
                      borderColor: colors.surface2,
                      transform: [{ translateX: RNAnimated.subtract(sliderX, 14) }],
                    }]}
                  />
                  <View style={styles.smoothSliderLabels}>
                    {[0, 3, 6, 9, 12].map(v => (
                      <Text key={v} style={[styles.smoothSliderLabel, { color: colors.starlightFaint }]}>{v}h</Text>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {config.type === 'toggle' && (
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleOption, { backgroundColor: colors.surface3 }, currentValue === false && { backgroundColor: colors.surface3, borderColor: colors.auroraTeal }]}
                  onPress={() => handleValue(false)} accessibilityLabel={`no ${config.label}`} accessibilityRole="button"
                >
                  <Text style={[styles.toggleText, { color: colors.starlight }]}>no</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleOption, { backgroundColor: colors.surface3 }, currentValue === true && { backgroundColor: config.color + '30', borderColor: config.color }]}
                  onPress={() => handleValue(true)} accessibilityLabel={`yes ${config.label}`} accessibilityRole="button"
                >
                  <Text style={[styles.toggleText, { color: colors.starlight }]}>yes</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.actionRow}>
            {/* Improvement #2: back button */}
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.backButton, stepIndex === 0 && styles.backButtonDisabled]}
              disabled={stepIndex === 0}
              accessibilityLabel="back"
              accessibilityRole="button"
            >
              <Text style={[styles.backText, { color: colors.starlightDim }, stepIndex === 0 && { color: colors.starlightFaint }]}>← back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton} accessibilityLabel="skip" accessibilityRole="button">
              <Text style={[styles.skipText, { color: colors.starlightFaint }]}>skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.nextButton, { backgroundColor: currentValue !== undefined ? colors.nebulaPurple : colors.surface3 }]}
              accessibilityLabel={isLast ? 'done' : 'next'}
              accessibilityRole="button"
            >
              <Text style={[styles.nextText, { color: colors.starlight }]}>{isLast ? 'done' : 'next'}</Text>
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
    backgroundColor: Colors.surface2, borderTopLeftRadius: Spacing.sheetRadius, borderTopRightRadius: Spacing.sheetRadius,
    paddingHorizontal: Spacing.screenPadding, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 12,
    minHeight: SCREEN_HEIGHT * 0.5,
  },
  handle: { width: 36, height: 4, backgroundColor: Colors.divider, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 28 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.surface3 },
  progressDotActive: { backgroundColor: Colors.nebulaPurple, width: 24 },
  progressDotDone: { backgroundColor: Colors.auroraTeal },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  signalName: { ...Typography.heading, textAlign: 'center', marginBottom: 4 },
  prompt: { ...Typography.caption, textAlign: 'center', marginBottom: 32 },
  inputArea: { flex: 1, justifyContent: 'center', minHeight: 120 },
  emojiRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  emojiOption: {
    width: 56, height: 72, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface3, borderWidth: 2, borderColor: 'transparent',
  },
  emojiText: { fontSize: 28, opacity: 0.5 },
  emojiTextSelected: { opacity: 1, fontSize: 32 },
  emojiVal: { ...Typography.small, color: Colors.starlightFaint, marginTop: 2 },
  sliderContainer: { alignItems: 'center' },
  sliderValue: { ...Typography.display, marginBottom: 20 },
  smoothSliderWrapper: { width: SLIDER_WIDTH, height: 60, justifyContent: 'center' },
  smoothSliderTrack: {
    height: 8, backgroundColor: Colors.surface3, borderRadius: 4, overflow: 'hidden',
  },
  smoothSliderFill: { height: '100%', borderRadius: 4 },
  smoothSliderThumb: {
    position: 'absolute', top: 16, width: 28, height: 28, borderRadius: 14,
    borderWidth: 3, borderColor: Colors.surface2,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  smoothSliderLabels: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 12,
  },
  smoothSliderLabel: { ...Typography.small, color: Colors.starlightFaint, fontSize: 9 },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  toggleOption: {
    width: 100, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface3, borderWidth: 2, borderColor: 'transparent',
  },
  toggleText: { ...Typography.bodyBold, color: Colors.starlight },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 },
  backButton: { paddingVertical: 12, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center' },
  backButtonDisabled: { opacity: 0.3 },
  backText: { ...Typography.caption, color: Colors.starlightDim },
  backTextDisabled: { color: Colors.starlightFaint },
  skipButton: { paddingVertical: 12, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center' },
  skipText: { ...Typography.caption, color: Colors.starlightFaint },
  nextButton: { paddingVertical: 14, paddingHorizontal: 36, borderRadius: Spacing.borderRadius, minHeight: 48, justifyContent: 'center' },
  nextText: { ...Typography.bodyBold, color: Colors.starlight },
});
