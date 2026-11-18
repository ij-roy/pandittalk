import { Feather, Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DrawerRow } from '@/components/DrawerRow';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { MandalaBackdrop } from '@/components/ui/MandalaBackdrop';
import {
  GOLD,
  GOLD_BORDER,
  GOLD_GLOW,
  GREY_LABEL,
  HEADER_RULE_GREY,
  IMAGE_PLACEHOLDER,
  SCRIM_BLACK,
  SHADOW_BLACK,
  SURFACE,
  TEXT_PRIMARY_DARK,
  WARM_IVORY,
  WHITE,
} from '@/constants/Colors';
import { screenBackground } from '@/constants/Gradients';
import { Typography } from '@/constants/Typography';
import { logoutSession, resolveMediaUrl } from '@/lib/authApi';
import {
  LOGOUT_CANCEL,
  LOGOUT_CONFIRM,
  LOGOUT_RECOVERY,
  LOGOUT_TITLE,
} from '@/lib/accountRecovery';
import { formatCoins } from '@/lib/bookingPricing';
import { getChatRouteParams } from '@/lib/chatBookingStatus';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveChatBooking } from '@/hooks/useActiveChatBooking';

type Props = { isVisible: boolean; onClose: () => void };

function readStr(user: Record<string, unknown> | null, key: string): string {
  const v = user?.[key];
  return typeof v === 'string' ? v.trim() : '';
}

