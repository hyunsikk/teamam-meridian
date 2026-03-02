import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, SignalConfig } from '../styles/theme';
import { Recommendation } from '../utils/insightEngine';

interface Props {
  recommendation: Recommendation;
  isFocusAction?: boolean;
}

export function RecommendationCard({ recommendation, isFocusAction }: Props) {
  const signalConfig = SignalConfig[recommendation.targetSignal];
  const accentColor = signalConfig?.color || Colors.auroraTeal;

  return (
    <View style={[styles.card, isFocusAction && styles.focusCard]}>
      {isFocusAction && (
        <View style={styles.focusBadge}>
          <Text style={styles.focusBadgeText}>🎯 today's focus</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={[styles.priorityDot, {
          backgroundColor: recommendation.priority === 'high' ? Colors.ember :
                          recommendation.priority === 'medium' ? Colors.nebulaPurple : Colors.surface3
        }]} />
        <Text style={styles.title}>{recommendation.title}</Text>
      </View>

      <Text style={styles.action}>{recommendation.action}</Text>

      <View style={styles.rationaleContainer}>
        <Text style={styles.rationaleLabel}>why</Text>
        <Text style={styles.rationale}>{recommendation.rationale}</Text>
      </View>

      {recommendation.source && (
        <Text style={styles.source}>{recommendation.source}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface2,
    borderRadius: Spacing.borderRadius,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.elementGap,
    borderLeftWidth: 3,
    borderLeftColor: Colors.auroraTeal,
  },
  focusCard: {
    borderLeftColor: Colors.nebulaPurple,
    backgroundColor: Colors.nebulaPurpleLight,
  },
  focusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.nebulaPurple + '30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  focusBadgeText: {
    ...Typography.small,
    color: Colors.nebulaPurple,
    fontFamily: 'Nunito_600SemiBold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    ...Typography.bodyBold,
    flex: 1,
  },
  action: {
    ...Typography.body,
    color: Colors.starlight,
    lineHeight: 24,
    marginBottom: 12,
  },
  rationaleContainer: {
    backgroundColor: Colors.surface3,
    borderRadius: 12,
    padding: 12,
  },
  rationaleLabel: {
    ...Typography.small,
    color: Colors.auroraTeal,
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  rationale: {
    ...Typography.caption,
    lineHeight: 20,
  },
  source: {
    ...Typography.small,
    color: Colors.starlightFaint,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
