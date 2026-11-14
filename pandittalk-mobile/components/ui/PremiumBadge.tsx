import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  GOLD,
  GOLD_BORDER,
  GREY_LABEL,
  SOFT_YELLOW,
  TEXT_PRIMARY_DARK,
  WHITE,
} from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

type PremiumBadgeProps = {
  label: string;
  selected?: boolean;
  variant?: 'chip' | 'pill' | 'dot';
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function PremiumBadge({
  label,
  selected = false,
  variant = 'chip',
  style,
  children,
}: PremiumBadgeProps) {
  if (variant === 'dot') {
    return (
      <View style={[styles.dotWrap, style]}>
        <View style={[styles.dot, selected && styles.dotActive]} />
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        variant === 'pill' ? styles.pill : styles.chip,
        selected && styles.selected,
        style,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: GOLD_BORDER,
    backgroundColor: WHITE,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    backgroundColor: WHITE,
  },
  selected: {
    backgroundColor: SOFT_YELLOW,
    borderColor: GOLD,
  },
  label: {
    ...Typography.caption,
    color: TEXT_PRIMARY_DARK,
    fontWeight: '600',
  },
  labelSelected: {
    color: TEXT_PRIMARY_DARK,
    fontWeight: '700',
  },
  dotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GREY_LABEL,
  },
  dotActive: {
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
});
