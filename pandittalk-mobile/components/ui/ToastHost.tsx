import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DANGER_RED,
  GOLD_BORDER,
  SURFACE,
  TEXT_PRIMARY_DARK,
} from '@/constants/Colors';
import { useToastStore } from '@/store/useToastStore';

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const message = useToastStore((s) => s.message);
  const variant = useToastStore((s) => s.variant);

  if (!message) return null;

  return (
    <View
      pointerEvents="none"
      style={[styles.host, { bottom: Math.max(insets.bottom, 16) + 8 }]}
    >
      <View
        style={[
          styles.banner,
          variant === 'error' && styles.bannerError,
        ]}
      >
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  banner: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  bannerError: {
    borderColor: DANGER_RED,
  },
  text: {
    color: TEXT_PRIMARY_DARK,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
