import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, SignalKey } from '../styles/theme';

interface Props {
  x: number;
  y: number;
  signal: SignalKey;
  emoji: string;
  label: string;
  color: string;
  value?: number | boolean;
  isSelected: boolean;
  connectionCount: number;
  hasData: boolean;
  onPress: () => void;
}

const NODE_SIZE = 48;

export function NetworkNode({ x, y, emoji, label, color, value, isSelected, connectionCount, hasData, onPress }: Props) {
  const breathAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    // Breathing animation — staggered per node
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.03, duration: 2000, useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 0.97, duration: 2000, useNativeDriver: true }),
      ])
    );
    breathe.start();

    return () => breathe.stop();
  }, []);

  useEffect(() => {
    if (hasData) {
      // Pulse when data arrives
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.5, duration: 300, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.2, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [hasData]);

  const displayValue = (() => {
    if (value === undefined) return '';
    if (typeof value === 'boolean') return value ? '✓' : '';
    if (typeof value === 'number') {
      if (value % 1 !== 0) return value.toFixed(1);
      return String(value);
    }
    return '';
  })();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          left: x - NODE_SIZE / 2,
          top: y - NODE_SIZE / 2,
        },
      ]}
      accessibilityLabel={`${label}: ${displayValue || 'no data'}`}
      accessibilityRole="button"
    >
      {/* Glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: color,
            opacity: glowAnim,
            transform: [{ scale: breathAnim }],
          },
        ]}
      />

      {/* Node circle */}
      <Animated.View
        style={[
          styles.node,
          {
            backgroundColor: hasData ? color + 'CC' : color + '40',
            borderColor: isSelected ? Colors.starlight : 'transparent',
            borderWidth: isSelected ? 2 : 0,
            transform: [{ scale: isSelected ? Animated.multiply(breathAnim, new Animated.Value(1.1)) : breathAnim }],
          },
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>

      {/* Label */}
      <Text style={[styles.label, { color: hasData ? Colors.starlightDim : Colors.starlightFaint }]}>
        {label}
      </Text>

      {/* Value badge */}
      {displayValue !== '' && (
        <View style={[styles.valueBadge, { backgroundColor: color + '40' }]}>
          <Text style={styles.valueText}>{displayValue}</Text>
        </View>
      )}

      {/* Connection count */}
      {connectionCount > 0 && (
        <View style={styles.connBadge}>
          <Text style={styles.connText}>{connectionCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: NODE_SIZE + 32,
    alignItems: 'center',
    zIndex: 10,
  },
  glow: {
    position: 'absolute',
    width: NODE_SIZE + 24,
    height: NODE_SIZE + 24,
    borderRadius: (NODE_SIZE + 24) / 2,
    top: -12,
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    ...Typography.small,
    marginTop: 4,
    textAlign: 'center',
  },
  valueBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  valueText: {
    ...Typography.small,
    color: Colors.starlight,
    fontSize: 10,
  },
  connBadge: {
    position: 'absolute',
    top: -4,
    right: 8,
    backgroundColor: Colors.nebulaPurple,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connText: {
    ...Typography.small,
    color: Colors.starlight,
    fontSize: 9,
    fontFamily: 'Nunito_700Bold',
  },
});
