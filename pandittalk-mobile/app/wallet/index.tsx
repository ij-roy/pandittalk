import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AVAILABLE_GREEN,
  BG,
  GOLD,
  GREY_LABEL,
  HEADER_RULE_GREY,
  IMAGE_PLACEHOLDER,
  MUTED_GREY,
  PLACEHOLDER_GREY,
  TEXT_PRIMARY_DARK,
  WALLET_GOLD_DARK,
  WHITE,
  SESSION_RED,
  SHADOW_BLACK,
} from '@/constants/Colors';
import { formatCoins } from '@/lib/bookingPricing';
import { COIN_VALUE_LINE, REFUND_FAQ_LABEL, REFUND_FAQ_NOTE } from '@/lib/walletRefundFaq';
import { hasSuccessfulRecharge, maxPackBonus, welcomeBonusLine } from '@/lib/welcomeBonus';
import { ledgerRowCopy } from '@/lib/ledgerLabels';
import {
  fetchGstInvoice,
  getWallet,
  type CoinPackage,
  type WalletTransaction,
} from '@/lib/walletApi';
import { useAuthStore } from '@/store/useAuthStore';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

function messageFromError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: unknown; error?: unknown } | undefined;
    const m = data?.message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m)) return m.map(String).join(', ');
    if (typeof data?.error === 'string') return data.error;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Could not load wallet.';
}

function formatTransactionDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const day = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${day}, ${time}`;
}

function transactionCoins(tx: WalletTransaction): number {
  let coins = Math.abs(Number(tx.coinsAmount) || 0);
  if (coins === 0) coins = Math.abs(Number(tx.amountInr) || 0);
  if (coins === 0) coins = Math.abs(Number(tx.amount) || 0);
  return coins;
}

function isCreditTransaction(type: string): boolean {
  const t = type.trim().toLowerCase();
  if (t === 'booking_debit' || t === 'debit' || t === 'session_debit') return false;
  if (
    t === 'purchase' ||
    t === 'refund' ||
    t === 'partial_refund' ||
    t === 'bonus' ||
    t === 'credit' ||
    t === 'recharge'
  ) {
    return true;
  }
  return false;
}

function transactionSign(type: string): '+' | '−' {
  const t = type.trim().toLowerCase();
  if (t === 'booking_debit' || t === 'debit' || t === 'session_debit') return '−';
  if (t === 'purchase' || t === 'refund' || t === 'partial_refund' || t === 'bonus') return '+';
  return isCreditTransaction(type) ? '+' : '−';
}


function WalletSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonBalanceCard} />
      <View style={styles.skeletonButton} />
      <View style={styles.skeletonSectionTitle} />
      {[0, 1, 2].map((key) => (
        <View key={key} style={styles.skeletonRow}>
          <View style={styles.skeletonCircle} />
          <View style={styles.skeletonRowLines}>
            <View style={[styles.skeletonLine, { width: '62%' }]} />
            <View style={[styles.skeletonLine, { width: '40%', marginTop: 8 }]} />
          </View>
          <View style={[styles.skeletonLine, { width: 56 }]} />
        </View>
      ))}
    </View>
  );
}

function canDownloadInvoice(tx: WalletTransaction): boolean {
  return tx.type.trim().toLowerCase() === 'purchase' && tx.status === 'SUCCESS';
}

type TransactionRowProps = {
  tx: WalletTransaction;
  onInvoice: (tx: WalletTransaction) => void;
};

function TransactionRow({ tx, onInvoice }: TransactionRowProps) {
  const coins = transactionCoins(tx);
  const credit = isCreditTransaction(tx.type);
  const sign = transactionSign(tx.type);
  const copy = ledgerRowCopy(tx);

  return (
    <View style={styles.txRow}>
      <View style={[styles.txIconWrap, credit ? styles.txIconCredit : styles.txIconDebit]}>
        <Ionicons
          name={credit ? 'arrow-up' : 'arrow-down'}
          size={16}
          color={credit ? AVAILABLE_GREEN : SESSION_RED}
        />
      </View>
      <View style={styles.txCenter}>
        <Text style={styles.txTitle} numberOfLines={2}>
          {copy.title}
        </Text>
        {copy.detail ? (
          <Text style={styles.txDetail} numberOfLines={3}>
            {copy.detail}
          </Text>
        ) : null}
        <Text style={styles.txDate}>{formatTransactionDate(tx.createdAt)}</Text>
        {canDownloadInvoice(tx) ? (
          <TouchableOpacity
            onPress={() => onInvoice(tx)}
            style={styles.invoiceHit}
            accessibilityRole="button"
            accessibilityLabel="Download tax invoice"
          >
            <Text style={styles.invoiceText}>Tax invoice</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={[styles.txAmount, credit ? styles.txAmountCredit : styles.txAmountDebit]}>
        {coins > 0 ? `${sign}${formatCoins(coins)} coins` : 'Amount unavailable'}
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const authHydrated = useAuthStore((s) => s.authHydrated);
  const walletBalance = useAuthStore((s) => s.walletBalance);
  const setWalletBalance = useAuthStore((s) => s.setWalletBalance);
  const flags = useFeatureFlags();

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);

  const loadWallet = useCallback(
    async (opts?: { refreshOnly?: boolean }) => {
      const refreshOnly = opts?.refreshOnly ?? false;
      if (!authHydrated) {
        if (!refreshOnly) setLoading(true);
        return;
      }
      if (!accessToken) {
        setTransactions([]);
        setPackages([]);
        setLoading(false);
        setRefreshing(false);
        setError('Please sign in to view your wallet.');
        return;
      }
      if (refreshOnly) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const data = await getWallet(accessToken);
        setWalletBalance(data.coinBalance);
        setTransactions(data.transactions);
        setPackages(data.packages);
      } catch (e) {
        setTransactions([]);
        setError(messageFromError(e));
      } finally {
        hasLoadedOnceRef.current = true;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, authHydrated, setWalletBalance],
  );

  useFocusEffect(
    useCallback(() => {
      void loadWallet(hasLoadedOnceRef.current ? { refreshOnly: true } : undefined);
    }, [loadWallet]),
  );

  const onRefresh = useCallback(() => {
    void loadWallet({ refreshOnly: true });
  }, [loadWallet]);

  const onInvoice = useCallback(
    async (tx: WalletTransaction) => {
      if (!accessToken) return;
      try {
        const invoice = await fetchGstInvoice(accessToken, tx.id);
        await Share.share({ message: invoice.text, title: invoice.invoiceNumber });
      } catch (e) {
        const message = e instanceof Error ? e.message : '';
        if (/cancel|dismiss/i.test(message)) return;
        Alert.alert('Could not download the invoice', messageFromError(e));
      }
    },
    [accessToken],
  );

  const onAddCoins = useCallback(() => {
    router.push({
      pathname: '/wallet/recharge',
      params: { packagesJson: JSON.stringify(packages) },
    });
  }, [packages, router]);

  const visibleTransactions = transactions;
  const bonusLine = useMemo(() => {
    const maxBonus = maxPackBonus(packages);
    return welcomeBonusLine(
      hasSuccessfulRecharge(transactions),
      maxBonus > 0 ? formatCoins(maxBonus) : null,
    );
  }, [packages, transactions]);

  const listHeader = (
    <View style={styles.listHeader}>
      <LinearGradient
        colors={[GOLD, WALLET_GOLD_DARK, GOLD]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.coinIconWrap}>
          <Ionicons name="wallet-outline" size={28} color={WHITE} />
        </View>
        <Text style={styles.balanceValue}>{formatCoins(walletBalance)}</Text>
        <Text style={styles.balanceSubtitle}>Coins Available</Text>
        <Text style={styles.balanceHint}>{COIN_VALUE_LINE}</Text>
      </LinearGradient>

      <TouchableOpacity
        onPress={() => router.push({ pathname: '/settings/legal-doc', params: { doc: 'refund' } })}
        accessibilityRole="link"
        accessibilityLabel={REFUND_FAQ_LABEL}
        style={styles.refundLinkHit}
      >
        <Text style={styles.refundNote}>{REFUND_FAQ_NOTE}</Text>
        <Text style={styles.refundLink}>{REFUND_FAQ_LABEL}</Text>
      </TouchableOpacity>

      {flags.payments ? (
        <>
          <TouchableOpacity
            style={styles.addCoinsBtn}
            onPress={onAddCoins}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Add coins"
          >
            <Text style={styles.addCoinsBtnText}>Add Coins</Text>
          </TouchableOpacity>
          {bonusLine ? <Text style={styles.welcomeBonus}>{bonusLine}</Text> : null}
        </>
      ) : (
        <Text style={styles.balanceHint}>Adding coins is paused right now. Your balance is unchanged.</Text>
      )}

      <Text style={styles.sectionTitle}>Transaction History</Text>
      {error ? <Text style={styles.inlineError}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backHit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={GOLD} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading && !refreshing ? (
        <WalletSkeleton />
      ) : (
        <FlatList
          data={visibleTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionRow tx={item} onInvoice={(tx) => void onInvoice(tx)} />}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            !error ? (
              <Text style={styles.emptyText}>No transactions yet</Text>
            ) : null
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: BG,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HEADER_RULE_GREY,
  },
  backHit: {
    minWidth: 44,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  headerSpacer: {
    minWidth: 44,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
    flexGrow: 1,
  },
  listHeader: {
    marginBottom: 8,
  },
  balanceCard: {
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: SHADOW_BLACK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
  coinIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  coinIcon: {
    width: 28,
    height: 28,
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: 0.5,
  },
  balanceSubtitle: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
  },
  balanceHint: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
  },
  refundLinkHit: {
    marginTop: 12,
    alignItems: 'center',
    gap: 4,
  },
  refundNote: {
    fontSize: 13,
    lineHeight: 18,
    color: GREY_LABEL,
    textAlign: 'center',
  },
  refundLink: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
  },
  addCoinsBtn: {
    marginTop: 16,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: WALLET_GOLD_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addCoinsBtnText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  welcomeBonus: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT_PRIMARY_DARK,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  inlineError: {
    marginBottom: 8,
    fontSize: 13,
    color: GREY_LABEL,
    lineHeight: 18,
  },
  emptyText: {
    textAlign: 'center',
    color: MUTED_GREY,
    fontSize: 14,
    paddingVertical: 28,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HEADER_RULE_GREY,
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txIconCredit: {
    backgroundColor: 'rgba(46, 158, 79, 0.12)',
  },
  txIconDebit: {
    backgroundColor: 'rgba(214, 69, 69, 0.1)',
  },
  txCenter: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
  },
  txDetail: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: GREY_LABEL,
  },
  txDate: {
    marginTop: 4,
    fontSize: 12,
    color: MUTED_GREY,
  },
  invoiceHit: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  invoiceText: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 0,
  },
  txAmountCredit: {
    color: AVAILABLE_GREEN,
  },
  txAmountDebit: {
    color: SESSION_RED,
  },
  skeletonWrap: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  skeletonBalanceCard: {
    height: 168,
    borderRadius: 20,
    backgroundColor: PLACEHOLDER_GREY,
  },
  skeletonButton: {
    marginTop: 16,
    height: 52,
    borderRadius: 14,
    backgroundColor: IMAGE_PLACEHOLDER,
  },
  skeletonSectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    height: 18,
    width: 160,
    borderRadius: 6,
    backgroundColor: IMAGE_PLACEHOLDER,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  skeletonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PLACEHOLDER_GREY,
    marginRight: 12,
  },
  skeletonRowLines: {
    flex: 1,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: PLACEHOLDER_GREY,
  },
});
