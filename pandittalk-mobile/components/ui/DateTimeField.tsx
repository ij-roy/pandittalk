import { Ionicons } from '@expo/vector-icons';
import React, { type ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { GOLD } from '@/constants/Colors';

import { formStyles } from './formStyles';

type DateTimeFieldProps = {
  label: string;
  /** Formatted value, or empty string to show the placeholder. */
  value: string;
  placeholder: string;
  icon: 'calendar' | 'time-outline';
  onPress?: () => void;
  disabled?: boolean;
  /** Web: a native <input> node rendered in place of the touchable value. */
  webInput?: ReactNode;
};

/**
 * Shared date/time trigger. Uses formStyles.dateTimeField so it is PIXEL
 * IDENTICAL to text inputs (height, padding, border, radius) with a small
 * calendar/clock icon on the right. The single source for ALL date/time fields.
 */
export function DateTimeField({
  label,
  value,
  placeholder,
  icon,
  onPress,
  disabled,
  webInput,
}: DateTimeFieldProps) {
  return (
    <View style={formStyles.fieldBlock}>
      <Text style={formStyles.fieldLabel}>{label}</Text>
      {webInput ? (
        <View style={formStyles.dateTimeField}>
          {webInput}
          <Ionicons name={icon} size={20} color={GOLD} />
        </View>
      ) : (
        <TouchableOpacity
          style={formStyles.dateTimeField}
          activeOpacity={0.85}
          onPress={onPress}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={value || placeholder}
        >
          <Text style={[formStyles.dateTimeValue, !value && formStyles.selectPlaceholder]}>
            {value || placeholder}
          </Text>
          <Ionicons name={icon} size={20} color={GOLD} />
        </TouchableOpacity>
      )}
    </View>
  );
}
