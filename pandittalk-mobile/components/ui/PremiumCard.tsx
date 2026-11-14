import React, { type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle, View } from 'react-native';

import {
  GOLD_BORDER,
  SURFACE,
} from '@/constants/Colors';
import { CARD_RADIUS } from '@/constants/Spacing';
import { shadowCard } from '@/constants/Shadows';

import { AnimatedPressable } from './AnimatedPressable';

type PremiumCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: number;
};

export function PremiumCard({ children, style, onPress, padding = 20 }: PremiumCardProps) {
  const cardStyle = [styles.card, { padding }, style];

  if (onPress) {
    return (
      <AnimatedPressable onPress={onPress} style={cardStyle}>
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: CARD_RADIUS,
    borderWidth: 1.2,
    borderColor: GOLD_BORDER,
    ...shadowCard,
  },
});
