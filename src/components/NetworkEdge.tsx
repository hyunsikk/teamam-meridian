import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';

interface Props {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  colorA: string;
  colorB: string;
  strength: number; // 0-1
  highlighted?: boolean;
}

export function NetworkEdge({ x1, y1, x2, y2, colorA, colorB, strength, highlighted }: Props) {
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 1500, useNativeDriver: false }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  const lineWidth = 1 + strength * 2.5;
  const baseOpacity = highlighted ? 0.9 : 0.3 + strength * 0.4;

  // Use midpoint for positioning - draw a thin rotated View
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <Animated.View
      style={[
        styles.edge,
        {
          left: midX - length / 2,
          top: midY - lineWidth / 2,
          width: length,
          height: lineWidth,
          backgroundColor: colorA,
          opacity: highlighted ? pulseAnim : baseOpacity,
          transform: [
            { rotate: `${angle}rad` },
          ],
          borderRadius: lineWidth / 2,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  edge: {
    position: 'absolute',
    zIndex: 1,
  },
});
