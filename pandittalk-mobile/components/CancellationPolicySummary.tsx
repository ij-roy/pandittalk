import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { GOLD, GOLD_BORDER, GREY_LABEL, TEXT_PRIMARY_DARK, WARM_IVORY } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

const PLAIN_POINTS = [
  'Cancel before the session starts → full coin refund to your wallet.',
  'Pandit doesn’t join within 10 minutes → full refund.',
  'Call drops for platform/network reasons → unused time refunded after review.',
  'Refunds go to your PanditTalk Wallet (not bank cash-out).',
] as const;

type Props = {
  /** Tighter padding for sheets / footers */
  compact?: boolean;
};

/** Plain-language cancellation / refund summary shown before booking confirm. */
export function CancellationPolicySummary({ compact }: Props) {
  return (
    <View
      style={[styles.wrap, compact && styles.wrapCompact]}
      accessibilityRole="text"
      accessibilityLabel="Cancellation and refund summary"
    >
      <Text style={styles.title}>If you need to cancel</Text>
      {PLAIN_POINTS.map((line) => (
        <Text key={line} style={styles.bullet}>
          • {line}
        </Text>
      ))}
      <TouchableOpacity
        onPress={() =>
          router.push({ pathname: '/settings/legal-doc', params: { doc: 'refund' } })
        }
        hitSlop={8}
        accessibilityRole="link"
        accessibilityLabel="Open full refund and cancellation policy"
      >
        <Text style={styles.link}>Full policy</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: WARM_IVORY,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GOLD_BORDER,
    gap: 6,
  },
  wrapCompact: {
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 10,
  },
  title: {
    ...Typography.label,
    color: TEXT_PRIMARY_DARK,
    marginBottom: 2,
  },
  bullet: {
    ...Typography.caption,
    color: GREY_LABEL,
    lineHeight: 18,
  },
  link: {
    ...Typography.caption,
    color: GOLD,
    fontWeight: '600',
    marginTop: 4,
  },
});
