import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ENTERTAINMENT_DISCLAIMER } from '@/constants/legal';
import { GOLD_BORDER, GREY_LABEL, WARM_IVORY } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

/** Compact 4.3 / not-medical disclaimer for tools and guidance surfaces. */
export function EntertainmentDisclaimer({ compact }: { compact?: boolean }) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]} accessibilityRole="text">
      <Text style={styles.text}>{ENTERTAINMENT_DISCLAIMER}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: WARM_IVORY,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GOLD_BORDER,
  },
  wrapCompact: {
    marginTop: 8,
    paddingVertical: 8,
  },
  text: {
    ...Typography.caption,
    color: GREY_LABEL,
    lineHeight: 18,
  },
});
