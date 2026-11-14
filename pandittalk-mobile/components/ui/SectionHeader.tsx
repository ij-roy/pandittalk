import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { SECTION_BAR, TEXT_PRIMARY_DARK } from '@/constants/Colors';

type SectionHeaderProps = {
  title: string;
  /** Optional right-aligned slot, e.g. a "View all" pressable. */
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Tighten the top margin when the header is the first element in a zone. */
  first?: boolean;
};

/**
 * Standard section header: 3px gold accent bar + bold ~18px title + optional
 * right slot. 24px above / 16px below. Replaces the old centered SectionRule so
 * every section reads as a deliberate design element, consistently.
 */
export function SectionHeader({ title, right, style, first = false }: SectionHeaderProps) {
  return (
    <View style={[styles.row, first && styles.firstRow, style]}>
      <View style={styles.titleWrap}>
        <View style={styles.bar} />
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  firstRow: {
    marginTop: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  bar: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: SECTION_BAR,
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    color: TEXT_PRIMARY_DARK,
    flexShrink: 1,
  },
  right: {
    marginLeft: 12,
    flexShrink: 0,
  },
});
