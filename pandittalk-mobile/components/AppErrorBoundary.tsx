import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BG, GOLD, TEXT_PRIMARY_DARK } from '@/constants/Colors';
import { createErrorReference, logErrorReference } from '@/lib/errorReference';

type Props = {
  error: Error;
  retry: () => void;
};

/** Root crash screen. Shows a support reference instead of a blank failure. */
export function AppErrorBoundary({ error, retry }: Props) {
  const [reference] = useState(createErrorReference);

  useEffect(() => {
    logErrorReference(reference, error);
  }, [error, reference]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.body}>
        Please try again. If it keeps happening, share this reference with support.
      </Text>
      <Text
        style={styles.reference}
        accessibilityRole="text"
        accessibilityLabel={`Error reference ${reference}`}
        selectable
      >
        {reference}
      </Text>
      <Pressable
        style={styles.retry}
        onPress={() => retry()}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
  },
  body: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    opacity: 0.8,
  },
  reference: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: GOLD,
  },
  retry: {
    marginTop: 28,
    minHeight: 44,
    paddingHorizontal: 22,
    borderRadius: 8,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
