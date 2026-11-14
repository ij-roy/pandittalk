import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  NativeModules,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BG,
  GOLD,
  GOLD_GLOW,
  GOLD_RING_BORDER,
  GREY_LABEL,
  HEADER_RULE_GREY,
  MUTED_GREY,
  SHADOW_BLACK,
  TEXT_PRIMARY_DARK,
  WALLET_GOLD_DARK,
  WHITE,
} from '@/constants/Colors';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { formatCoins, formatRupee } from '@/lib/bookingPricing';
import { packBadges, type PackBadge } from '@/lib/packBadges';
import { paymentFailureTicket, type PaymentFailureStage } from '@/lib/paymentFailureHelp';
import { createSupportRequest } from '@/lib/supportApi';
import { hasSuccessfulRecharge, maxPackBonus, welcomeBonusLine } from '@/lib/welcomeBonus';
import { REFUND_FAQ_LABEL, REFUND_FAQ_NOTE } from '@/lib/walletRefundFaq';
import {
  cancelAbandonedRechargeReminder,
  scheduleAbandonedRechargeReminder,
  shouldRemindAbandonedRecharge,
} from '@/lib/abandonedRecharge';
import { balanceCountSteps, rechargeSuccessLabel, safeRechargeReturn } from '@/lib/rechargeSuccess';
import {
  buildRazorpayOptions,
  openRazorpayCheckout,
} from '@/lib/razorpayCheckout';
import {
  createOrder,
  getWallet,
  verifyPayment,
  type CoinPackage,
} from '@/lib/walletApi';
import { useAuthStore, type AuthUser } from '@/store/useAuthStore';

function parsePackagesJson(raw: string | string[] | undefined): CoinPackage[] {
  const str = Array.isArray(raw) ? raw[0] : raw;
  if (!str?.trim()) return [];
  try {
    const parsed = JSON.parse(str) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is CoinPackage => !!p && typeof p === 'object' && 'id' in p);
  } catch {
    return [];
  }
}

function assertOrderDataForCheckout(order: {
  orderId?: string;
  keyId?: string;
  amount?: number;
  currency?: string;
}): void {
  if (!order.orderId?.trim()) {
    throw new Error('Payment setup failed: missing Razorpay order id');
  }
  if (!order.keyId?.trim()) {
    throw new Error('Payment setup failed: missing Razorpay key id');
  }
  if (!Number.isFinite(order.amount) || (order.amount ?? 0) <= 0) {
    throw new Error(`Payment setup failed: invalid amount (${String(order.amount)})`);
  }
  if (!order.currency?.trim()) {
    throw new Error('Payment setup failed: missing currency');
  }
}

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
  return 'Something went wrong. Please try again.';
}

function razorpayErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>;
    if (typeof o.description === 'string' && o.description.trim()) return o.description;
    const nested = o.error;
    if (nested && typeof nested === 'object') {
      const e = nested as Record<string, unknown>;
      if (typeof e.description === 'string' && e.description.trim()) return e.description;
    }
  }
  return 'Payment was cancelled or failed.';
}

function phoneFromUser(user: AuthUser | null): string | undefined {
  if (!user) return undefined;
  const raw = user.phoneNumber ?? user.phone_number ?? user.phone;
  if (typeof raw === 'string' && raw.trim()) return raw.replace(/\s/g, '');
  return undefined;
}

type CoinPackageFields = CoinPackage & {
  price_inr?: number | string;
  bonus_coins?: number | string;
  price?: number | string;
};

function packagePriceInr(pkg: CoinPackageFields): number {
  return Number(pkg.priceInr ?? pkg.price_inr ?? pkg.price ?? pkg.amount ?? 0) || 0;
}

function packageBonusCoins(pkg: CoinPackageFields): number {
  return Number(pkg.bonusCoins ?? pkg.bonus_coins ?? 0) || 0;
}

function formatPackagePrice(price: number): string {
  return formatRupee(price);
}

function totalCoins(pkg: CoinPackage): number {
  const bonus = packageBonusCoins(pkg);
  return pkg.coins + (bonus > 0 ? bonus : 0);
}

function packageDescription(pkg: CoinPackage): string {
  const label = pkg.label?.trim();
  return label ? `${label} Coin Pack` : `${formatCoins(pkg.coins)} Coin Pack`;
}

