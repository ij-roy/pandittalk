import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';

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
  const [attentionProvider, setAttentionProvider] = useState<'google' | 'apple' | null>(null);
  const shake = useRef(new Animated.Value(0)).current;

  const pressProvider = (provider: 'google' | 'apple', onPress?: () => void) => {
    if (dimmed) {
      setAttentionProvider(provider);
      shake.stopAnimation();
      shake.setValue(0);
      Animated.sequence([
        Animated.timing(shake, { toValue: -5, duration: 55, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(shake, { toValue: 5, duration: 55, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(shake, { toValue: -3, duration: 45, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 45, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start(() => setAttentionProvider(null));
    }
    onPress?.();
  };

  const attentionStyle = (provider: 'google' | 'apple') => (
    attentionProvider === provider ? { transform: [{ translateX: shake }] } : undefined
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.ruleRow}>
        <View style={styles.ruleLine} />
        <Text style={styles.ruleLabel}>or continue with</Text>
        <View style={styles.ruleLine} />
      </View>

      {Platform.OS === 'ios' ? (
        <Animated.View style={attentionStyle('apple')}>
          <AnimatedPressable
            onPress={() => pressProvider('apple', onApple)}
            disabled={disabled}
            style={[styles.btn, styles.apple, dimmed && styles.dimmed]}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Apple"
            accessibilityHint={dimmed ? 'Tap to see what is needed before social sign-in.' : undefined}
            accessibilityState={{ disabled: Boolean(disabled) }}
          >
            <Ionicons name="logo-apple" size={20} color={WHITE} />
            <Text style={styles.appleText}>Sign in with Apple</Text>
          </AnimatedPressable>
        </Animated.View>
      ) : null}

      <Animated.View style={attentionStyle('google')}>
        <AnimatedPressable
          onPress={() => pressProvider('google', onGoogle)}
          disabled={disabled}
          style={[styles.btn, styles.google, dimmed && styles.dimmed]}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Google"
          accessibilityHint={dimmed ? 'Tap to see what is needed before social sign-in.' : undefined}
          accessibilityState={{ disabled: Boolean(disabled) }}
        >
          <Ionicons name="logo-google" size={18} color={TEXT_PRIMARY_DARK} />
          <Text style={styles.googleText}>Sign in with Google</Text>
        </AnimatedPressable>
      </Animated.View>
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
  dimmed: {
    opacity: 0.8,
  },
});
