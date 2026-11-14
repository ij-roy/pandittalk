import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { GOLD, TEXT_PRIMARY_DARK, WHITE } from '@/constants/Colors';
import { graceRefundLabel } from '@/lib/graceRefundCopy';

type Props = {
  pending: boolean;
  secondsLabel: string;
  onPress: () => void;
  disabled?: boolean;
  tone: 'onVideo' | 'onDark' | 'onLight';
};

export function GraceRefundLink({ pending, secondsLabel, onPress, disabled, tone }: Props) {
  const label = graceRefundLabel(pending, secondsLabel);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || pending}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Separate from mute, camera, and leave. Ends this session and asks for a refund."
      hitSlop={8}
      style={pending ? styles.pending : null}
    >
      <Text
        style={
          tone === 'onLight' ? styles.light : tone === 'onVideo' ? styles.onVideo : styles.onDark
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pending: {
    opacity: 0.6,
  },
  onVideo: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    backgroundColor: 'rgba(0,0,0,0.45)',
    overflow: 'hidden',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  onDark: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  light: {
    color: TEXT_PRIMARY_DARK,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
