import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DEEP_GREY, WHITE } from '@/constants/Colors';
import { formatCoins } from '@/lib/bookingPricing';
import {
  WALLET_PILL_BACKGROUND,
  WALLET_PILL_FONT_SIZE,
  WALLET_PILL_TEXT,
} from '@/lib/walletBalancePill';

const HIT_SIZE = 44;
const WALLET_GLYPH = 18;

type WalletClusterProps = {
  balance: number;
};

/** Shared wallet balance pill + icon — used in tab header and tools stack */
export function WalletCluster({ balance }: WalletClusterProps) {
  return (
    <View style={styles.walletCluster}>
      <View style={styles.balancePill}>
        <Text style={styles.balanceText}>{formatCoins(balance)}</Text>
      </View>
      <View style={styles.walletBtn}>
        <Ionicons name="wallet-outline" size={WALLET_GLYPH} color={DEEP_GREY} />
      </View>
    </View>
  );
}

export const walletClusterStyles = StyleSheet.create({
  walletCluster: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletBtn: {
    width: HIT_SIZE,
    height: HIT_SIZE,
    borderRadius: HIT_SIZE / 2,
    borderWidth: 1.2,
    borderColor: DEEP_GREY,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: WHITE,
  },
  balancePill: {
    marginRight: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: WALLET_PILL_BACKGROUND,
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceText: {
    fontSize: WALLET_PILL_FONT_SIZE,
    fontWeight: '700',
    color: WALLET_PILL_TEXT,
  },
});

const styles = walletClusterStyles;
