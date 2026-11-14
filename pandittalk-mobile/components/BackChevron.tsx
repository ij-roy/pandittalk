import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { DEEP_GREY } from '@/constants/Colors';

/** Shared back control so screens use one chevron instead of mixed “← Back” text. */
export function BackChevron({ color = DEEP_GREY, size = 26 }: { color?: string; size?: number }) {
  return <Ionicons name="chevron-back" size={size} color={color} />;
}
