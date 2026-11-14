import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WalletCluster } from '@/components/WalletCluster';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import {
  DANGER_RED,
  DEEP_GREY,
  HEADER_RULE_GREY,
  WHITE,
} from '@/constants/Colors';
import { PAGE_PAD } from '@/constants/Spacing';
import { tabHeaderTitleText } from '@/constants/screenHeader';
import { useTabMenuOptional } from '@/contexts/TabMenuContext';
import { formatCoins } from '@/lib/bookingPricing';
import { getUnreadCount } from '@/lib/notificationApi';
import { refreshWalletBalance } from '@/lib/walletApi';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';

const HIT_SIZE = 44;
const MENU_GLYPH = 24;
const SEARCH_GLYPH = 20;

type Props = {
  title: string;
  showSearch?: boolean;
  /** Show a back chevron on the left (e.g. profile opened from settings). */
  showBack?: boolean;
  onSearchPress?: () => void;
  onWalletPress?: () => void;
};

export function TabTopHeader({
  title,
  showSearch,
  showBack,
  onSearchPress,
  onWalletPress,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const menu = useTabMenuOptional();
  const paddingTop = Math.max(insets.top, 10);

  const accessToken = useAuthStore((s) => s.accessToken);
  const walletBalance = useAuthStore((s) => s.walletBalance);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        if (!accessToken) return;
        try {
          const startedEpoch = useNotificationStore.getState().unreadEpoch;
          const [, unread] = await Promise.all([
            refreshWalletBalance(accessToken),
            getUnreadCount().catch(() => null),
          ]);
          if (cancelled) return;
          if (unread !== null) {
            setUnreadCount(unread, startedEpoch);
          }
        } catch {
          // Keep last known values on refresh failure.
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [accessToken, setUnreadCount]),
  );

  const openWallet = useCallback(() => {
    if (onWalletPress) {
      onWalletPress();
      return;
    }
    router.push('/wallet');
  }, [onWalletPress, router]);

  const openNotifications = useCallback(() => {
    router.push('/notifications');
  }, [router]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)' as never);
  }, [router]);

  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <View style={[styles.bar, { paddingTop }]}>
      <View style={styles.row}>
        {showBack ? (
          <AnimatedPressable
            style={styles.iconSlot}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={MENU_GLYPH} color={DEEP_GREY} />
          </AnimatedPressable>
        ) : menu ? (
          <AnimatedPressable
            style={styles.iconSlot}
            onPress={menu.openMenu}
            accessibilityLabel="Open menu"
          >
            <Ionicons name="menu-outline" size={MENU_GLYPH} color={DEEP_GREY} />
          </AnimatedPressable>
        ) : (
          <View style={styles.iconSlot} accessibilityElementsHidden />
        )}

        <Text style={tabHeaderTitleText} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.right}>
          {showSearch ? (
            <AnimatedPressable
              style={styles.iconSlot}
              onPress={onSearchPress}
              accessibilityLabel="Search"
            >
              <Ionicons name="search" size={SEARCH_GLYPH} color={DEEP_GREY} />
            </AnimatedPressable>
          ) : null}
          <AnimatedPressable
            style={styles.bellSlot}
            onPress={openNotifications}
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : 'Notifications'
            }
          >
            <Ionicons name="notifications-outline" size={20} color={DEEP_GREY} />
            {unreadCount > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{badgeLabel}</Text>
              </View>
            ) : null}
          </AnimatedPressable>
          <AnimatedPressable
            style={[styles.walletClusterWrap, showSearch && styles.walletAfterSearch]}
            onPress={openWallet}
            accessibilityRole="button"
            accessibilityLabel={`Wallet, ${formatCoins(walletBalance)} coins`}
          >
            <WalletCluster balance={walletBalance} />
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: 'transparent',
    paddingHorizontal: PAGE_PAD,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HEADER_RULE_GREY,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSlot: {
    width: HIT_SIZE,
    height: HIT_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  walletClusterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletAfterSearch: {
    marginLeft: 2,
  },
  bellSlot: {
    width: HIT_SIZE,
    height: HIT_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: DANGER_RED,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DANGER_RED,
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: WHITE,
  },
});
