import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEEP_GREY, WHITE } from '@/constants/Colors';
import { shouldShowOfflineBanner, type ConnectivitySnapshot } from '@/lib/offlineBanner';

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let subscription: { remove: () => void } | undefined;
    let cancelled = false;

    const apply = (state: ConnectivitySnapshot) => {
      if (!cancelled) setOffline(shouldShowOfflineBanner(state));
    };

    void (async () => {
      try {
        const Network = await import('expo-network');
        apply(await Network.getNetworkStateAsync());
        subscription = Network.addNetworkStateListener(apply);
      } catch {
        if (!cancelled) setOffline(false);
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  if (!offline) return null;

  return (
    <View pointerEvents="none" style={[styles.wrap, { paddingTop: Math.max(insets.top, 8) }]}>
      <Text style={styles.text}>You are offline. Try again when the connection is back.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: DEEP_GREY,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  text: {
    color: WHITE,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
});
