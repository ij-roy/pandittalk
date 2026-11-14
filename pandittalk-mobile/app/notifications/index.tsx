import { Ionicons } from '@expo/vector-icons';
import { BackChevron } from '@/components/BackChevron';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyStateAnimation } from '@/components/EmptyStateAnimation';

import {
  BG,
  DEEP_GREY,
  GOLD,
  GREY_LABEL,
  HEADER_RULE_GREY,
  HIGHLIGHT_IVORY,
  LINK_BLUE,
  TEXT_PRIMARY_DARK,
  WHITE,
} from '@/constants/Colors';
import { formatRelativeTime, getDateGroupLabel } from '@/lib/formatRelativeTime';
import { getBookingById } from '@/lib/bookingApi';
import {
  getChatRouteParams,
} from '@/lib/chatBookingStatus';
import {
  filterNotifications,
  type NotificationFilterTab,
} from '@/lib/notificationFilters';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notificationApi';
import type { Notification, NotificationType } from '@/store/useNotificationStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import {
  notificationPermissionCopy,
  sessionRemindersBlocked,
} from '@/lib/notificationPermissionCopy';

type Section = {
  title: string;
  data: Notification[];
};

const GROUP_ORDER = ['Today', 'Yesterday', 'Earlier'] as const;

const TABS: { id: NotificationFilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'messages', label: 'Messages' },
  { id: 'updates', label: 'Updates' },
];

function iconForType(type: NotificationType): keyof typeof Ionicons.glyphMap {
  if (type === 'booking_confirmed') return 'calendar-outline';
  if (type.startsWith('session_reminder')) return 'time-outline';
  if (type === 'session_started') return 'play-circle-outline';
  if (type === 'new_message') return 'chatbubble-outline';
  if (type.startsWith('chat_now')) return 'flash-outline';
  if (type === 'session_ended') return 'checkmark-circle-outline';
  return 'notifications-outline';
}

function groupNotifications(notifications: Notification[]): Section[] {
  const buckets: Record<string, Notification[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  for (const n of notifications) {
    const label = getDateGroupLabel(n.createdAt);
    buckets[label].push(n);
  }

  return GROUP_ORDER.filter((title) => buckets[title].length > 0).map((title) => ({
    title,
    data: buckets[title],
  }));
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const notifications = useNotificationStore((s) => s.notifications);
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const markRead = useNotificationStore((s) => s.markRead);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<NotificationFilterTab>('all');
  const [remindersBlocked, setRemindersBlocked] = useState(false);
  const permissionCopy = notificationPermissionCopy(Platform.OS);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void Notifications.getPermissionsAsync().then((settings) => {
        if (cancelled) return;
        const provisional =
          settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
        setRemindersBlocked(
          sessionRemindersBlocked({ granted: settings.granted, provisional }),
        );
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getNotifications();
      setNotifications(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, [setNotifications]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = useCallback(() => {
    void (async () => {
      try {
        await markAllNotificationsRead();
        markAllRead();
      } catch {
        markAllRead();
      }
    })();
  }, [markAllRead]);

  const filteredNotifications = useMemo(
    () => filterNotifications(notifications, tab),
    [notifications, tab],
  );

  const sections = useMemo(
    () => groupNotifications(filteredNotifications),
    [filteredNotifications],
  );

  const handlePress = useCallback(
    async (notification: Notification) => {
      const { type, bookingId, id } = notification;

      const isChatSessionType =
        type === 'new_message' ||
        type === 'chat_now_accepted' ||
        type === 'session_started';

      if (isChatSessionType && bookingId) {
        try {
          const booking = await getBookingById(bookingId);
          if (booking.format.trim().toLowerCase() === 'chat') {
            router.push(getChatRouteParams(booking));
            return;
          }
        } catch {
          // Fall through.
        }
      }

      if (
        type === 'session_reminder_30' ||
        type === 'session_reminder_10' ||
        type === 'session_reminder_5' ||
        type === 'session_started'
      ) {
        if (!bookingId) return;
        try {
          const booking = await getBookingById(bookingId);
          router.push(`/experts/${booking.panditId}`);
        } catch {
          // Stay on screen.
        }
        return;
      }

      if (type === 'new_message') {
        if (!bookingId) return;
        try {
          await markNotificationRead(id);
          markRead(id);
        } catch {
          // Ignore.
        }
        return;
      }

      if (type === 'booking_confirmed') {
        router.push('/bookings/history');
        return;
      }

      try {
        await markNotificationRead(id);
        markRead(id);
      } catch {
        // Ignore.
      }
    },
    [markRead, router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.75}
        onPress={() => void handlePress(item)}
      >
        <View style={styles.iconWrap}>
          <Ionicons name={iconForType(item.type)} size={22} color={GOLD} />
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead ? <View style={styles.unreadDot} /> : null}
          </View>
          <Text style={styles.rowMessage} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.rowTime}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    ),
    [handlePress],
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backHit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackChevron />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          onPress={handleMarkAllRead}
          style={styles.markAllHit}
          activeOpacity={0.7}
        >
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.tabChip, tab === item.id && styles.tabChipActive]}
            onPress={() => setTab(item.id)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabChipText, tab === item.id && styles.tabChipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {remindersBlocked ? (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionTitle}>{permissionCopy.title}</Text>
          <Text style={styles.permissionBody}>{permissionCopy.body}</Text>
          <TouchableOpacity
            onPress={() => {
              void Linking.openSettings().catch(() => undefined);
            }}
            accessibilityRole="button"
            accessibilityLabel={permissionCopy.action}
          >
            <Text style={styles.permissionAction}>{permissionCopy.action}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : error && filteredNotifications.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => void loadNotifications()} activeOpacity={0.75}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.centered}>
          <EmptyStateAnimation />
          <Text style={styles.emptyTitle}>No notifications in this category</Text>
          <Text style={styles.emptySubtitle}>
            Session updates and messages will appear here.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
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
    minWidth: 72,
    paddingVertical: 6,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: DEEP_GREY,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  headerSpacer: {
    minWidth: 72,
  },
  markAllHit: {
    minWidth: 72,
    paddingVertical: 6,
    alignItems: 'flex-end',
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: GOLD,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HEADER_RULE_GREY,
    backgroundColor: BG,
  },
  permissionBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: HIGHLIGHT_IVORY,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 6,
  },
  permissionBody: {
    fontSize: 14,
    lineHeight: 20,
    color: TEXT_PRIMARY_DARK,
  },
  permissionAction: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: LINK_BLUE,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: HEADER_RULE_GREY,
    backgroundColor: WHITE,
  },
  tabChipActive: {
    borderColor: GOLD,
    backgroundColor: HIGHLIGHT_IVORY,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: GREY_LABEL,
  },
  tabChipTextActive: {
    color: TEXT_PRIMARY_DARK,
  },
  retryText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 15,
    color: GREY_LABEL,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: GREY_LABEL,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: BG,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: WHITE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HEADER_RULE_GREY,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowBody: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LINK_BLUE,
    marginLeft: 8,
  },
  rowMessage: {
    fontSize: 13,
    color: DEEP_GREY,
    lineHeight: 18,
    marginBottom: 4,
  },
  rowTime: {
    fontSize: 11,
    color: GREY_LABEL,
  },
});
