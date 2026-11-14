import { Image } from 'expo-image';
import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  GOLD,
  GOLD_BORDER,
  GREY_LABEL,
  SURFACE,
  TEXT_PRIMARY_DARK,
  WARM_IVORY,
} from '@/constants/Colors';
import { shadowCard } from '@/constants/Shadows';

import { AnimatedPressable } from './AnimatedPressable';
import { PremiumBadge } from './PremiumBadge';

type GridToolCardProps = {
  variant: 'grid';
  title: string;
  badge?: string;
  icon?: number;
  iconNode?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

type PaidToolCardProps = {
  variant: 'paid';
  title: string;
  price: string;
  description: string;
  icon?: number;
  iconNode?: ReactNode;
  badge?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

type ToolCardProps = GridToolCardProps | PaidToolCardProps;

/**
 * Single reusable tool-card system with two disciplined variants:
 * - `grid`: square-ish icon + label, gold-bordered, warm icon halo, depth.
 * - `paid`: horizontal (icon left, text right), gold accent, "Unlock" badge.
 */
export function ToolCard(props: ToolCardProps) {
  if (props.variant === 'paid') {
    const { title, price, description, icon, iconNode, badge = price, onPress, style } = props;
    return (
      <AnimatedPressable
        onPress={onPress}
        disabled={!onPress}
        style={[styles.paidCard, shadowCard, style]}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${title}, ${badge}`}
      >
        <View style={styles.paidIconHalo}>
          {iconNode ?? (icon ? <Image source={icon} style={styles.paidIcon} contentFit="contain" /> : null)}
        </View>
        <View style={styles.paidBody}>
          <Text style={styles.paidTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.paidDescription} numberOfLines={2}>
            {description}
          </Text>
        </View>
        <View style={styles.paidBadge}>
          <PremiumBadge label={badge} selected variant="pill" />
        </View>
      </AnimatedPressable>
    );
  }

  const { title, badge, icon, iconNode, onPress, style } = props;
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.gridCard, shadowCard, style]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={badge ? `${title}, ${badge}` : title}
    >
      <View style={styles.gridIconHalo}>
        {iconNode ?? (icon ? <Image source={icon} style={styles.gridIcon} contentFit="contain" /> : null)}
      </View>
      <Text style={styles.gridTitle} numberOfLines={2}>
        {title}
      </Text>
      {badge ? <PremiumBadge label={badge} selected variant="pill" /> : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    backgroundColor: SURFACE,
    borderWidth: 1.2,
    borderColor: GOLD_BORDER,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 16,
    gap: 10,
  },
  gridIconHalo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: WARM_IVORY,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIcon: {
    width: 40,
    height: 40,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    lineHeight: 17,
  },
  paidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: GOLD_BORDER,
    borderLeftWidth: 4,
    borderLeftColor: GOLD,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
  },
  paidIconHalo: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: WARM_IVORY,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  paidIcon: {
    width: 32,
    height: 32,
  },
  paidBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  paidTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  paidDescription: {
    fontSize: 12,
    color: GREY_LABEL,
    lineHeight: 16,
  },
  paidBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});
