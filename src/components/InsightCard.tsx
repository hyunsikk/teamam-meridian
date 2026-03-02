import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, SignalConfig } from '../styles/theme';
import { Insight } from '../utils/insightEngine';

interface Props {
  insight: Insight;
  compact?: boolean;
}

export function InsightCard({ insight, compact }: Props) {
  const [expanded, setExpanded] = useState(false);

  const typeIcon = {
    correlation: '🔗',
    prediction: '🔮',
    anomaly: '⚡',
    milestone: '✨',
    general: '💡',
  }[insight.type];

  const accentColor = insight.signalA
    ? (SignalConfig[insight.signalA]?.color || Colors.nebulaPurple)
    : Colors.nebulaPurple;

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={() => insight.detail && setExpanded(!expanded)}
      activeOpacity={insight.detail ? 0.7 : 1}
      accessibilityLabel={`${insight.title}: ${insight.text}`}
      accessibilityRole="button"
    >
      {/* Left accent */}
      <View style={[styles.accent, { backgroundColor: accentColor }]} />

      <View style={styles.content}>
        {/* Type + Title */}
        <View style={styles.titleRow}>
          <Text style={styles.typeIcon}>{typeIcon}</Text>
          <Text style={styles.title} numberOfLines={compact ? 1 : 2}>{insight.title}</Text>
        </View>

        {/* Body */}
        <Text style={styles.body} numberOfLines={compact ? 2 : undefined}>
          {insight.text}
        </Text>

        {/* Expandable detail */}
        {expanded && insight.detail && (
          <View style={styles.detailContainer}>
            <Text style={styles.detailLabel}>why this happens</Text>
            <Text style={styles.detail}>{insight.detail}</Text>
          </View>
        )}

        {/* Expand hint */}
        {!expanded && insight.detail && !compact && (
          <Text style={styles.expandHint}>tap to learn why</Text>
        )}

        {/* Strength indicator for correlations */}
        {insight.coefficient !== undefined && (
          <View style={styles.strengthRow}>
            <View style={[styles.strengthBar, { width: `${Math.abs(insight.coefficient) * 100}%`, backgroundColor: accentColor }]} />
            <Text style={styles.strengthLabel}>
              r = {insight.coefficient > 0 ? '+' : ''}{insight.coefficient.toFixed(2)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface2,
    borderRadius: Spacing.borderRadius,
    flexDirection: 'row',
    overflow: 'hidden',
    width: '100%',
    marginBottom: Spacing.elementGap,
  },
  cardCompact: {
    maxHeight: 120,
  },
  accent: {
    width: 3,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  title: {
    ...Typography.bodyBold,
    flex: 1,
  },
  body: {
    ...Typography.caption,
    lineHeight: 20,
  },
  detailContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.surface3,
    borderRadius: 12,
  },
  detailLabel: {
    ...Typography.small,
    color: Colors.nebulaPurple,
    marginBottom: 6,
    textTransform: 'lowercase',
  },
  detail: {
    ...Typography.caption,
    lineHeight: 20,
  },
  expandHint: {
    ...Typography.small,
    color: Colors.nebulaPurple,
    marginTop: 8,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  strengthBar: {
    height: 3,
    borderRadius: 2,
    flex: 1,
    maxWidth: 100,
  },
  strengthLabel: {
    ...Typography.small,
    color: Colors.starlightFaint,
  },
});
