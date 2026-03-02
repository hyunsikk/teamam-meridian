import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, SignalConfig, CORE_SIGNALS, CHOOSABLE_SIGNALS, SignalKey } from '../styles/theme';
import { useData } from '../context/DataContext';

// Improvement #5: sample constellation for onboarding
function SampleConstellation() {
  const nodes = [
    { x: 60, y: 40, emoji: '🛏️', color: Colors.signals.sleep },
    { x: 180, y: 30, emoji: '⚡', color: Colors.signals.energy },
    { x: 120, y: 110, emoji: '😊', color: Colors.signals.mood },
    { x: 220, y: 100, emoji: '🎯', color: Colors.signals.focus },
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
              backgroundColor: Colors.nebulaPurple,
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
  container: { width: 280, height: 150, position: 'relative', alignSelf: 'center', marginVertical: 20 },
  node: { position: 'absolute', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  nodeEmoji: { fontSize: 18 },
});

export function OnboardingScreen() {
  const { updateSettings } = useData();
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
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1540', Colors.deepSpace]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
        <View style={styles.content}>
          <Text style={styles.logo}>meridian</Text>
          <Text style={styles.tagline}>your body has patterns.{'\n'}let's find them.</Text>
          <Text style={styles.description}>
            track a few signals daily. meridian reveals the hidden connections between them — backed by research, personalized to you.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep(1); }}
            accessibilityLabel="get started"
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>get started</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 1: Signal selection
  if (step === 1) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1540', Colors.deepSpace]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
        <View style={styles.content}>
          <Text style={styles.stepTitle}>we start with 3 core signals</Text>
          <View style={styles.coreSignals}>
            {CORE_SIGNALS.map(sig => {
              const config = SignalConfig[sig];
              return (
                <View key={sig} style={styles.signalPill}>
                  <Text style={styles.signalEmoji}>{config.emoji}</Text>
                  <Text style={styles.signalName}>{config.label}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.stepDescription}>these three cover the most impactful health connections. takes under 15 seconds to log.</Text>
          <Text style={styles.stepTitle2}>pick one more that matters to you</Text>
          <View style={styles.choosableGrid}>
            {CHOOSABLE_SIGNALS.map(sig => {
              const config = SignalConfig[sig];
              const selected = chosenSignal === sig;
              return (
                <TouchableOpacity
                  key={sig}
                  style={[styles.choosableCard, selected && { borderColor: config.color, backgroundColor: config.color + '15' }]}
                  onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setChosenSignal(sig as SignalKey); }}
                  accessibilityLabel={`${config.label}: ${config.description}${selected ? ', selected' : ''}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.choosableEmoji}>{config.emoji}</Text>
                  <Text style={[styles.choosableName, selected && { color: config.color }]}>{config.label}</Text>
                  <Text style={styles.choosableDesc}>{config.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.unlockNote}>you can unlock more signals later as you build the habit.</Text>
          <TouchableOpacity
            style={[styles.primaryButton, !chosenSignal && styles.primaryButtonDisabled]}
            onPress={chosenSignal ? () => setStep(2) : undefined}
            disabled={!chosenSignal}
            accessibilityLabel="next"
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>next</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Improvement #5: Step 2 — Compelling example
  if (step === 2) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1540', Colors.deepSpace]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
        <View style={styles.content}>
          <Text style={styles.stepTitle}>what you'll discover</Text>
          <SampleConstellation />
          <Text style={styles.exampleText}>
            after 2 weeks of logging, you might discover: "nights under 6 hours of sleep drop my energy by 40% two days later."
          </Text>
          <Text style={styles.exampleSubtext}>
            meridian finds patterns you can't see yourself.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleComplete}
            accessibilityLabel="start tracking"
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>start tracking</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.deepSpace },
  content: { flex: 1, paddingHorizontal: Spacing.screenPadding, paddingTop: Platform.OS === 'ios' ? 100 : 80, alignItems: 'center' },
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
});
