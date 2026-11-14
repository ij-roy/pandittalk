import { Ionicons } from '@expo/vector-icons';
import { BackChevron } from '@/components/BackChevron';
import { isAxiosError } from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyStateAnimation } from '@/components/EmptyStateAnimation';

import {
  AVAILABLE_GREEN,
  BG,
  BLACK,
  GOLD,
  GREY_LABEL,
  HEADER_RULE_GREY,
  IMAGE_PLACEHOLDER,
  MUTED_GREY,
  TEXT_PRIMARY_DARK,
  WHITE,
  WARM_IVORY,
} from '@/constants/Colors';
import {
  getBookingById,
  getUserBookings,
  type Booking,
  type BookingStatus,
} from '@/lib/bookingApi';
import {
  areaDisplayLabel,
  bookingDurationMinutes,
  depthDisplayLabel,
  formatDisplayLabel,
  formatCoins,
} from '@/lib/bookingPricing';
import {
  bookingDateTimeLabel,
  bookingStartTimeIso,
} from '@/lib/bookingDisplay';
import { bookingStatusCopy } from '@/lib/bookingStatusCopy';
import { reviewWindowNote, sessionEndedAt } from '@/lib/reviewWindow';
import {
  formatTimeUntil,
  getCallBookingStatus,
  getCallRoute,
} from '@/lib/callBookingStatus';
import { LATE_PANDIT_COMPENSATION } from '@/lib/waitingRoomEta';
import { fetchExpertById } from '@/lib/expertsApi';
import {
  canJoinAvSessions,
  IOS_AV_UNAVAILABLE_MESSAGE,
  IOS_AV_UNAVAILABLE_TITLE,
} from '@/lib/iosStorePolicy';
import { useAuthStore } from '@/store/useAuthStore';

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
  return 'Could not load sessions.';
}

function avatarInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'P';
  return trimmed.charAt(0).toUpperCase();
}

function statusColors(status: BookingStatus): { bg: string; text: string } {
  switch (status) {
    case 'confirmed':
      return { bg: 'rgba(212, 175, 55, 0.18)', text: GOLD };
    case 'completed':
      return { bg: 'rgba(46, 158, 79, 0.14)', text: AVAILABLE_GREEN };
    case 'cancelled':
      return { bg: 'rgba(159, 159, 159, 0.18)', text: MUTED_GREY };
    default:
      return { bg: 'rgba(159, 159, 159, 0.12)', text: GREY_LABEL };
  }
}

function canBookAgain(booking: Booking): boolean {
  return booking.status === 'completed' || booking.status === 'cancelled';
}

function canReschedule(booking: Booking): boolean {
  if (booking.status !== 'confirmed') return false;
  const iso = bookingStartTimeIso(booking);
  if (!iso) return false;
  return new Date(iso).getTime() - Date.now() > 15 * 60 * 1000;
}

