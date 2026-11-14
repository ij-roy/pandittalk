import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';

import { WalletCluster } from '@/components/WalletCluster';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { formatCoins } from '@/lib/bookingPricing';
import { refreshWalletBalance } from '@/lib/walletApi';
import { useAuthStore } from '@/store/useAuthStore';

type Props = {
  onPress?: () => void;
};

export function ToolsStackWalletButton({ onPress }: Props) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const walletBalance = useAuthStore((s) => s.walletBalance);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        if (!accessToken) return;
        try {
          await refreshWalletBalance(accessToken);
        } catch {
          // Keep last known balance on refresh failure.
        }
      })();
    }, [accessToken]),
  );

  const openWallet = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }
    router.push('/wallet');
  }, [onPress, router]);

  return (
    <AnimatedPressable
      style={styles.container}
      onPress={openWallet}
      accessibilityRole="button"
      accessibilityLabel={`Wallet, ${formatCoins(walletBalance ?? 0)} coins`}
    >
      <WalletCluster balance={walletBalance ?? 0} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingRight: 12,
    paddingLeft: 4,
  },
});
