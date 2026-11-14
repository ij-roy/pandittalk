import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { GOLD, GOLD_BORDER, GREY_LABEL, SURFACE } from '@/constants/Colors';
import { shadowSubtle } from '@/constants/Shadows';

type StatTileProps = {
  value: string | number;
  label: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Big bold value (gold) on top, small caption label below. Turns buried data
 * (lucky color/time/number, ratings, coins, sessions) into the visual stars.
 */
export function StatTile({ value, label, style }: StatTileProps) {
  return (
    <View style={[styles.tile, shadowSubtle, style]}>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: GOLD_BORDER,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: GOLD,
    textAlign: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: GREY_LABEL,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
