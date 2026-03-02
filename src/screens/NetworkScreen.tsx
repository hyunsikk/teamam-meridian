import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, SignalConfig, SIGNAL_KEYS, SignalKey } from '../styles/theme';
import { useData } from '../context/DataContext';
import { QuickLogSheet } from '../components/QuickLogSheet';
import { NetworkNode } from '../components/NetworkNode';
import { NetworkEdge } from '../components/NetworkEdge';
import { InsightCard } from '../components/InsightCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRAPH_SIZE = Math.min(SCREEN_WIDTH - 48, 340);
const GRAPH_CENTER = GRAPH_SIZE / 2;
const NODE_RADIUS = 120;

// Position nodes in a circle
function getNodePositions(): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const signals = SIGNAL_KEYS;
  signals.forEach((key, i) => {
    const angle = (i / signals.length) * Math.PI * 2 - Math.PI / 2;
    positions[key] = {
      x: GRAPH_CENTER + Math.cos(angle) * NODE_RADIUS,
      y: GRAPH_CENTER + Math.sin(angle) * NODE_RADIUS,
    };
  });
  return positions;
}

export function NetworkScreen() {
  const { logs, correlations, insights, todayLogged, totalDays } = useData();
  const [showLog, setShowLog] = useState(false);
  const [selectedNode, setSelectedNode] = useState<SignalKey | null>(null);
  const positions = getNodePositions();

  // Get latest log values for node display
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;

  // Find newest insight for the card
  const newestInsight = insights.find(i => i.type === 'correlation');

  // Get greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'good morning' : hour < 18 ? 'good afternoon' : 'good evening';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1540', Colors.deepSpace, Colors.deepSpace]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>meridian</Text>
          {totalDays >= 14 && (
            <View style={styles.forecastBadge}>
              <Text style={styles.forecastText}>🔮 forecast ready</Text>
            </View>
          )}
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {totalDays === 0
            ? 'your body has patterns. let\'s find them.'
            : totalDays < 7
            ? `${totalDays} day${totalDays > 1 ? 's' : ''} mapped. ${7 - totalDays} more until first connections.`
            : `${totalDays} days mapped. ${correlations.length} connection${correlations.length !== 1 ? 's' : ''} found.`}
        </Text>

        {/* Network Graph */}
        <View style={[styles.graphContainer, { width: GRAPH_SIZE, height: GRAPH_SIZE }]}>
          {/* Edges */}
          {correlations.map((corr, i) => {
            const posA = positions[corr.signalA];
            const posB = positions[corr.signalB];
            if (!posA || !posB) return null;
            const isHighlighted = selectedNode === corr.signalA || selectedNode === corr.signalB;
            return (
              <NetworkEdge
                key={`edge-${i}`}
                x1={posA.x}
                y1={posA.y}
                x2={posB.x}
                y2={posB.y}
                colorA={SignalConfig[corr.signalA]?.color || '#fff'}
                colorB={SignalConfig[corr.signalB]?.color || '#fff'}
                strength={Math.abs(corr.coefficient)}
                highlighted={isHighlighted}
              />
            );
          })}

          {/* Potential edges (faint lines for undiscovered connections) */}
          {SIGNAL_KEYS.map((a, i) =>
            SIGNAL_KEYS.slice(i + 1).map(b => {
              const hasCorr = correlations.some(
                c => (c.signalA === a && c.signalB === b) || (c.signalA === b && c.signalB === a)
              );
              if (hasCorr) return null;
              const posA = positions[a];
              const posB = positions[b];
              return (
                <NetworkEdge
                  key={`potential-${a}-${b}`}
                  x1={posA.x}
                  y1={posA.y}
                  x2={posB.x}
                  y2={posB.y}
                  colorA={Colors.starlightFaint}
                  colorB={Colors.starlightFaint}
                  strength={0}
                  highlighted={false}
                />
              );
            })
          )}

          {/* Nodes */}
          {SIGNAL_KEYS.map(key => {
            const pos = positions[key];
            const config = SignalConfig[key];
            const value = latestLog?.signals[key];
            const isSelected = selectedNode === key;
            const connCount = correlations.filter(
              c => c.signalA === key || c.signalB === key
            ).length;

            return (
              <NetworkNode
                key={key}
                x={pos.x}
                y={pos.y}
                signal={key}
                emoji={config.emoji}
                label={config.label}
                color={config.color}
                value={value}
                isSelected={isSelected}
                connectionCount={connCount}
                hasData={latestLog !== undefined && value !== undefined}
                onPress={() => setSelectedNode(isSelected ? null : key)}
              />
            );
          })}
        </View>

        {/* Log Button */}
        <TouchableOpacity
          style={[styles.logButton, todayLogged && styles.logButtonDone]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowLog(true); }}
          activeOpacity={0.8}
          accessibilityLabel={todayLogged ? 'update today\'s log' : 'log today'}
          accessibilityRole="button"
        >
          <Text style={styles.logButtonText}>
            {todayLogged ? 'update today' : 'log today'}
          </Text>
        </TouchableOpacity>

        {/* Newest Insight Card */}
        {newestInsight && (
          <InsightCard insight={newestInsight} compact />
        )}

        {/* Spacer for scroll */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Quick Log Bottom Sheet */}
      {showLog && (
        <QuickLogSheet onClose={() => setShowLog(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepSpace,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  wordmark: {
    ...Typography.heading,
    color: Colors.starlight,
    letterSpacing: 1,
  },
  forecastBadge: {
    backgroundColor: Colors.surface2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  forecastText: {
    ...Typography.small,
    color: Colors.nebulaPurple,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.starlightDim,
    textAlign: 'center',
    marginBottom: 24,
    width: '100%',
  },
  graphContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  logButton: {
    backgroundColor: Colors.nebulaPurple,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: Spacing.borderRadius,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 48,
  },
  logButtonDone: {
    backgroundColor: Colors.surface3,
  },
  logButtonText: {
    ...Typography.bodyBold,
    color: Colors.starlight,
  },
});
