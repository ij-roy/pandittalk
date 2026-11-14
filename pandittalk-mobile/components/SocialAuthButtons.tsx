import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import {
  CHIP_BORDER,
  GOLD_BORDER,
  HEADER_RULE_GREY,
  MUTED_GREY,
  NEAR_BLACK,
  TEXT_PRIMARY_DARK,
  WHITE,
} from '@/constants/Colors';
import { BUTTON_HEIGHT, FIELD_RADIUS } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';

type Props = {
  onGoogle: () => void;
  onApple?: () => void;
  /** Hard-disable (e.g. in-flight request) — presses are ignored */
  disabled?: boolean;
  /**
   * Visual-only dimming (e.g. terms unchecked). Presses still fire so the
   * parent can show a toast explaining what to fix.
   */
  dimmed?: boolean;
};

export function SocialAuthButtons({ onGoogle, onApple, disabled, dimmed }: Props) {
  const lookDisabled = Boolean(disabled || dimmed);

  return (
    <View style={styles.wrap}>
      <View style={styles.ruleRow}>
        <View style={styles.ruleLine} />
        <Text style={styles.ruleLabel}>or continue with</Text>
        <View style={styles.ruleLine} />
      </View>

      <AnimatedPressable
        onPress={onGoogle}
        disabled={disabled}
        style={[styles.btn, styles.google, lookDisabled && styles.disabled]}
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        accessibilityState={{ disabled: lookDisabled }}
      >
        <Ionicons name="logo-google" size={18} color={TEXT_PRIMARY_DARK} />
        <Text style={styles.googleText}>Continue with Google</Text>
      </AnimatedPressable>

      {Platform.OS === 'ios' ? (
        <AnimatedPressable
          onPress={onApple}
          disabled={disabled}
          style={[styles.btn, styles.apple, lookDisabled && styles.disabled]}
          accessibilityRole="button"
          accessibilityLabel="Continue with Apple"
          accessibilityState={{ disabled: lookDisabled }}
        >
          <Ionicons name="logo-apple" size={20} color={WHITE} />
          <Text style={styles.appleText}>Continue with Apple</Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: 8,
    gap: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  ruleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: HEADER_RULE_GREY,
  },
  ruleLabel: {
    ...Typography.caption,
    color: MUTED_GREY,
    marginHorizontal: 12,
    textTransform: 'lowercase',
    letterSpacing: 0.4,
  },
  btn: {
    minHeight: BUTTON_HEIGHT,
    borderRadius: FIELD_RADIUS,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  google: {
    backgroundColor: WHITE,
    borderWidth: 1.2,
    borderColor: GOLD_BORDER,
  },
  googleText: {
    ...Typography.button,
    color: TEXT_PRIMARY_DARK,
    letterSpacing: 0.2,
  },
  apple: {
    backgroundColor: NEAR_BLACK,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CHIP_BORDER,
  },
  appleText: {
    ...Typography.button,
    color: WHITE,
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.42,
  },
});
