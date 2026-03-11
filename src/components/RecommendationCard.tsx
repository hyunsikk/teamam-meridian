import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, SignalConfig } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';
import { Recommendation } from '../utils/insightEngine';

interface Props {
  recommendation: Recommendation;
  isFocusAction?: boolean;
}

export function RecommendationCard({ recommendation, isFocusAction }: Props) {
  const { colors } = useTheme();
  const signalConfig = SignalConfig[recommendation.targetSignal];
  const accentColor = signalConfig?.color || colors.auroraTeal;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface2, borderLeftColor: colors.auroraTeal }, isFocusAction && { borderLeftColor: colors.nebulaPurple, backgroundColor: colors.nebulaPurpleLight }]}>
      {isFocusAction && (
        <View style={[styles.focusBadge, { backgroundColor: colors.nebulaPurple + '30' }]}>
          <Text style={[styles.focusBadgeText, { color: colors.nebulaPurple }]}>🎯 today's focus</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={[styles.priorityDot, {
          backgroundColor: recommendation.priority === 'high' ? colors.ember :
                          recommendation.priority === 'medium' ? colors.nebulaPurple : colors.surface3
        }]} />
        <Text style={[styles.title, { color: colors.starlight }]}>{recommendation.title}</Text>
      </View>

      <Text style={[styles.action, { color: colors.starlight }]}>{recommendation.action}</Text>

      <View style={[styles.rationaleContainer, { backgroundColor: colors.surface3 }]}>
        <Text style={[styles.rationaleLabel, { color: colors.auroraTeal }]}>why</Text>
        <Text style={[styles.rationale, { color: colors.starlightDim }]}>{recommendation.rationale}</Text>
      </View>

      {recommendation.source && (
        <TouchableOpacity
          style={styles.sourceRow}
          onPress={() => {
            if (recommendation.sourceUrl) {
              Linking.openURL(recommendation.sourceUrl).catch(() => {});
            }
          }}
          activeOpacity={recommendation.sourceUrl ? 0.6 : 1}
          accessibilityLabel={`Source: ${recommendation.source}`}
          accessibilityRole={recommendation.sourceUrl ? 'link' : 'text'}
        >
          <Ionicons name="library-outline" size={11} color={colors.starlightFaint} />
          <Text style={[styles.source, { color: colors.starlightFaint }, recommendation.sourceUrl && { color: colors.nebulaPurple, textDecorationLine: 'underline' }]}>
            {recommendation.source}
          </Text>
          {recommendation.sourceUrl && (
            <Ionicons name="open-outline" size={10} color={colors.nebulaPurple} style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>
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
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  source: {
    ...Typography.small,
    color: Colors.starlightFaint,
    fontStyle: 'italic',
    flex: 1,
  },
  sourceLink: {
    color: Colors.nebulaPurple,
    textDecorationLine: 'underline',
  },
});
