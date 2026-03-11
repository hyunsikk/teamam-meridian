import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Animated } from 'react-native';
import { Colors, Typography, Spacing, SignalConfig } from '../styles/theme';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { InsightCard } from '../components/InsightCard';
import { RecommendationCard } from '../components/RecommendationCard';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export function InsightsScreen() {
  const { insights, recommendations, coldStartContent, totalDays, correlations, emergingCorrelations, weeklyDigest, streak, settings } = useData();
  const { colors, isDark } = useTheme();

  // Improvement #8: sort correlation insights to show focus signal first
  const focusSignal = settings.focusSignal;
  const correlationInsights = insights
    .filter(i => i.type === 'correlation')
    .sort((a, b) => {
      if (!focusSignal) return 0;
      const aFocus = a.signalA === focusSignal || a.signalB === focusSignal ? -1 : 0;
      const bFocus = b.signalA === focusSignal || b.signalB === focusSignal ? -1 : 0;
      return aFocus - bFocus;
    });
  const predictions = insights.filter(i => i.type === 'prediction');
  const generalInsights = insights.filter(i => i.type === 'general');
  const milestones = insights.filter(i => i.type === 'milestone');

  const scienceCards = coldStartContent.filter(c => c.type === 'coldstart');
  const educationCards = coldStartContent.filter(c => c.type === 'education');
  const baselineCards = coldStartContent.filter(c => c.type === 'baseline');

  // Improvement #11: weekly digest slide-in animation
  const digestSlide = useRef(new Animated.Value(40)).current;
  const digestOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (weeklyDigest) {
      Animated.parallel([
        Animated.timing(digestSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(digestOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [weeklyDigest]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.deepSpace }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: colors.starlight }]}>insights</Text>

      <MedicalDisclaimer compact />

      {recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.starlightDim }]}>💊 recommendations</Text>
          {recommendations.slice(0, 5).map(rec => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </View>
      )}

      {totalDays === 0 && insights.length === 0 && coldStartContent.length === 0 && (
        <View style={[styles.emptyState]}>
          <Text style={[styles.emptyEmoji]}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: colors.starlight }]}>no insights yet</Text>
          <Text style={[styles.emptyText, { color: colors.starlightDim }]}>keep logging daily. insights appear after a few days of data.</Text>
        </View>
      )}

      {/* Pre-7-day experience */}
      {totalDays < 7 && (
        <>
          <View style={styles.progressSection}>
            <Text style={[styles.progressTitle, { color: colors.starlight }]}>
              {totalDays === 0 ? 'your personal patterns need data' : `${totalDays}/7 days to your first connections`}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.surface3 }]}>
              <View style={[styles.progressFill, { width: `${Math.max((totalDays / 7) * 100, 5)}%`, backgroundColor: colors.nebulaPurple }]} />
            </View>
            <Text style={[styles.progressLabel, { color: colors.starlightFaint }]}>
              {totalDays === 0 ? 'log your first day to start' : `${7 - totalDays} more day${7 - totalDays !== 1 ? 's' : ''} until connections`}
            </Text>
          </View>

          {scienceCards.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.starlightDim }]}>🔬 what research says about your signals</Text>
              {scienceCards.slice(0, 5).map(ins => (
                <InsightCard key={ins.id} insight={ins} />
              ))}
            </View>
          )}

          {educationCards.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.starlightDim }]}>📚 why these signals matter</Text>
              {educationCards.map(ins => (
                <InsightCard key={ins.id} insight={ins} />
              ))}
            </View>
          )}

          {baselineCards.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.starlightDim }]}>📊 population baselines</Text>
              {baselineCards.map(ins => (
                <InsightCard key={ins.id} insight={ins} />
              ))}
            </View>
          )}
        </>
      )}

      {/* Streak */}
      {streak.current > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.starlightDim }]}>🔥 streak</Text>
          <View style={[styles.streakCard, { backgroundColor: colors.surface2 }]}>
            <Text style={styles.streakNumber}>{streak.current}</Text>
            <Text style={[styles.streakLabel, { color: colors.starlightDim }]}>day streak</Text>
            {streak.longest > streak.current && (
              <Text style={[styles.streakBest, { color: colors.starlightFaint }]}>best: {streak.longest} days</Text>
            )}
            {[7, 14, 30, 60, 90].includes(streak.current) && (
              <Text style={[styles.streakMilestone, { color: colors.nebulaPurple }]}>🎉 milestone reached!</Text>
            )}
          </View>
        </View>
      )}
      {streak.current === 0 && streak.previousStreak > 0 && (
        <View style={styles.section}>
          <View style={[styles.streakResetCard, { backgroundColor: colors.surface2 }]}>
            <Text style={[styles.streakResetText, { color: colors.starlightDim }]}>
              streak reset. you had {streak.previousStreak} days. let's go again.
            </Text>
          </View>
        </View>
      )}

      {/* Weekly Digest with slide animation */}
      {weeklyDigest && totalDays >= 7 && (
        <Animated.View style={[styles.section, { opacity: digestOpacity, transform: [{ translateY: digestSlide }] }]}>
          <Text style={[styles.sectionTitle, { color: colors.starlightDim }]}>📋 weekly digest</Text>
          <View style={[styles.digestCard, { backgroundColor: colors.surface2, borderColor: colors.nebulaPurple + '40' }]}>
            <Text style={[styles.digestTitle, { color: colors.nebulaPurple }]}>{weeklyDigest.weekLabel}</Text>
            <Text style={[styles.digestBody, { color: colors.starlightDim }]}>{weeklyDigest.summary}</Text>
            {/* Improvement #8: focus signal emphasis in digest */}
            {focusSignal && weeklyDigest.averages.find(a => a.signal === focusSignal) && (
              <Text style={[styles.digestFocus, { color: colors.nebulaPurple }]}>
                🎯 {SignalConfig[focusSignal]?.label}: {weeklyDigest.averages.find(a => a.signal === focusSignal)!.avg} {weeklyDigest.averages.find(a => a.signal === focusSignal)!.direction}
              </Text>
            )}
            <Text style={[styles.digestRec, { color: colors.auroraTeal }]}>{weeklyDigest.recommendation}</Text>
          </View>
        </Animated.View>
      )}

      {/* Post-7-day: personal insights */}
      {totalDays >= 7 && (
        <>
          {predictions.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.starlightDim }]}>🔮 tomorrow's forecast</Text>
              {predictions.map(ins => <InsightCard key={ins.id} insight={ins} />)}
            </View>
          )}

          {correlationInsights.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.starlightDim }]}>🔗 connections ({correlationInsights.length})</Text>
              {correlationInsights.map(ins => {
                const corr = correlations.find(c =>
                  c.signalA === ins.signalA && c.signalB === ins.signalB
                );
                return <InsightCard key={ins.id} insight={ins} correlation={corr} />;
              })}
            </View>
          )}

          {/* Improvement #12: Emerging correlations */}
          {emergingCorrelations.length > 0 && correlationInsights.length === 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.starlightDim }]}>🌱 something forming</Text>
              {emergingCorrelations.slice(0, 3).map(ec => {
                const labelA = SignalConfig[ec.signalA]?.label || ec.signalA;
                const labelB = SignalConfig[ec.signalB]?.label || ec.signalB;
                return (
                  <View key={`emerging-${ec.signalA}-${ec.signalB}`} style={[styles.emergingCard, { backgroundColor: colors.surface2, borderColor: colors.starlightFaint }]}>
                    <Text style={[styles.emergingText, { color: colors.starlightDim }]}>
                      something might be forming between {labelA} and {labelB} (r={Math.abs(ec.coefficient).toFixed(2)}). a few more days will tell.
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
          {/* Also show emerging when we have strong correlations */}
          {emergingCorrelations.length > 0 && correlationInsights.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.starlightDim }]}>🌱 emerging patterns</Text>
              {emergingCorrelations.slice(0, 3).map(ec => {
                const labelA = SignalConfig[ec.signalA]?.label || ec.signalA;
                const labelB = SignalConfig[ec.signalB]?.label || ec.signalB;
                return (
                  <View key={`emerging-${ec.signalA}-${ec.signalB}`} style={[styles.emergingCard, { backgroundColor: colors.surface2, borderColor: colors.starlightFaint }]}>
                    <Text style={[styles.emergingText, { color: colors.starlightDim }]}>
                      something might be forming between {labelA} and {labelB} (r={Math.abs(ec.coefficient).toFixed(2)}). a few more days will tell.
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {generalInsights.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.starlightDim }]}>💡 patterns</Text>
              {generalInsights.map(ins => <InsightCard key={ins.id} insight={ins} />)}
            </View>
          )}

          {milestones.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.starlightDim }]}>✨ milestones</Text>
              {milestones.slice(-3).map(ins => <InsightCard key={ins.id} insight={ins} />)}
            </View>
          )}

          {correlationInsights.length === 0 && emergingCorrelations.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={[styles.emptyTitle, { color: colors.starlight }]}>no strong connections yet</Text>
              <Text style={[styles.emptyText, { color: colors.starlightDim }]}>keep logging — more data means more patterns to discover.</Text>
            </View>
          )}
        </>
      )}

      <MedicalDisclaimer />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.deepSpace },
  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: Platform.OS === 'ios' ? 60 : 48 },
  title: { ...Typography.display, marginBottom: 24 },
  section: { marginBottom: Spacing.sectionGap },
  sectionTitle: { ...Typography.caption, color: Colors.starlightDim, marginBottom: 16, textTransform: 'lowercase' },
  progressSection: { alignItems: 'center', paddingVertical: 24, marginBottom: 32 },
  progressTitle: { ...Typography.bodyBold, marginBottom: 16, textAlign: 'center' },
  progressBar: { width: 200, height: 6, backgroundColor: Colors.surface3, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.nebulaPurple, borderRadius: 3 },
  progressLabel: { ...Typography.small, color: Colors.starlightFaint, marginTop: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { ...Typography.heading, marginBottom: 8, textAlign: 'center' },
  emptyText: { ...Typography.caption, textAlign: 'center', maxWidth: 280, lineHeight: 22 },
  streakCard: { backgroundColor: Colors.surface2, borderRadius: Spacing.borderRadius, padding: Spacing.cardPadding, alignItems: 'center' },
  streakNumber: { ...Typography.display, fontSize: 48, color: '#FF6B6B' },
  streakLabel: { ...Typography.caption, color: Colors.starlightDim, marginTop: 4 },
  streakBest: { ...Typography.small, color: Colors.starlightFaint, marginTop: 8 },
  streakMilestone: { ...Typography.bodyBold, color: Colors.nebulaPurple, marginTop: 8 },
  streakResetCard: { backgroundColor: Colors.surface2, borderRadius: Spacing.borderRadius, padding: Spacing.cardPadding },
  streakResetText: { ...Typography.caption, color: Colors.starlightDim, textAlign: 'center', lineHeight: 20 },
  digestCard: { backgroundColor: Colors.surface2, borderRadius: Spacing.borderRadius, padding: Spacing.cardPadding, borderWidth: 1, borderColor: Colors.nebulaPurple + '40' },
  digestTitle: { ...Typography.bodyBold, color: Colors.nebulaPurple, marginBottom: 8 },
  digestBody: { ...Typography.caption, lineHeight: 20, marginBottom: 12 },
  digestFocus: { ...Typography.caption, color: Colors.nebulaPurple, marginBottom: 8 },
  digestRec: { ...Typography.caption, color: Colors.auroraTeal, lineHeight: 20, fontStyle: 'italic' },
  // Improvement #12: emerging correlation styles
  emergingCard: {
    backgroundColor: Colors.surface2, borderRadius: Spacing.borderRadius, padding: Spacing.cardPadding,
    marginBottom: Spacing.elementGap, borderWidth: 1, borderColor: Colors.starlightFaint,
    borderStyle: 'dashed', opacity: 0.7,
  },
  emergingText: { ...Typography.caption, color: Colors.starlightDim, lineHeight: 20 },
});
