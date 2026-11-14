import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  CHIP_BORDER,
  GOLD,
  GOLD_BORDER,
  GREY_LABEL,
  TEXT_PRIMARY_DARK,
  WHITE,
} from '@/constants/Colors';
import { FIELD_RADIUS, BUTTON_HEIGHT } from '@/constants/Spacing';
import { shadowGoldGlow } from '@/constants/Shadows';
import { Typography } from '@/constants/Typography';

import { AnimatedPressable } from './AnimatedPressable';

export type PremiumButtonVariant = 'primary' | 'secondary' | 'ghost';
export type PremiumButtonSize = 'md' | 'lg';

type PremiumButtonProps = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: PremiumButtonVariant;
  size?: PremiumButtonSize;
  style?: StyleProp<ViewStyle>;
  uppercase?: boolean;
};

export function PremiumButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  size = 'md',
  style,
  uppercase = false,
}: PremiumButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        size === 'lg' && styles.large,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? WHITE : GOLD} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'primary' && styles.textPrimary,
            variant === 'secondary' && styles.textSecondary,
            variant === 'ghost' && styles.textGhost,
            uppercase && styles.uppercase,
          ]}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: BUTTON_HEIGHT,
    borderRadius: FIELD_RADIUS,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: {
    width: '100%',
    minHeight: 54,
    borderRadius: 14,
  },
  primary: {
    backgroundColor: GOLD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CHIP_BORDER,
    ...shadowGoldGlow,
  },
  secondary: {
    backgroundColor: WHITE,
    borderWidth: 1.2,
    borderColor: GOLD_BORDER,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  disabled: {
    opacity: 0.42,
  },
  text: {
    ...Typography.button,
  },
  textPrimary: {
    color: WHITE,
    letterSpacing: 0.2,
  },
  textSecondary: {
    color: TEXT_PRIMARY_DARK,
    fontWeight: '700',
  },
  textGhost: {
    color: GREY_LABEL,
    fontWeight: '600',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
