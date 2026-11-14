import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { GOLD, GREY_LABEL } from '@/constants/Colors';
import { NO_INTERNET_MESSAGE } from '@/lib/toolSubmitError';

type Props = {
  message: string | null;
  onRetry: () => void;
};

export function ToolSubmitError({ message, onRetry }: Props) {
  if (!message) return null;
  const offline = message === NO_INTERNET_MESSAGE;
  return (
    <View style={styles.wrap}>
      <Text style={styles.message}>{message}</Text>
      {offline ? (
        <TouchableOpacity
          onPress={onRetry}
          style={styles.retry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  message: {
    fontSize: 13,
    color: GREY_LABEL,
    lineHeight: 18,
    textAlign: 'center',
  },
  retry: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: GOLD,
    fontSize: 15,
    fontWeight: '700',
  },
});
