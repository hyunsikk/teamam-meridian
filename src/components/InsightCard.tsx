import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors, Typography, Spacing, SignalConfig } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';
import { Insight } from '../utils/insightEngine';
import { Correlation } from '../utils/correlationEngine';

interface Props {
  insight: Insight;
  compact?: boolean;
  correlation?: Correlation;
}

export function InsightCard({ insight, compact, correlation }: Props) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const hasExpandable = !!(insight.detail || insight.recommendation || insight.personalDetail);

  const typeIcon = {
    correlation: '🔗',
    prediction: '🔮',
    anomaly: '⚡',
    milestone: '✨',
    general: '💡',
    coldstart: '🔬',
    education: '📚',
    baseline: '📊',
    proactive: '⚡',
  }[insight.type] || '💡';

  const accentColor = insight.signalA
    ? (SignalConfig[insight.signalA]?.color || colors.nebulaPurple)
    : colors.nebulaPurple;

  // Improvement #13: share insight
  const handleShare = async () => {
    if (insight.type !== 'correlation' || !insight.signalA || !insight.signalB) return;
    const labelA = SignalConfig[insight.signalA]?.label || insight.signalA;
    const labelB = SignalConfig[insight.signalB]?.label || insight.signalB;
    const direction = insight.coefficient && insight.coefficient > 0 ? 'positively' : 'negatively';
    const message = `I discovered that my ${labelA} and ${labelB} are ${direction} correlated — tracked with Meridian`;

    if (Platform.OS !== 'web') {
      try {
        await Share.share({ message });
      } catch (e) {
        // user cancelled
      }
    } else {
      try {
        if (Clipboard && Clipboard.setStringAsync) {
          await Clipboard.setStringAsync(message);
        }
      } catch (e) {
        // fallback
      }
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact, { backgroundColor: colors.surface2 }]}
      onPress={() => hasExpandable && setExpanded(!expanded)}
      activeOpacity={hasExpandable ? 0.7 : 1}
      accessibilityLabel={`${insight.title}: ${insight.text}`}
      accessibilityRole="button"
    >
      <View style={[styles.accent, { backgroundColor: accentColor }]} />

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.typeIcon}>{typeIcon}</Text>
          <Text style={[styles.title, { color: colors.starlight }]} numberOfLines={compact ? 1 : 2}>{insight.title}</Text>
          {/* Improvement #13: share button for correlation insights */}
          {insight.type === 'correlation' && (
            <TouchableOpacity onPress={handleShare} style={styles.shareButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="share-outline" size={16} color={colors.starlightFaint} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.body, { color: colors.starlightDim }]} numberOfLines={compact ? 2 : undefined}>{insight.text}</Text>

        {/* Improvement #9: personalized detail */}
        {insight.personalDetail && (expanded || !compact) && (
          <View style={[styles.personalContainer, { backgroundColor: colors.nebulaPurpleLight }]}>
            <Text style={[styles.personalText, { color: colors.nebulaPurple }]}>{insight.personalDetail}</Text>
          </View>
        )}

        {expanded && insight.detail && (
          <View style={[styles.detailContainer, { backgroundColor: colors.surface3 }]}>
            <Text style={[styles.detailLabel, { color: colors.nebulaPurple }]}>why this happens</Text>
            <Text style={[styles.detail, { color: colors.starlightDim }]}>{insight.detail}</Text>
          </View>
        )}

        {expanded && insight.recommendation && (
          <View style={[styles.detailContainer, styles.recContainer, { backgroundColor: colors.surface3, borderLeftColor: colors.auroraTeal }]}>
            <Text style={[styles.recLabel, { color: colors.auroraTeal }]}>what to do about it</Text>
            <Text style={[styles.detail, { color: colors.starlightDim }]}>{insight.recommendation}</Text>
          </View>
        )}

        {!expanded && hasExpandable && !compact && (
          <Text style={[styles.expandHint, { color: colors.nebulaPurple }]}>
            {insight.recommendation ? 'tap for why + what to do' : 'tap to learn why'}
          </Text>
        )}

        {insight.source && (expanded || !compact) && (
          <TouchableOpacity
            style={styles.sourceRow}
            onPress={() => {
              if (insight.sourceUrl) {
                Linking.openURL(insight.sourceUrl).catch(() => {});
              }
            }}
            activeOpacity={insight.sourceUrl ? 0.6 : 1}
            accessibilityLabel={`Source: ${insight.source}`}
            accessibilityRole={insight.sourceUrl ? 'link' : 'text'}
          >
            <Ionicons name="library-outline" size={11} color={colors.starlightFaint} />
            <Text style={[styles.source, insight.sourceUrl && styles.sourceLink, { color: colors.starlightFaint }, insight.sourceUrl && { color: colors.nebulaPurple }]}>
              {insight.source}
            </Text>
            {insight.sourceUrl && (
              <Ionicons name="open-outline" size={10} color={colors.nebulaPurple} style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>
        )}

        {insight.coefficient !== undefined && (
          <View style={styles.strengthRow}>
            <View style={[styles.strengthBar, { width: `${Math.abs(insight.coefficient) * 100}%`, backgroundColor: accentColor }]} />
            <Text style={[styles.strengthLabel, { color: colors.starlightFaint }]}>r = {insight.coefficient > 0 ? '+' : ''}{insight.coefficient.toFixed(2)}</Text>
          </View>
        )}

        {correlation?.confidence && (
          <View style={styles.confidenceRow}>
            <Text style={[styles.confidenceLabel, {
              color: correlation.confidence === 'high' ? colors.auroraTeal :
                     correlation.confidence === 'medium' ? colors.nebulaPurple :
                     colors.starlightFaint,
            }]}>
              confidence: {correlation.confidence}
            </Text>
            {correlation.confidence === 'low' && (
              <Text style={[styles.confidenceNote, { color: colors.starlightFaint }]}>need more data to confirm</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface2, borderRadius: Spacing.borderRadius, flexDirection: 'row', overflow: 'hidden', width: '100%', marginBottom: Spacing.elementGap },
  cardCompact: { maxHeight: 120 },
  accent: { width: 3 },
  content: { flex: 1, padding: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  typeIcon: { fontSize: 16, marginRight: 8 },
  title: { ...Typography.bodyBold, flex: 1 },
  shareButton: { padding: 4, marginLeft: 8 },
  body: { ...Typography.caption, lineHeight: 20 },
  personalContainer: { marginTop: 8, padding: 10, backgroundColor: Colors.nebulaPurpleLight, borderRadius: 10 },
  personalText: { ...Typography.caption, color: Colors.nebulaPurple, lineHeight: 20 },
  detailContainer: { marginTop: 12, padding: 12, backgroundColor: Colors.surface3, borderRadius: 12 },
  detailLabel: { ...Typography.small, color: Colors.nebulaPurple, marginBottom: 6, textTransform: 'lowercase' },
  recContainer: { marginTop: 8, borderLeftWidth: 2, borderLeftColor: Colors.auroraTeal },
  recLabel: { ...Typography.small, color: Colors.auroraTeal, marginBottom: 6, textTransform: 'lowercase' },
  detail: { ...Typography.caption, lineHeight: 20 },
  expandHint: { ...Typography.small, color: Colors.nebulaPurple, marginTop: 8 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 5 },
  source: { ...Typography.small, color: Colors.starlightFaint, fontStyle: 'italic', flex: 1 },
  sourceLink: { color: Colors.nebulaPurple, textDecorationLine: 'underline' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  strengthBar: { height: 3, borderRadius: 2, flex: 1, maxWidth: 100 },
  strengthLabel: { ...Typography.small, color: Colors.starlightFaint },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8, flexWrap: 'wrap' },
  confidenceLabel: { ...Typography.small, fontFamily: 'Nunito_600SemiBold' },
  confidenceNote: { ...Typography.small, color: Colors.starlightFaint, fontStyle: 'italic' },
});
