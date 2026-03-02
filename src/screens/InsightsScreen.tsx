import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { Colors, Typography, Spacing } from '../styles/theme';
import { useData } from '../context/DataContext';
import { InsightCard } from '../components/InsightCard';

export function InsightsScreen() {
  const { insights, totalDays, correlations } = useData();

  const correlationInsights = insights.filter(i => i.type === 'correlation');
  const predictions = insights.filter(i => i.type === 'prediction');
  const generalInsights = insights.filter(i => i.type === 'general');
  const milestones = insights.filter(i => i.type === 'milestone');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>insights</Text>

      {totalDays < 7 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌌</Text>
          <Text style={styles.emptyTitle}>patterns need time</Text>
          <Text style={styles.emptyText}>
            log at least 7 days to discover your first connections. you have {totalDays} so far.
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(totalDays / 7) * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{totalDays}/7 days</Text>
        </View>
      ) : (
        <>
          {/* Predictions */}
          {predictions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔮 tomorrow's forecast</Text>
              {predictions.map(ins => (
                <InsightCard key={ins.id} insight={ins} />
              ))}
            </View>
          )}

          {/* Correlations */}
          {correlationInsights.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                🔗 connections ({correlationInsights.length})
              </Text>
              {correlationInsights.map(ins => (
                <InsightCard key={ins.id} insight={ins} />
              ))}
            </View>
          )}

          {/* General */}
          {generalInsights.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 patterns</Text>
              {generalInsights.map(ins => (
                <InsightCard key={ins.id} insight={ins} />
              ))}
            </View>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✨ milestones</Text>
              {milestones.slice(-3).map(ins => (
                <InsightCard key={ins.id} insight={ins} />
              ))}
            </View>
          )}

          {correlationInsights.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>no strong connections yet</Text>
              <Text style={styles.emptyText}>
                keep logging — more data means more patterns to discover.
              </Text>
            </View>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepSpace,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
  },
  title: {
    ...Typography.display,
    marginBottom: 24,
  },
  section: {
    marginBottom: Spacing.sectionGap,
  },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.starlightDim,
    marginBottom: 16,
    textTransform: 'lowercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    ...Typography.heading,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.caption,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  progressBar: {
    width: 200,
    height: 6,
    backgroundColor: Colors.surface3,
    borderRadius: 3,
    marginTop: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.nebulaPurple,
    borderRadius: 3,
  },
  progressLabel: {
    ...Typography.small,
    color: Colors.starlightFaint,
    marginTop: 8,
  },
});
