import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, SignalConfig, CORE_SIGNALS, CHOOSABLE_SIGNALS, SignalKey } from '../styles/theme';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';

// Improvement #5: sample constellation for onboarding
function SampleConstellation({ colors }: { colors: typeof Colors }) {
  const nodes = [
    { x: 70, y: 45, emoji: '🛏️', color: colors.signals.sleep },
    { x: 210, y: 35, emoji: '⚡', color: colors.signals.energy },
    { x: 140, y: 130, emoji: '😊', color: colors.signals.mood },
    { x: 255, y: 115, emoji: '🎯', color: colors.signals.focus },
  ];
  const edges = [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
  ];

  return (
    <View style={sampleStyles.container}>
      {/* Edges */}
      {edges.map((edge, i) => {
        const a = nodes[edge.from];
        const b = nodes[edge.to];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        return (
          <View
            key={`edge-${i}`}
            style={{
              position: 'absolute',
              left: midX - length / 2,
              top: midY - 1,
              width: length,
              height: 2,
              backgroundColor: colors.nebulaPurple,
              opacity: 0.4,
              borderRadius: 1,
              transform: [{ rotate: `${angle}rad` }],
            }}
          />
        );
      })}
      {/* Nodes */}
      {nodes.map((node, i) => (
        <View
          key={`node-${i}`}
          style={[sampleStyles.node, { left: node.x - 18, top: node.y - 18, backgroundColor: node.color + '40' }]}
        >
          <Text style={sampleStyles.nodeEmoji}>{node.emoji}</Text>
        </View>
      ))}
    </View>
  );
}

