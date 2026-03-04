import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, Platform, Modal, Animated,
} from 'react-native';
import { SignalConfig as SigCfg } from '../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, SignalConfig, SignalKey } from '../styles/theme';
import { useData } from '../context/DataContext';
import { QuickLogSheet } from '../components/QuickLogSheet';
import { NetworkNode } from '../components/NetworkNode';
import { NetworkEdge } from '../components/NetworkEdge';
import { InsightCard } from '../components/InsightCard';
import { RecommendationCard } from '../components/RecommendationCard';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRAPH_SIZE = Math.min(SCREEN_WIDTH - 48, 340);
const GRAPH_CENTER = GRAPH_SIZE / 2;

function getNodePositions(activeSignals: SignalKey[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const count = activeSignals.length;
  const radius = count <= 4 ? 100 : count <= 6 ? 110 : 120;
  activeSignals.forEach((key, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    positions[key] = {
      x: GRAPH_CENTER + Math.cos(angle) * radius,
      y: GRAPH_CENTER + Math.sin(angle) * radius,
    };
  });
  return positions;
}

export function NetworkScreen() {
  const { logs, correlations, insights, coldStartContent, todayLogged, totalDays, settings, dailyFocusAction, streak, newlyUnlocked, clearNewlyUnlocked, proactiveInsights } = useData();
  const [showLog, setShowLog] = useState(false);
  const [selectedNode, setSelectedNode] = useState<SignalKey | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // Improvement #11: animations
  const streakScale = useRef(new Animated.Value(0)).current;
  const unlockScale = useRef(new Animated.Value(0)).current;
  const unlockOpacity = useRef(new Animated.Value(0)).current;
  const digestSlide = useRef(new Animated.Value(30)).current;
  const digestOpacity = useRef(new Animated.Value(0)).current;

  // Streak badge spring animation
  useEffect(() => {
    if (streak.current > 0) {
      Animated.spring(streakScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    } else {
      streakScale.setValue(0);
    }
  }, [streak.current]);

  // Unlock modal animation
  useEffect(() => {
    if (newlyUnlocked.length > 0) {
      setShowUnlockModal(true);
      unlockOpacity.setValue(0);
      unlockScale.setValue(0.8);
      Animated.parallel([
        Animated.timing(unlockOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(unlockScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [newlyUnlocked]);

  // Digest slide-in
  useEffect(() => {
    Animated.parallel([
      Animated.timing(digestSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(digestOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const activeSignals = settings.activeSignals;
  const positions = getNodePositions(activeSignals);
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const newestInsight = insights.find(i => i.type === 'correlation');

  const visibleCorrelations = correlations.filter(c =>
    activeSignals.includes(c.signalA) && activeSignals.includes(c.signalB)
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1540', Colors.deepSpace, Colors.deepSpace]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>meridian</Text>
          <View style={styles.headerBadges}>
            {streak.current > 0 && (
              <Animated.View style={[styles.streakBadge, { transform: [{ scale: streakScale }] }]}>
                <Text style={styles.streakText}>🔥 {streak.current} day streak</Text>
              </Animated.View>
            )}
            {totalDays >= 14 && (
              <View style={styles.forecastBadge}>
                <Text style={styles.forecastText}>🔮 forecast ready</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.subtitle}>
          {totalDays === 0
            ? 'your body has patterns. let\'s find them.'
            : totalDays < 7
            ? `${totalDays} day${totalDays > 1 ? 's' : ''} mapped. showing you what science knows while your personal patterns emerge.`
            : `${totalDays} days mapped. ${visibleCorrelations.length} connection${visibleCorrelations.length !== 1 ? 's' : ''} found.`}
        </Text>

        {/* Improvement #7: proactive insights */}
        {proactiveInsights.length > 0 && (
          <View style={styles.proactiveSection}>
            {proactiveInsights.map(pi => (
              <View key={pi.id} style={styles.proactiveCard}>
                <Text style={styles.proactiveText}>{pi.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Network Graph */}
        <View style={[styles.graphContainer, { width: GRAPH_SIZE, height: GRAPH_SIZE }]}>
          {visibleCorrelations.map((corr, i) => {
            const posA = positions[corr.signalA];
            const posB = positions[corr.signalB];
            if (!posA || !posB) return null;
            const isHighlighted = selectedNode === corr.signalA || selectedNode === corr.signalB;
            return (
              <NetworkEdge
                key={`edge-${i}`}
                x1={posA.x} y1={posA.y} x2={posB.x} y2={posB.y}
                colorA={SignalConfig[corr.signalA]?.color || '#fff'}
                colorB={SignalConfig[corr.signalB]?.color || '#fff'}
                strength={Math.abs(corr.coefficient)}
                highlighted={isHighlighted}
              />
            );
          })}

          {activeSignals.map((a, i) =>
            activeSignals.slice(i + 1).map(b => {
              const hasCorr = visibleCorrelations.some(
                c => (c.signalA === a && c.signalB === b) || (c.signalA === b && c.signalB === a)
              );
              if (hasCorr) return null;
              const posA = positions[a];
              const posB = positions[b];
              return (
                <NetworkEdge
                  key={`potential-${a}-${b}`}
                  x1={posA.x} y1={posA.y} x2={posB.x} y2={posB.y}
                  colorA={Colors.starlightFaint} colorB={Colors.starlightFaint}
                  strength={0} highlighted={false}
                />
              );
            })
          )}

          {activeSignals.map(key => {
            const pos = positions[key];
            const config = SignalConfig[key];
            if (!pos || !config) return null;
            const value = latestLog?.signals[key];
            const isSelected = selectedNode === key;
            const connCount = visibleCorrelations.filter(c => c.signalA === key || c.signalB === key).length;
            // Improvement #8: highlight focus signal
            const isFocus = settings.focusSignal === key;
            return (
              <NetworkNode
                key={key} x={pos.x} y={pos.y} signal={key as SignalKey}
                emoji={config.emoji} label={config.label} color={config.color}
                value={value} isSelected={isSelected || isFocus} connectionCount={connCount}
                hasData={latestLog !== undefined && value !== undefined}
                onPress={() => setSelectedNode(isSelected ? null : key as SignalKey)}
                isFocus={isFocus}
              />
            );
          })}
        </View>

        {/* Log Button */}
        <TouchableOpacity
          style={[styles.logButton, todayLogged && styles.logButtonDone]}
          onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowLog(true); }}
          activeOpacity={0.8}
          accessibilityLabel={todayLogged ? 'update today\'s log' : 'log today'}
          accessibilityRole="button"
        >
          <Text style={styles.logButtonText}>
            {todayLogged ? 'update today' : 'log today'}
          </Text>
          {!todayLogged && <Text style={styles.logButtonSubtext}>{activeSignals.length} signals · under 15 seconds</Text>}
        </TouchableOpacity>

        {dailyFocusAction && (
          <Animated.View style={{ opacity: digestOpacity, transform: [{ translateY: digestSlide }] }}>
            <RecommendationCard recommendation={dailyFocusAction} isFocusAction />
          </Animated.View>
        )}

        {newestInsight && <InsightCard insight={newestInsight} compact />}

        {totalDays < 7 && coldStartContent.length > 0 && (
          <View style={styles.coldStartSection}>
            <Text style={styles.sectionTitle}>
              {totalDays === 0 ? '🔬 what science knows' : '🔬 while your patterns emerge'}
            </Text>
            <MedicalDisclaimer compact />
            {coldStartContent
              .filter(c => c.type === 'coldstart')
              .slice(0, 3)
              .map(cs => (
                <InsightCard key={cs.id} insight={cs} />
              ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {showLog && <QuickLogSheet onClose={() => setShowLog(false)} />}

      {/* Improvement #11: animated unlock modal */}
      {showUnlockModal && newlyUnlocked.length > 0 && (
        <Modal visible transparent animationType="none" onRequestClose={() => { setShowUnlockModal(false); clearNewlyUnlocked(); }}>
          <Animated.View style={[styles.unlockBackdrop, { opacity: unlockOpacity }]}>
            <Animated.View style={[styles.unlockCard, { transform: [{ scale: unlockScale }] }]}>
              <Text style={styles.unlockEmoji}>🔓</Text>
              <Text style={styles.unlockTitle}>new signals unlocked</Text>
              <Text style={styles.unlockText}>
                {newlyUnlocked.map(s => SigCfg[s]?.label || s).join(' and ')} {newlyUnlocked.length === 1 ? 'is' : 'are'} now available. add {newlyUnlocked.length === 1 ? 'it' : 'them'} in settings.
              </Text>
              <TouchableOpacity style={styles.unlockButton} onPress={() => { setShowUnlockModal(false); clearNewlyUnlocked(); }}>
                <Text style={styles.unlockButtonText}>got it</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.deepSpace },
  scrollContent: { paddingHorizontal: Spacing.screenPadding, paddingTop: Platform.OS === 'ios' ? 60 : 48, alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 8 },
  wordmark: { ...Typography.heading, color: Colors.starlight, letterSpacing: 1 },
  headerBadges: { flexDirection: 'row', gap: 8, alignItems: 'center', flexShrink: 1 },
  streakBadge: { backgroundColor: 'rgba(255, 107, 107, 0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  streakText: { ...Typography.small, color: '#FF6B6B' },
  forecastBadge: { backgroundColor: Colors.surface2, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  forecastText: { ...Typography.small, color: Colors.nebulaPurple },
  subtitle: { ...Typography.caption, color: Colors.starlightDim, textAlign: 'center', marginBottom: 24, width: '100%' },
  // Improvement #7: proactive section
  proactiveSection: { width: '100%', marginBottom: 16 },
  proactiveCard: { backgroundColor: Colors.nebulaPurpleLight, borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: Colors.nebulaPurple },
  proactiveText: { ...Typography.caption, color: Colors.starlight, lineHeight: 20 },
  graphContainer: { position: 'relative', marginBottom: 32 },
  logButton: {
    backgroundColor: Colors.nebulaPurple, paddingVertical: 16, paddingHorizontal: 48,
    borderRadius: Spacing.borderRadius, width: '100%', alignItems: 'center', marginBottom: 20, minHeight: 48,
  },
  logButtonDone: { backgroundColor: Colors.surface3 },
  logButtonText: { ...Typography.bodyBold, color: Colors.starlight },
  logButtonSubtext: { ...Typography.small, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  coldStartSection: { width: '100%', marginTop: 12 },
  sectionTitle: { ...Typography.caption, color: Colors.starlightDim, marginBottom: 16, textTransform: 'lowercase' },
  unlockBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  unlockCard: { backgroundColor: Colors.surface2, borderRadius: Spacing.borderRadius, padding: 28, width: 300, alignItems: 'center' },
  unlockEmoji: { fontSize: 40, marginBottom: 12 },
  unlockTitle: { ...Typography.bodyBold, marginBottom: 8 },
  unlockText: { ...Typography.caption, color: Colors.starlightDim, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  unlockButton: { backgroundColor: Colors.nebulaPurple, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
  unlockButtonText: { ...Typography.bodyBold, color: Colors.starlight },
});