export function SideMenu({ isVisible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const drawerW = Math.min(screenW * 0.84, 340);

  const translateX = useSharedValue(-drawerW);
  const scrim = useSharedValue(0);

  const user = useAuthStore((s) => s.user);
  const walletBalance = useAuthStore((s) => s.walletBalance);
  const { activeChat } = useActiveChatBooking();

  const firstName = readStr(user, 'firstName');
  const lastName = readStr(user, 'lastName');
  const fullName = `${firstName} ${lastName}`.trim();
  const phoneNumber = readStr(user, 'phoneNumber');
  const profileImageUrl = readStr(user, 'profileImageUrl');
  const avatarUri = profileImageUrl ? resolveMediaUrl(profileImageUrl) : null;
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));

  useEffect(() => {
    if (!isVisible) return;
    translateX.value = -drawerW;
    scrim.value = 0;
    translateX.value = withTiming(0, { duration: 280 });
    scrim.value = withTiming(1, { duration: 280 });
    // shared values are stable refs, not reactive deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, drawerW]);

  const closeThen = (cb?: () => void) => {
    scrim.value = withTiming(0, { duration: 220 });
    translateX.value = withTiming(-drawerW, { duration: 220 }, (done) => {
      if (done) runOnJS(cb ?? onClose)();
    });
  };

  const navigate = (path: string) => {
    closeThen(() => {
      onClose();
      router.push(path as never);
    });
  };

  const onLogout = () => {
    Alert.alert(LOGOUT_TITLE, LOGOUT_RECOVERY, [
      { text: LOGOUT_CANCEL, style: 'cancel' },
      {
        text: LOGOUT_CONFIRM,
        style: 'destructive',
        onPress: () => {
          closeThen(() => {
            onClose();
            void (async () => {
              await logoutSession();
              router.replace('/login');
            })();
          });
        },
      },
    ]);
  };

  const onShareApp = () => {
    closeThen(() => {
      onClose();
      void Share.share({
        message: 'Talk with a pandit on PanditTalk\nhttps://www.pandittalk.com',
        url: 'https://www.pandittalk.com',
      }).catch((e: unknown) => {
        const message = e instanceof Error ? e.message : '';
        if (/cancel|dismiss/i.test(message)) return;
      });
    });
  };

  const onRateApp = () => {
    const url =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/id6797837559?action=write-review'
        : 'https://play.google.com/store/apps/details?id=com.pandittalk.mobile';
    closeThen(() => {
      onClose();
      void Linking.openURL(url).catch(() => {
        Alert.alert('Could not open the store', 'Try again in a moment.');
      });
    });
  };

  type MenuItem = {
    id: string;
    icon: React.ComponentProps<typeof Feather>['name'];
    label: string;
    onPress: () => void;
  };

  const menuSections = useMemo(() => {
    const rejoinName = activeChat?.panditName?.trim() || 'pandit';
    const activity: MenuItem[] = [
      {
        id: 'sessions',
        icon: 'calendar',
        label: 'Sessions',
        onPress: () => navigate('/bookings/history'),
      },
      {
        id: 'reports',
        icon: 'file-text',
        label: 'Reports',
        onPress: () => navigate('/reports'),
      },
      {
        id: 'notifications',
        icon: 'bell',
        label: 'Notifications',
        onPress: () => navigate('/notifications'),
      },
    ];
    const resources: MenuItem[] = [
      {
        id: 'articles',
        icon: 'book-open',
        label: 'Articles',
        onPress: () => navigate('/articles'),
      },
      {
        id: 'settings',
        icon: 'settings',
        label: 'Settings',
        onPress: () => navigate('/settings'),
      },
      {
        id: 'share',
        icon: 'share-2',
        label: 'Share PanditTalk',
        onPress: onShareApp,
      },
      {
        id: 'rate',
        icon: 'star',
        label: 'Rate PanditTalk',
        onPress: onRateApp,
      },
    ];
    if (activeChat) {
      activity.unshift({
        id: 'rejoin',
        icon: 'message-circle',
        label: `Rejoin chat with ${rejoinName}`,
        onPress: () => {
          closeThen(() => {
            onClose();
            router.push(getChatRouteParams(activeChat));
          });
        },
      });
    }
    return { activity, resources };
    // navigate and closeThen close over the latest drawer animation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat]);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={() => closeThen()}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <AnimatedPressable
          style={styles.scrimPress}
          scaleTo={1}
          onPress={() => closeThen()}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        >
          <Animated.View style={[styles.scrim, scrimStyle]} />
        </AnimatedPressable>

        <Animated.View style={[styles.drawer, { width: drawerW }, panelStyle]}>
          {/* Header zone */}
          <LinearGradient
            colors={screenBackground.colors}
            locations={screenBackground.locations}
            start={screenBackground.start}
            end={screenBackground.end}
            style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 8 }]}
          >
            <MandalaBackdrop size={200} opacity={0.07} style={styles.headerMotif} />
            <AnimatedPressable
              style={styles.headerIdentity}
              onPress={() => navigate('/(tabs)/profile')}
              accessibilityRole="button"
              accessibilityLabel="View my profile"
            >
              <View style={styles.avatarRing}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={34} color={WHITE} />
                  </View>
                )}
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {fullName || 'Welcome'}
              </Text>
              <Text style={styles.phone} numberOfLines={1}>
                {phoneNumber || 'Add your number'}
              </Text>
              <Text style={styles.viewProfileLink}>View profile</Text>
            </AnimatedPressable>
          </LinearGradient>

          {/* Wallet summary */}
          <AnimatedPressable
            style={styles.walletCard}
            onPress={() => navigate('/wallet')}
            accessibilityRole="button"
            accessibilityLabel={`Wallet balance ${formatCoins(walletBalance)} coins`}
          >
            <View style={styles.walletIcon}>
              <Feather name="credit-card" size={18} color={GOLD} />
            </View>
            <View style={styles.walletBody}>
              <Text style={styles.walletLabel}>Wallet Balance</Text>
              <Text style={styles.walletValue}>{formatCoins(walletBalance)} coins</Text>
            </View>
            <Feather name="chevron-right" size={18} color={GOLD} />
          </AnimatedPressable>

          {/* Nav items */}
          <ScrollView
            style={styles.nav}
            contentContainerStyle={styles.navContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>Your activity</Text>
            {menuSections.activity.map((item) => (
              <DrawerRow key={item.id} icon={item.icon} label={item.label} onPress={item.onPress} />
            ))}
            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>More</Text>
            {menuSections.resources.map((item) => (
              <DrawerRow key={item.id} icon={item.icon} label={item.label} onPress={item.onPress} />
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
            <View style={styles.divider} />
            <DrawerRow icon="log-out" label="Logout" danger showChevron={false} onPress={onLogout} />
            <Text style={styles.version}>Version {appVersion}</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const AVATAR = 60;

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrimPress: {
    ...StyleSheet.absoluteFillObject,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SCRIM_BLACK,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: SURFACE,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    shadowColor: SHADOW_BLACK,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 6, height: 0 },
    elevation: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GOLD_BORDER,
  },
  headerMotif: {
    position: 'absolute',
    top: -50,
    right: -60,
  },
  headerIdentity: {
    alignItems: 'flex-start',
  },
  avatarRing: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: 'hidden',
    backgroundColor: IMAGE_PLACEHOLDER,
    borderWidth: 2.5,
    borderColor: GOLD,
    marginBottom: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
  },
  name: {
    ...Typography.h3,
    color: TEXT_PRIMARY_DARK,
  },
  phone: {
    ...Typography.bodySm,
    color: GREY_LABEL,
    marginTop: 2,
  },
  viewProfileLink: {
    ...Typography.caption,
    color: GOLD,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 0.3,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: WARM_IVORY,
    borderWidth: 1.2,
    borderColor: GOLD_BORDER,
  },
  walletIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: GOLD_GLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletBody: {
    flex: 1,
    minWidth: 0,
  },
  walletLabel: {
    ...Typography.caption,
    color: GREY_LABEL,
    textTransform: 'uppercase',
  },
  walletValue: {
    ...Typography.h3,
    color: GOLD,
    marginTop: 1,
  },
  nav: {
    flex: 1,
  },
  navContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  sectionLabel: {
    ...Typography.caption,
    color: GREY_LABEL,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  sectionLabelSpaced: {
    marginTop: 14,
  },
  footer: {
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: HEADER_RULE_GREY,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  version: {
    ...Typography.caption,
    color: GREY_LABEL,
    textAlign: 'center',
    marginTop: 8,
  },
});
