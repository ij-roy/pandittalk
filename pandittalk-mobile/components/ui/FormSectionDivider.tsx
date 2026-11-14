import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { GOLD_BORDER, GREY_LABEL } from '@/constants/Colors';

type FormSectionDividerProps = {
  label: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Thin gold line with a centered label. Divides grouped form sections
 * (e.g. Person 1 / Person 2) so blocks read as deliberately grouped.
 */
export function FormSectionDivider({ label, style }: FormSectionDividerProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: GOLD_BORDER,
  },
  label: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: GREY_LABEL,
  },
});