const hasRazorpayNative = Platform.OS !== 'web' && !!NativeModules.RNRazorpayCheckout;

type PackageCardProps = {
  pkg: CoinPackage;
  badge: PackBadge;
  selected: boolean;
  onPress: () => void;
};

function PackageCard({ pkg, badge, selected, onPress }: PackageCardProps) {
  const saveLabel = badge.savePercent ? `Save ${badge.savePercent}%` : null;
  const bonus = packageBonusCoins(pkg);
  const total = pkg.coins + (bonus > 0 ? bonus : 0);
  const accessibilityLabel = [
    packageDescription(pkg),
    `${formatCoins(total)} coins`,
    bonus > 0 ? `includes ${formatCoins(bonus)} bonus coins` : '',
    badge.popular ? 'Most popular' : '',
    saveLabel ? `${saveLabel} versus the smallest pack` : '',
  ]
    .filter(Boolean)
    .join('. ');
  return (
    <TouchableOpacity
      style={[styles.packageCard, selected && styles.packageCardSelected]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
    >
      {badge.popular ? (
        <View style={styles.popularRibbon}>
          <Text style={styles.popularRibbonText}>Most Popular</Text>
        </View>
      ) : null}
      <Text style={styles.coinAmount}>{formatCoins(total)} coins</Text>
      {bonus > 0 ? (
        <Text style={styles.bonusIncluded}>
          {formatCoins(pkg.coins)} plus {formatCoins(bonus)} bonus
        </Text>
      ) : null}
      <Text style={styles.priceText}>{formatPackagePrice(packagePriceInr(pkg))}</Text>
      {saveLabel ? <Text style={styles.saveText}>{saveLabel}</Text> : null}
    </TouchableOpacity>
  );
}

export default function WalletRechargeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ packagesJson?: string; returnTo?: string }>();
  const returnTo = safeRechargeReturn(params.returnTo);

  const accessToken = useAuthStore((s) => s.accessToken);
  const authHydrated = useAuthStore((s) => s.authHydrated);
  const user = useAuthStore((s) => s.user);
  const setWalletBalance = useAuthStore((s) => s.setWalletBalance);
  const flags = useFeatureFlags();

  const paramPackages = useMemo(() => parsePackagesJson(params.packagesJson), [params.packagesJson]);

  const [packages, setPackages] = useState<CoinPackage[]>(paramPackages);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [loadingPackages, setLoadingPackages] = useState(paramPackages.length === 0);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcomeLine, setWelcomeLine] = useState<string | null>(null);
  const interestedRef = useRef(false);
  const paidRef = useRef(false);
  const [success, setSuccess] = useState<{ added: number; balance: number } | null>(null);
  const [shownBalance, setShownBalance] = useState(0);
  const badges = useMemo(
    () =>
      packBadges(
        packages.map((pkg) => ({
          id: pkg.id,
          coins: pkg.coins,
          bonusCoins: packageBonusCoins(pkg),
          priceInr: packagePriceInr(pkg),
          isPopular: pkg.isPopular,
        })),
      ),
    [packages],
  );

  const loadPackages = useCallback(async () => {
    if (!authHydrated) return;
    if (!accessToken) {
      setError('Please sign in to add coins.');
      setLoadingPackages(false);
      return;
    }
    setLoadingPackages(true);
    setError(null);
    try {
      const data = await getWallet(accessToken);
      setPackages(data.packages);
      const maxBonus = maxPackBonus(data.packages);
      setWelcomeLine(
        welcomeBonusLine(
          hasSuccessfulRecharge(data.transactions),
          maxBonus > 0 ? formatCoins(maxBonus) : null,
        ),
      );
      if (data.packages.length === 0) {
        setError('No coin packs available right now.');
      }
    } catch (e) {
      setError(messageFromError(e));
    } finally {
      setLoadingPackages(false);
    }
  }, [accessToken, authHydrated]);

  useEffect(() => {
    if (paramPackages.length > 0) {
      setPackages(paramPackages);
      setLoadingPackages(false);
      return;
    }
    void loadPackages();
  }, [paramPackages, loadPackages]);

  useEffect(() => {
    if (selectedPackage) interestedRef.current = true;
  }, [selectedPackage]);

  useFocusEffect(
    useCallback(() => {
      void cancelAbandonedRechargeReminder();
      return () => {
        if (
          shouldRemindAbandonedRecharge({
            interested: interestedRef.current,
            paid: paidRef.current,
          })
        ) {
          void scheduleAbandonedRechargeReminder();
        }
      };
    }, []),
  );

  useEffect(() => {
    if (!success) return;
    const from = Math.max(0, success.balance - success.added);
    const steps = balanceCountSteps(from, success.balance);
    let index = 0;
    setShownBalance(steps[0] ?? success.balance);
    const timer = setInterval(() => {
      index += 1;
      if (index >= steps.length) {
        clearInterval(timer);
        return;
      }
      setShownBalance(steps[index]);
    }, 45);
    return () => clearInterval(timer);
  }, [success]);

  const onProceedToPay = useCallback(async () => {
    if (!flags.payments) {
      Alert.alert(
        'Adding coins is paused',
        'You will not be charged. Your existing balance is unchanged.',
      );
      return;
    }
    if (!selectedPackage || !accessToken) return;

    if (!hasRazorpayNative) {
      Alert.alert(
        'Development build required',
        'Razorpay does not run in Expo Go. Build once with npx expo run:android or npx expo run:ios, then start Metro with npx expo start --dev-client.',
      );
      return;
    }

    const reportFailure = (stage: PaymentFailureStage, reason: string, paymentId?: string) => {
      Alert.alert('Payment failed', reason, [
        {
          text: 'Get help',
          onPress: () => {
            const ticket = paymentFailureTicket({
              stage,
              packId: selectedPackage.id,
              reason,
              paymentId,
            });
            void createSupportRequest(accessToken, ticket)
              .then(() => {
                Alert.alert(
                  'Help requested',
                  'We received this payment issue. Coins are added only after a successful payment.',
                );
              })
              .catch(() => {
                Alert.alert('Could not send help request', 'Try again in a moment.');
              });
          },
        },
        { text: 'OK', style: 'cancel' },
      ]);
    };

    setPaying(true);
    let orderData;
    try {
      orderData = await createOrder(accessToken, selectedPackage.id);
      assertOrderDataForCheckout(orderData);
    } catch (e) {
      reportFailure('order', messageFromError(e));
      setPaying(false);
      return;
    }

    const options = {
      ...buildRazorpayOptions(
        orderData,
        packageDescription(selectedPackage),
        phoneFromUser(user),
      ),
      theme: { color: GOLD },
    };

    let payment;
    try {
      payment = await openRazorpayCheckout(options);
    } catch (e) {
      reportFailure('checkout', razorpayErrorMessage(e));
      setPaying(false);
      return;
    }

    try {
      const result = await verifyPayment(accessToken, {
        razorpayOrderId: payment.razorpay_order_id,
        razorpayPaymentId: payment.razorpay_payment_id,
        razorpaySignature: payment.razorpay_signature,
      });

      if (!result.success) {
        throw new Error('Payment verification failed.');
      }

      paidRef.current = true;
      void cancelAbandonedRechargeReminder();
      setWalletBalance(result.newBalance);
      setShownBalance(Math.max(0, result.newBalance - result.coinsAdded));
      setSuccess({ added: result.coinsAdded, balance: result.newBalance });
    } catch (e) {
      reportFailure('verify', messageFromError(e), payment.razorpay_payment_id);
    } finally {
      setPaying(false);
    }
  }, [accessToken, flags.payments, router, selectedPackage, setWalletBalance, user]);

  const bottomInset = Math.max(insets.bottom, 12);
  const sheetVisible = !!selectedPackage;
  const listBottomPad = sheetVisible ? 200 + bottomInset : bottomInset + 24;

  if (success) {
    const label = rechargeSuccessLabel(returnTo);
    return (
      <View style={styles.screen}>
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Coins added</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.successBody}>
          <Text style={styles.successBalance}>{formatCoins(shownBalance)}</Text>
          <Text style={styles.successCaption}>coins in your wallet</Text>
          <Text style={styles.successDetail}>{formatCoins(success.added)} coins were added.</Text>
          <TouchableOpacity
            style={styles.successPrimary}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <Text style={styles.successPrimaryText}>{label}</Text>
          </TouchableOpacity>
          {returnTo ? (
            <TouchableOpacity
              style={styles.successSecondary}
              onPress={() => router.replace('/wallet')}
              accessibilityRole="button"
              accessibilityLabel="View wallet"
            >
              <Text style={styles.successSecondaryText}>View wallet</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Add Coins</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.subtitle}>
        {Platform.OS === 'ios'
          ? 'Coins are for live consultations with pandits'
          : 'Choose a coin pack'}
      </Text>
      {welcomeLine ? <Text style={styles.subtitle}>{welcomeLine}</Text> : null}
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/settings/legal-doc', params: { doc: 'refund' } })}
        accessibilityRole="link"
        accessibilityLabel={REFUND_FAQ_LABEL}
        style={styles.refundLinkHit}
      >
        <Text style={styles.refundNote}>{REFUND_FAQ_NOTE}</Text>
        <Text style={styles.refundLink}>{REFUND_FAQ_LABEL}</Text>
      </TouchableOpacity>

      {loadingPackages ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : error && packages.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void loadPackages()} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={packages}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[styles.gridContent, { paddingBottom: listBottomPad }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.gridCell}>
              <PackageCard
                pkg={item}
                badge={badges[item.id] ?? { popular: false, savePercent: null }}
                selected={selectedPackage?.id === item.id}
                onPress={() => setSelectedPackage(item)}
              />
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No coin packs available</Text>
          }
        />
      )}

      {sheetVisible && selectedPackage ? (
        <View style={[styles.bottomSheet, { paddingBottom: bottomInset }]}>
          <Text style={styles.sheetLine}>
            You get:{' '}
            <Text style={styles.sheetEmphasis}>{formatCoins(totalCoins(selectedPackage))} coins</Text>
          </Text>
          <Text style={styles.sheetLine}>
            Pay:{' '}
            <Text style={styles.sheetEmphasis}>
              {formatPackagePrice(packagePriceInr(selectedPackage))}
            </Text>
          </Text>
          <TouchableOpacity
            style={[styles.payBtn, paying && styles.payBtnDisabled]}
            onPress={() => void onProceedToPay()}
            disabled={paying}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Proceed to pay"
          >
            {paying ? (
              <ActivityIndicator color={WHITE} />
            ) : (
              <Text style={styles.payBtnText}>Proceed to Pay</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HEADER_RULE_GREY,
  },
  backHit: {
    minWidth: 44,
    paddingVertical: 4,
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
  subtitle: {
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
    color: MUTED_GREY,
  },
  refundLinkHit: {
    marginBottom: 12,
    alignItems: 'center',
    gap: 4,
  },
  refundNote: {
    fontSize: 13,
    lineHeight: 18,
    color: GREY_LABEL,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  refundLink: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    color: GREY_LABEL,
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: GOLD,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: WHITE,
  },
  gridContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
  gridCell: {
    flex: 1,
  },
  packageCard: {
    flex: 1,
    minHeight: 128,
    borderRadius: 16,
    backgroundColor: WHITE,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  packageCardSelected: {
    borderColor: GOLD,
    backgroundColor: GOLD_GLOW,
  },
  popularRibbon: {
    position: 'absolute',
    top: 10,
    left: -28,
    width: 110,
    backgroundColor: GOLD,
    paddingVertical: 3,
    transform: [{ rotate: '-42deg' }],
    alignItems: 'center',
  },
  popularRibbonText: {
    fontSize: 9,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: 0.2,
  },
  bonusIncluded: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
  },
  coinAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  saveText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: GOLD_RING_BORDER,
  },
  emptyText: {
    textAlign: 'center',
    color: MUTED_GREY,
    fontSize: 14,
    paddingVertical: 32,
    width: '100%',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HEADER_RULE_GREY,
    shadowColor: SHADOW_BLACK,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  sheetLine: {
    fontSize: 15,
    color: GREY_LABEL,
    marginBottom: 6,
  },
  sheetEmphasis: {
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  payBtn: {
    marginTop: 14,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: WALLET_GOLD_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  payBtnDisabled: {
    opacity: 0.85,
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
  },
  successBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  successBalance: {
    fontSize: 42,
    fontWeight: '800',
    color: TEXT_PRIMARY_DARK,
  },
  successCaption: {
    marginTop: 6,
    fontSize: 16,
    color: GREY_LABEL,
  },
  successDetail: {
    marginTop: 16,
    fontSize: 15,
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
  },
  successPrimary: {
    marginTop: 28,
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successPrimaryText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  successSecondary: {
    marginTop: 8,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  successSecondaryText: {
    color: GOLD,
    fontSize: 15,
    fontWeight: '700',
  },
});
