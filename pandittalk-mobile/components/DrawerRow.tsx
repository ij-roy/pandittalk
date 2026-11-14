import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import {
  DANGER_RED,
  DANGER_TINT,
  GOLD,
  GOLD_GLOW,
  MUTED_GREY,
  TEXT_PRIMARY_DARK,
} from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

type DrawerRowProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  /** Optional trailing slot (e.g. a coin pill). Replaces the chevron when set. */
  trailing?: React.ReactNode;
  /** Render in a muted danger tone (e.g. Logout). */
  danger?: boolean;
  showChevron?: boolean;
};

/**
 * Reusable side-menu row: gold-tinted icon container + label in established
 * typography + optional trailing slot, with an AnimatedPressable press state and
 * a generous touch target. Tokens-only — no hardcoded colors.
 */
export function DrawerRow({
  icon,
  label,
  onPress,
  trailing,
  danger = false,
  showChevron = true,
}: DrawerRowProps) {
  const tint = danger ? DANGER_RED : GOLD;

  return (
    <AnimatedPressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.iconWrap, { backgroundColor: danger ? DANGER_TINT : GOLD_GLOW }]}>
        <Feather name={icon} size={19} color={tint} />
      </View>
      <Text style={[styles.label, danger && styles.labelDanger]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.trailing}>
        {trailing ?? (showChevron ? <Feather name="chevron-right" size={18} color={MUTED_GREY} /> : null)}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.body,
    color: TEXT_PRIMARY_DARK,
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
  },
  labelDanger: {
    color: DANGER_RED,
  },
  trailing: {
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