function sortBookingsNewestFirst(list: Booking[]): Booking[] {
  return [...list].sort((a, b) => {
    const aTime = bookingStartTimeIso(a) ?? a.slot?.date ?? a.createdAt;
    const bTime = bookingStartTimeIso(b) ?? b.slot?.date ?? b.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

function bookingCoinsDisplay(booking: Booking): string {
  let coins = booking.coinsDeducted ?? booking.totalPrice ?? 0;
  if (coins === 0 && booking.format === 'chat' && booking.depth === 'entry') {
    coins = 101;
  }
  return `${formatCoins(coins)} coins`;
}

function HistorySkeleton() {
  return (
    <View style={styles.skeletonList}>
      {[0, 1, 2].map((key) => (
        <View key={key} style={styles.skeletonCard}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonLines}>
              <View style={[styles.skeletonLine, { width: '55%' }]} />
              <View style={[styles.skeletonLine, { width: '40%', marginTop: 8 }]} />
            </View>
          </View>
          <View style={[styles.skeletonLine, { width: '70%', marginTop: 14 }]} />
          <View style={[styles.skeletonLine, { width: '45%', marginTop: 8 }]} />
        </View>
      ))}
    </View>
  );
}

type BookingCardProps = {
  booking: Booking;
  panditName: string;
  expanded: boolean;
  detail: Booking | null;
  detailLoading: boolean;
  refreshTick: number;
  onPress: () => void;
  onRateSession: () => void;
  onReschedule: () => void;
  onBookAgain: () => void;
  onJoinCall: (route: '/session/audio' | '/session/video', bookingId: string, panditName: string) => void;
};

function BookingCard({
  booking,
  panditName,
  expanded,
  detail,
  detailLoading,
  refreshTick,
  onPress,
  onRateSession,
  onReschedule,
  onBookAgain,
  onJoinCall,
}: BookingCardProps) {
  const dateTimeLabel = bookingDateTimeLabel(booking);
  const durationMins = bookingDurationMinutes(booking.depth);
  const priceCoins = bookingCoinsDisplay(booking);
  const badge = statusColors(booking.status);
  const statusCopy = bookingStatusCopy(booking.status);
  const reviewSource = expanded && detail ? detail.review : booking.review;
  const showRate = booking.status === 'completed' && reviewSource == null;
  const showRated = booking.status === 'completed' && reviewSource != null;

  const detailSource = detail ?? booking;

  const isCallFormat = booking.format === 'audio' || booking.format === 'video';
  const callLabel = booking.format === 'audio' ? 'Audio Call' : 'Video Call';
  const callIcon = booking.format === 'audio' ? 'call' : 'videocam';

  const callStatus = useMemo(() => {
    if (!isCallFormat) return null;
    void refreshTick;
    const callPayload = {
      ...booking,
      panditName,
      startTime: bookingStartTimeIso(booking) ?? booking.startTime,
      durationMinutes: bookingDurationMinutes(booking.depth),
    };
    return getCallBookingStatus([callPayload], booking.panditId);
  }, [booking, isCallFormat, panditName, refreshTick]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={`${panditName}. ${statusCopy.label}. ${statusCopy.explanation}`}
      >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarInitial(panditName)}</Text>
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.panditName} numberOfLines={1}>
            {panditName}
          </Text>
          <Text style={styles.areaText} numberOfLines={1}>
            {areaDisplayLabel(booking.area)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.statusBadgeText, { color: badge.text }]}>
            {statusCopy.label}
          </Text>
        </View>
      </View>

      <Text style={styles.statusExplain}>{statusCopy.explanation}</Text>

      <View style={styles.cardMeta}>
        <View style={styles.formatBadge}>
          <Text style={styles.formatBadgeText}>{formatDisplayLabel(booking.format)}</Text>
        </View>
        <Text style={styles.metaText}>{dateTimeLabel}</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.metaMuted}>{durationMins} mins</Text>
        <Text style={styles.priceText}>{priceCoins}</Text>
      </View>

      {expanded ? (
        <View style={styles.expandBlock}>
          {detailLoading ? (
            <ActivityIndicator size="small" color={GOLD} style={styles.expandLoader} />
          ) : (
            <>
              <ExpandRow label="Depth" value={depthDisplayLabel(detailSource.depth)} />
              <ExpandRow label="Format" value={formatDisplayLabel(detailSource.format)} />
              <ExpandRow label="Area" value={areaDisplayLabel(detailSource.area)} />
              <ExpandRow label="Duration" value={`${bookingDurationMinutes(detailSource.depth)} mins`} />
              <ExpandRow
                label="Total"
                value={bookingCoinsDisplay(detailSource)}
                highlight
              />
              {detailSource.review ? (
                <ExpandRow
                  label="Your rating"
                  value={`${detailSource.review.rating}★`}
                  highlight
                />
              ) : null}
            </>
          )}
        </View>
      ) : null}
      </TouchableOpacity>

      {canReschedule(booking) ? (
        <TouchableOpacity
          style={styles.rescheduleBtn}
          onPress={onReschedule}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Reschedule session"
        >
          <Text style={styles.rescheduleBtnText}>Reschedule</Text>
        </TouchableOpacity>
      ) : null}

      {canBookAgain(booking) ? (
        <TouchableOpacity
          style={styles.rescheduleBtn}
          onPress={onBookAgain}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Book again with ${panditName}`}
        >
          <Text style={styles.rescheduleBtnText}>Book again</Text>
        </TouchableOpacity>
      ) : null}

      {showRate ? (
        <>
          <Text style={styles.reviewWindow}>
            {reviewWindowNote(
              sessionEndedAt(bookingStartTimeIso(booking), bookingDurationMinutes(booking.depth)),
            )}
          </Text>
          <TouchableOpacity
            style={styles.rateBtn}
            onPress={onRateSession}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Rate this session. You can rate it any time."
          >
            <Text style={styles.rateBtnText}>Rate this session</Text>
          </TouchableOpacity>
        </>
      ) : null}
      {showRated ? (
        <Text style={styles.ratedText}>✓ Rated</Text>
      ) : null}

      {isCallFormat &&
      (callStatus?.state === 'active' || callStatus?.state === 'waitingRoom') ? (
        <TouchableOpacity
          style={styles.callJoinBtn}
          onPress={() =>
            onJoinCall(getCallRoute(callStatus.booking), callStatus.booking.id, panditName)
          }
          activeOpacity={0.85}
        >
          <View style={styles.callJoinBtnContent}>
            <Ionicons name={callIcon} size={18} color={WHITE} />
            <Text style={styles.callJoinBtnText}>
              {callStatus.state === 'waitingRoom'
                ? 'Join Waiting Room'
                : `Join ${callLabel}`}
            </Text>
          </View>
        </TouchableOpacity>
      ) : null}
      {isCallFormat && callStatus?.state === 'waitingRoom' ? (
        <Text style={styles.latePanditNote}>{LATE_PANDIT_COMPENSATION}</Text>
      ) : null}

      {isCallFormat && callStatus?.state === 'soon' ? (
        <TouchableOpacity style={styles.callSoonBtn} disabled activeOpacity={1}>
          <Text style={styles.callSoonBtnText}>
            {formatTimeUntil(
              callStatus.startsAt ??
                new Date(bookingStartTimeIso(booking) ?? booking.startTime ?? Date.now()),
            )}
          </Text>
        </TouchableOpacity>
      ) : null}

      {isCallFormat && callStatus?.state === 'upcoming' ? (
        <TouchableOpacity style={styles.callScheduledBtn} disabled activeOpacity={1}>
          <Text style={styles.callScheduledBtnText}>{callLabel} Scheduled</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ExpandRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.expandRow}>
      <Text style={styles.expandLabel}>{label}</Text>
      <Text style={[styles.expandValue, highlight && styles.expandValueHighlight]}>{value}</Text>
    </View>
  );
}

export default function BookingHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const authHydrated = useAuthStore((s) => s.authHydrated);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [panditNames, setPanditNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<Booking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const id = setInterval(() => setTick((t) => t + 1), 30_000);
      return () => clearInterval(id);
    }, []),
  );

  const resolvePanditNames = useCallback(async (list: Booking[]) => {
    const embedded: Record<string, string> = {};
    for (const b of list) {
      const name = b.panditName?.trim();
      if (name && b.panditId) embedded[b.panditId] = name;
    }

    let missing: string[] = [];
    setPanditNames((prev) => {
      const merged = { ...prev, ...embedded };
      missing = [...new Set(list.map((b) => b.panditId).filter(Boolean))].filter(
        (id) => !merged[id],
      );
      return merged;
    });
    if (!missing.length) return;

    const results = await Promise.allSettled(
      missing.map(async (id) => {
        try {
          const expert = await fetchExpertById(id);
          return expert?.name ?? 'Unknown Pandit';
        } catch {
          return 'Unknown Pandit';
        }
      }),
    );

    setPanditNames((prev) => {
      const next = { ...prev };
      results.forEach((result, index) => {
        next[missing[index]] =
          result.status === 'fulfilled' ? result.value : 'Unknown Pandit';
      });
      return next;
    });
  }, []);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!authHydrated) {
        if (!isRefresh) setLoading(true);
        return;
      }
      if (!accessToken) {
        setBookings([]);
        setLoading(false);
        setRefreshing(false);
        setError('Please sign in to view your sessions.');
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const data = await getUserBookings();
        const sorted = sortBookingsNewestFirst(data);
        setBookings(sorted);
        void resolvePanditNames(sorted);
      } catch (e) {
        setBookings([]);
        setError(messageFromError(e));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, authHydrated, resolvePanditNames],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const sortedBookings = useMemo(() => sortBookingsNewestFirst(bookings), [bookings]);

  const onRefresh = useCallback(() => {
    setExpandedId(null);
    setExpandedDetail(null);
    void load(true);
  }, [load]);

  const onCardPress = useCallback(
    async (booking: Booking) => {
      if (expandedId === booking.id) {
        setExpandedId(null);
        setExpandedDetail(null);
        return;
      }
      setExpandedId(booking.id);
      setExpandedDetail(null);
      setDetailLoading(true);
      try {
        const detail = await getBookingById(booking.id);
        setExpandedDetail(detail);
        setBookings((prev) =>
          prev.map((b) => (b.id === detail.id ? { ...b, ...detail, slot: detail.slot ?? b.slot } : b)),
        );
      } catch {
        setExpandedDetail(booking);
      } finally {
        setDetailLoading(false);
      }
    },
    [expandedId],
  );

  const panditNameFor = (booking: Booking) =>
    booking.panditName?.trim() || panditNames[booking.panditId] || 'Unknown Pandit';

  const onJoinCall = useCallback(
    (route: '/session/audio' | '/session/video', bookingId: string, name: string) => {
      if (!canJoinAvSessions()) {
        Alert.alert(IOS_AV_UNAVAILABLE_TITLE, IOS_AV_UNAVAILABLE_MESSAGE);
        return;
      }
      router.push({
        pathname: route,
        params: { bookingId, panditName: name },
      });
    },
    [router],
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
          <BackChevron color={GOLD} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading && !refreshing ? (
        <HistorySkeleton />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void load()} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : sortedBookings.length === 0 ? (
        <View style={styles.centered}>
          <EmptyStateAnimation />
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptySubtitle}>
            Book a session with a pandit to see it here.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => router.push('/(tabs)/experts')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Find a pandit"
          >
            <Text style={styles.retryBtnText}>Find a pandit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listInner, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
          }
        >
          {sortedBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              panditName={panditNameFor(booking)}
              expanded={expandedId === booking.id}
              detail={expandedId === booking.id ? expandedDetail : null}
              detailLoading={expandedId === booking.id && detailLoading}
              refreshTick={tick}
              onPress={() => void onCardPress(booking)}
              onRateSession={() =>
                router.push({
                  pathname: '/bookings/review',
                  params: {
                    bookingId: booking.id,
                    panditName: panditNameFor(booking),
                  },
                })
              }
              onReschedule={() =>
                router.push({
                  pathname: '/booking/select-slot',
                  params: {
                    panditId: booking.panditId,
                    panditName: panditNameFor(booking),
                    area: booking.area,
                    depth: booking.depth,
                    format: booking.format,
                    totalPrice: String(booking.totalPrice ?? booking.coinsDeducted ?? 0),
                    durationMinutes: String(bookingDurationMinutes(booking.depth)),
                    rescheduleBookingId: booking.id,
                  },
                })
              }
              onBookAgain={() => {
                if (booking.area && booking.depth && booking.format) {
                  router.push({
                    pathname: '/booking/select-slot',
                    params: {
                      panditId: booking.panditId,
                      panditName: panditNameFor(booking),
                      area: booking.area,
                      depth: booking.depth,
                      format: booking.format,
                      totalPrice: String(booking.totalPrice ?? booking.coinsDeducted ?? 0),
                      durationMinutes: String(bookingDurationMinutes(booking.depth)),
                    },
                  });
                  return;
                }
                router.push(`/experts/${booking.panditId}`);
              }}
              onJoinCall={onJoinCall}
            />
          ))}
        </ScrollView>
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
    color: GOLD,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  headerSpacer: {
    minWidth: 72,
  },
  listInner: {
    paddingHorizontal: 14,
    paddingTop: 16,
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  errorText: {
    textAlign: 'center',
    color: GREY_LABEL,
    fontSize: 15,
    marginBottom: 16,
  },
  retryBtn: {
    marginTop: 16,
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: GOLD,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BLACK,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: GREY_LABEL,
    textAlign: 'center',
    lineHeight: 20,
  },
  skeletonList: {
    paddingHorizontal: 14,
    paddingTop: 16,
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: HEADER_RULE_GREY,
    padding: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: IMAGE_PLACEHOLDER,
    marginRight: 12,
  },
  skeletonLines: {
    flex: 1,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: IMAGE_PLACEHOLDER,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: HEADER_RULE_GREY,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: WARM_IVORY,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: GOLD,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  panditName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 2,
  },
  areaText: {
    fontSize: 13,
    fontWeight: '500',
    color: GREY_LABEL,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusExplain: {
    fontSize: 13,
    lineHeight: 18,
    color: GREY_LABEL,
    marginTop: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  formatBadge: {
    backgroundColor: WARM_IVORY,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  formatBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_PRIMARY_DARK,
    flexShrink: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaMuted: {
    fontSize: 13,
    fontWeight: '500',
    color: GREY_LABEL,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
  },
  expandBlock: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HEADER_RULE_GREY,
  },
  expandLoader: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  expandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expandLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: GREY_LABEL,
  },
  expandValue: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
  },
  expandValueHighlight: {
    color: GOLD,
    fontWeight: '700',
  },
  reviewWindow: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 18,
    color: GREY_LABEL,
  },
  rateBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  rescheduleBtn: {
    marginTop: 14,
    minHeight: 44,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  rescheduleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
  },
  rateBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: GOLD,
  },
  ratedText: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '600',
    color: AVAILABLE_GREEN,
    alignSelf: 'flex-start',
  },
  callJoinBtn: {
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'stretch',
  },
  callJoinBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callJoinBtnText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '700',
  },
  latePanditNote: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_PRIMARY_DARK,
  },
  callSoonBtn: {
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'stretch',
    backgroundColor: WHITE,
  },
  callSoonBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
    textAlign: 'center',
  },
  callScheduledBtn: {
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: MUTED_GREY,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'stretch',
    backgroundColor: WHITE,
  },
  callScheduledBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: GREY_LABEL,
    textAlign: 'center',
  },
});