const sampleStyles = StyleSheet.create({
  container: { width: 320, height: 180, position: 'relative', alignSelf: 'center', marginVertical: 20 },
  node: { position: 'absolute', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  nodeEmoji: { fontSize: 18 },
});

export function OnboardingScreen() {
  const { updateSettings } = useData();
  const { colors, isDark } = useTheme();
  const [step, setStep] = useState(0);
  const [chosenSignal, setChosenSignal] = useState<SignalKey | null>(null);

  const handleComplete = async () => {
    const activeSignals: SignalKey[] = [...CORE_SIGNALS];
    if (chosenSignal) activeSignals.push(chosenSignal);
    else activeSignals.push('focus');

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateSettings({
      activeSignals,
      unlockedSignals: [...activeSignals],
      onboardingComplete: true,
    });
  };

  // Step 0: Welcome
  if (step === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.deepSpace }]}>
        <LinearGradient
          colors={isDark ? ['#1a1540', colors.deepSpace] : ['#E8E6F0', '#F8F7FC']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
        <View style={styles.content}>
          <Text style={[styles.logo, { color: colors.starlight }]}>meridian</Text>
          <Text style={[styles.tagline, { color: colors.starlight }]}>your body has patterns.{'\n'}let's find them.</Text>
          <Text style={[styles.description, { color: colors.starlightDim }]}>
            track a few signals daily. meridian reveals the hidden connections between them — backed by research, personalized to you.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.nebulaPurple }]}
            onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep(1); }}
            accessibilityLabel="get started"
            accessibilityRole="button"
          >
            <Text style={[styles.primaryButtonText, { color: '#fff' }]}>get started</Text>
          </TouchableOpacity>
          <View style={styles.stepDots}>
            {[0, 1, 2].map(i => (
              <View key={i} style={[styles.stepDot, { backgroundColor: i === step ? colors.nebulaPurple : colors.starlightFaint }]} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  // Step 1: Signal selection
  if (step === 1) {
    return (
      <View style={[styles.container, { backgroundColor: colors.deepSpace }]}>
        <LinearGradient
          colors={isDark ? ['#1a1540', colors.deepSpace] : ['#E8E6F0', '#F8F7FC']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
        <View style={styles.content}>
          <Text style={[styles.stepTitle, { color: colors.starlight }]}>we start with 3 core signals</Text>
          <View style={styles.coreSignals}>
            {CORE_SIGNALS.map(sig => {
              const config = SignalConfig[sig];
              return (
                <View key={sig} style={[styles.signalPill, { backgroundColor: colors.surface2 }]}>
                  <Text style={styles.signalEmoji}>{config.emoji}</Text>
                  <Text style={[styles.signalName, { color: colors.starlight }]}>{config.label}</Text>
                </View>
              );
            })}
          </View>
          <Text style={[styles.stepDescription, { color: colors.starlightDim }]}>these three cover the most impactful health connections. takes under 15 seconds to log.</Text>
          <Text style={[styles.stepTitle2, { color: colors.starlight }]}>pick one more that matters to you</Text>
          <View style={styles.choosableGrid}>
            {CHOOSABLE_SIGNALS.map(sig => {
              const config = SignalConfig[sig];
              const selected = chosenSignal === sig;
              return (
                <TouchableOpacity
                  key={sig}
                  style={[styles.choosableCard, { backgroundColor: colors.surface2 }, selected && { borderColor: config.color, backgroundColor: config.color + '15' }]}
                  onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setChosenSignal(sig as SignalKey); }}
                  accessibilityLabel={`${config.label}: ${config.description}${selected ? ', selected' : ''}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.choosableEmoji}>{config.emoji}</Text>
                  <Text style={[styles.choosableName, { color: colors.starlight }, selected && { color: config.color }]}>{config.label}</Text>
                  <Text style={[styles.choosableDesc, { color: colors.starlightDim }]}>{config.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.unlockNote, { color: colors.starlightFaint }]}>you can unlock more signals later as you build the habit.</Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.nebulaPurple }, !chosenSignal && styles.primaryButtonDisabled]}
            onPress={chosenSignal ? () => setStep(2) : undefined}
            disabled={!chosenSignal}
            accessibilityLabel="next"
            accessibilityRole="button"
          >
            <Text style={[styles.primaryButtonText, { color: '#fff' }]}>next</Text>
          </TouchableOpacity>
          <View style={styles.stepDots}>
            {[0, 1, 2].map(i => (
              <View key={i} style={[styles.stepDot, { backgroundColor: i === step ? colors.nebulaPurple : colors.starlightFaint }]} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  // Improvement #5: Step 2 — Compelling example
  if (step === 2) {
    return (
      <View style={[styles.container, { backgroundColor: colors.deepSpace }]}>
        <LinearGradient
          colors={isDark ? ['#1a1540', colors.deepSpace] : ['#E8E6F0', '#F8F7FC']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
        <View style={styles.content}>
          <Text style={[styles.stepTitle, { color: colors.starlight }]}>what you'll discover</Text>
          <SampleConstellation colors={colors} />
          <Text style={[styles.exampleText, { color: colors.starlightDim }]}>
            after 2 weeks of logging, you might discover: "nights under 6 hours of sleep drop my energy by 40% two days later."
          </Text>
          <Text style={[styles.exampleSubtext, { color: colors.nebulaPurple }]}>
            meridian finds patterns you can't see yourself.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.nebulaPurple }]}
            onPress={handleComplete}
            accessibilityLabel="start tracking"
            accessibilityRole="button"
          >
            <Text style={[styles.primaryButtonText, { color: '#fff' }]}>start tracking</Text>
          </TouchableOpacity>
          <View style={styles.stepDots}>
            {[0, 1, 2].map(i => (
              <View key={i} style={[styles.stepDot, { backgroundColor: i === step ? colors.nebulaPurple : colors.starlightFaint }]} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.deepSpace },
  content: { flex: 1, paddingHorizontal: Spacing.screenPadding, justifyContent: 'center', alignItems: 'center' },
  logo: { ...Typography.display, fontSize: 40, letterSpacing: 2, marginBottom: 16 },
  tagline: { ...Typography.heading, textAlign: 'center', marginBottom: 24, lineHeight: 32 },
  description: { ...Typography.body, color: Colors.starlightDim, textAlign: 'center', lineHeight: 24, maxWidth: 300, marginBottom: 48 },
  primaryButton: { backgroundColor: Colors.nebulaPurple, paddingVertical: 16, paddingHorizontal: 48, borderRadius: Spacing.borderRadius, minHeight: 48, marginTop: 24 },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { ...Typography.bodyBold, color: Colors.starlight },
  stepTitle: { ...Typography.heading, textAlign: 'center', marginBottom: 20 },
  stepTitle2: { ...Typography.bodyBold, textAlign: 'center', marginTop: 32, marginBottom: 16 },
  stepDescription: { ...Typography.caption, textAlign: 'center', maxWidth: 280, lineHeight: 20 },
  coreSignals: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  signalPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface2,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8,
  },
  signalEmoji: { fontSize: 20 },
  signalName: { ...Typography.bodyBold },
  choosableGrid: { width: '100%', gap: 10 },
  choosableCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface2,
    padding: 16, borderRadius: 16, borderWidth: 2, borderColor: 'transparent', gap: 12,
  },
  choosableEmoji: { fontSize: 24 },
  choosableName: { ...Typography.bodyBold, width: 70 },
  choosableDesc: { ...Typography.caption, flex: 1 },
  unlockNote: { ...Typography.small, color: Colors.starlightFaint, marginTop: 16, textAlign: 'center' },
  // Improvement #5: example styles
  exampleText: {
    ...Typography.body, color: Colors.starlightDim, textAlign: 'center', lineHeight: 24,
    maxWidth: 300, marginBottom: 16, fontStyle: 'italic',
  },
  exampleSubtext: {
    ...Typography.bodyBold, color: Colors.nebulaPurple, textAlign: 'center', marginBottom: 16,
  },
  stepDots: { flexDirection: 'row', gap: 8, marginTop: 32, justifyContent: 'center' },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
});
