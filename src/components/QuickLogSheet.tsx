import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Animated, Dimensions, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, SignalConfig, SIGNAL_KEYS, SignalKey } from '../styles/theme';
import { useData } from '../context/DataContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  onClose: () => void;
}

export function QuickLogSheet({ onClose }: Props) {
  const { addLog, logs } = useData();
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Partial<Record<SignalKey, number | boolean>>>({});

  const signals = SIGNAL_KEYS;
  const currentSignal = signals[stepIndex];
  const config = SignalConfig[currentSignal];
  const isLast = stepIndex === signals.length - 1;

  // Pre-fill with today's existing data
  const today = new Date().toISOString().split('T')[0];
  const existingLog = logs.find(l => l.date === today);

  const handleValue = (val: number | boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setValues(prev => ({ ...prev, [currentSignal]: val }));
  };

  const handleNext = () => {
    if (isLast) {
      handleDone();
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    if (isLast) {
      handleDone();
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  const handleDone = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addLog({ date: today, signals: { ...(existingLog?.signals || {}), ...values } });
    onClose();
  };

  const currentValue = values[currentSignal];

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Progress */}
          <View style={styles.progressRow}>
            {signals.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i === stepIndex && styles.progressDotActive,
                  i < stepIndex && styles.progressDotDone,
                ]}
              />
            ))}
          </View>

          {/* Signal Header */}
          <Text style={styles.emoji}>{config.emoji}</Text>
          <Text style={styles.signalName}>{config.label}</Text>
          <Text style={styles.prompt}>
            {config.type === 'slider' ? 'how many hours?' :
             config.type === 'toggle' ? 'today?' :
             'how would you rate it?'}
          </Text>

          {/* Input Widget */}
          <View style={styles.inputArea}>
            {config.type === 'emoji' && config.options && (
              <View style={styles.emojiRow}>
                {config.options.map((opt, i) => {
                  const val = i + 1;
                  const selected = currentValue === val;
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => handleValue(val)}
                      style={[
                        styles.emojiOption,
                        selected && { backgroundColor: config.color + '30', borderColor: config.color },
                      ]}
                      accessibilityLabel={`${config.label} level ${val}`}
                    >
                      <Text style={[styles.emojiText, selected && styles.emojiTextSelected]}>
                        {opt}
                      </Text>
                      <Text style={[styles.emojiVal, selected && { color: config.color }]}>
                        {val}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {config.type === 'slider' && (
              <View style={styles.sliderContainer}>
                <Text style={[styles.sliderValue, { color: config.color }]}>
                  {typeof currentValue === 'number' ? currentValue.toFixed(1) : '7.0'}h
                </Text>
                <View style={styles.sliderTrack}>
                  {Array.from({ length: 13 }, (_, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => handleValue(i)}
                      style={[
                        styles.sliderDetent,
                        {
                          backgroundColor: (typeof currentValue === 'number' ? currentValue : 7) >= i
                            ? config.color
                            : Colors.surface3,
                        },
                      ]}
                      accessibilityLabel={`${i} hours`}
                    >
                      {i % 3 === 0 && (
                        <Text style={styles.sliderLabel}>{i}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {config.type === 'toggle' && (
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    currentValue === false && { backgroundColor: Colors.surface3, borderColor: Colors.auroraTeal },
                  ]}
                  onPress={() => handleValue(false)}
                  accessibilityLabel={`no ${config.label}`}
                >
                  <Text style={styles.toggleText}>no</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    currentValue === true && { backgroundColor: config.color + '30', borderColor: config.color },
                  ]}
                  onPress={() => handleValue(true)}
                  accessibilityLabel={`yes ${config.label}`}
                >
                  <Text style={styles.toggleText}>yes</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.nextButton, { backgroundColor: currentValue !== undefined ? Colors.nebulaPurple : Colors.surface3 }]}
            >
              <Text style={styles.nextText}>{isLast ? 'done' : 'next'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.surface2,
    borderTopLeftRadius: Spacing.sheetRadius,
    borderTopRightRadius: Spacing.sheetRadius,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
    minHeight: SCREEN_HEIGHT * 0.55,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 28,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surface3,
  },
  progressDotActive: {
    backgroundColor: Colors.nebulaPurple,
    width: 24,
  },
  progressDotDone: {
    backgroundColor: Colors.auroraTeal,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  signalName: {
    ...Typography.heading,
    textAlign: 'center',
    marginBottom: 4,
  },
  prompt: {
    ...Typography.caption,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputArea: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 120,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  emojiOption: {
    width: 56,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiText: {
    fontSize: 28,
    opacity: 0.5,
  },
  emojiTextSelected: {
    opacity: 1,
    fontSize: 32,
  },
  emojiVal: {
    ...Typography.small,
    color: Colors.starlightFaint,
    marginTop: 2,
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderValue: {
    ...Typography.display,
    marginBottom: 20,
  },
  sliderTrack: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-end',
  },
  sliderDetent: {
    width: 22,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  sliderLabel: {
    ...Typography.small,
    color: Colors.starlightFaint,
    fontSize: 9,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  toggleOption: {
    width: 100,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  toggleText: {
    ...Typography.bodyBold,
    color: Colors.starlight,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
    justifyContent: 'center',
  },
  skipText: {
    ...Typography.caption,
    color: Colors.starlightFaint,
  },
  nextButton: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: Spacing.borderRadius,
    minHeight: 48,
    justifyContent: 'center',
  },
  nextText: {
    ...Typography.bodyBold,
    color: Colors.starlight,
  },
});
