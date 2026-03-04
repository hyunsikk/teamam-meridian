import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../styles/theme';

interface Props {
  compact?: boolean;
}

export function MedicalDisclaimer({ compact }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        accessibilityLabel="Medical disclaimer"
        accessibilityRole="button"
      >
        <View style={styles.compactHeader}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.starlightFaint} />
          <Text style={styles.compactText}>
            for informational purposes only — not medical advice
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={Colors.starlightFaint}
          />
        </View>
        {expanded && (
          <Text style={styles.compactDetail}>
            Meridian provides general wellness information based on published research. It does not diagnose, treat, or cure any medical condition. Always consult a qualified healthcare provider before making changes to your health routine. If you are experiencing a medical emergency, call your local emergency services immediately.
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <Ionicons name="medical-outline" size={18} color={Colors.starlightFaint} />
        <Text style={styles.title}>health information disclaimer</Text>
      </View>
      <Text style={styles.body}>
        Meridian provides general wellness information based on published scientific research. This app does not provide medical advice, diagnosis, or treatment. The content is for informational and educational purposes only.
      </Text>
      <Text style={styles.body}>
        Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay seeking it because of information provided by this app.
      </Text>
      <Text style={styles.body}>
        If you think you may have a medical emergency, call your doctor or emergency services immediately.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface2,
    borderRadius: Spacing.borderRadius,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.elementGap,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    ...Typography.small,
    color: Colors.starlightFaint,
    textTransform: 'lowercase',
    fontFamily: 'Nunito_600SemiBold',
  },
  body: {
    ...Typography.small,
    color: Colors.starlightFaint,
    lineHeight: 18,
    marginBottom: 8,
  },
  compactContainer: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: Spacing.elementGap,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactText: {
    ...Typography.small,
    color: Colors.starlightFaint,
    flex: 1,
    fontSize: 10,
  },
  compactDetail: {
    ...Typography.small,
    color: Colors.starlightFaint,
    lineHeight: 18,
    marginTop: 10,
  },
});
