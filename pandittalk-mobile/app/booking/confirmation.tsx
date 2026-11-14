import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BLACK,
  GOLD,
  GREY_LABEL,
  HEADER_RULE_GREY,
  SCRIM_BLACK,
  TEXT_PRIMARY_DARK,
  WHITE,
  WARM_IVORY,
} from '@/constants/Colors';
import { getBookingById, type Booking } from '@/lib/bookingApi';
import {
  bookingDateTimeLabel,
  bookingStartTimeIso,
  formatStartTimeParam,
} from '@/lib/bookingDisplay';
import { googleCalendarTemplateUrl } from '@/lib/calendarLink';
import { confirmationJoinSteps } from '@/lib/waitingRoomEta';
import {
  cancelBookingReminders,
  requestNotificationPermissionIfNeeded,
  syncAllBookingReminders,
} from '@/lib/localNotificationScheduler';
import {
  areaDisplayLabel,
  bookingDurationMinutes,
  computeBookingTotal,
  depthDisplayLabel,
  formatDisplayLabel,
  formatCoins,
} from '@/lib/bookingPricing';
import { confirmationActionOrder, confirmationShowsJoin } from '@/lib/confirmationA11y';
import { fetchExpertById } from '@/lib/expertsApi';
import { getCallBookingStatus } from '@/lib/callBookingStatus';
import { refreshWalletBalance } from '@/lib/walletApi';
import { useAuthStore } from '@/store/useAuthStore';

function paramString(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
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
  return 'Could not load booking.';
}

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const raw = useLocalSearchParams<{ bookingId: string; startTime?: string }>();
  const bookingId = paramString(raw.bookingId);
  const startTimeParam = paramString(raw.startTime);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [panditName, setPanditName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [remindersOn, setRemindersOn] = useState(true);

  const load = useCallback(async () => {
    if (!bookingId) {
      setBooking(null);
      setLoading(false);
      setError('Missing booking id.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getBookingById(bookingId);
      setBooking(data);
      if (accessToken) {
        await refreshWalletBalance(accessToken).catch(() => {});
      }
      void requestNotificationPermissionIfNeeded().then(() => syncAllBookingReminders());
      try {
        const expert = await fetchExpertById(data.panditId);
        setPanditName(expert?.name ?? 'Pandit');
      } catch {
        setPanditName('Pandit');
      }
    } catch (e) {
      setBooking(null);
      setError(messageFromError(e));
    } finally {
      setLoading(false);
    }
  }, [accessToken, bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const coinsTotal = useMemo(() => {
    if (!booking) return 0;
    return computeBookingTotal(booking.depth, booking.format);
  }, [booking]);

  const durationMins = useMemo(() => {
    if (!booking) return 0;
    return bookingDurationMinutes(booking.depth);
  }, [booking]);

  const callStatus = useMemo(() => {
    if (!booking) return { state: 'none' as const };
    return getCallBookingStatus([booking], booking.panditId);
  }, [booking]);

  const canJoinCall =
    callStatus.state === 'waitingRoom' || callStatus.state === 'active';

  const dateTimeLabel = useMemo(() => {
    if (booking) return bookingDateTimeLabel(booking);
    const fromParam = formatStartTimeParam(startTimeParam);
    if (fromParam) return fromParam;
    return '—';
  }, [booking, startTimeParam]);

  const calendarUrl = useMemo(() => {
    if (!booking) return null;
    const startIso = bookingStartTimeIso(booking) ?? (startTimeParam || null);
    if (!startIso) return null;
    const name = panditName || 'pandit';
    return googleCalendarTemplateUrl({
      title: `PanditTalk session with ${name}`,
      startIso,
      durationMinutes: durationMins,
      details: 'Live consultation on PanditTalk.',
    });
  }, [booking, durationMins, panditName, startTimeParam]);

  const onAddToCalendar = useCallback(() => {
    if (!calendarUrl) return;
    void Linking.openURL(calendarUrl).catch(() => {
      Alert.alert('Could not open the calendar', 'Try again in a moment.');
    });
  }, [calendarUrl]);

  const onToggleReminders = useCallback(
    (next: boolean) => {
      setRemindersOn(next);
      if (!booking) return;
      if (!next) {
        void cancelBookingReminders(booking.id);
        return;
      }
      void requestNotificationPermissionIfNeeded().then(() => syncAllBookingReminders());
    },
    [booking],
  );

  if (!bookingId) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Text style={styles.fallbackText}>Invalid confirmation link.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 16) }]}>
      {loading && !booking && !formatStartTimeParam(startTimeParam) ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loadingText}>Confirming your booking…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void load()} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : booking || formatStartTimeParam(startTimeParam) ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.iconWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Ionicons name="checkmark-circle" size={56} color={GOLD} />
            </View>
            <Text style={styles.title} accessibilityRole="header">
              Booking Confirmed!
            </Text>
            <Text style={styles.panditName}>{panditName || (loading ? '…' : 'Pandit')}</Text>

            {booking && confirmationShowsJoin(booking.format, booking.status, canJoinCall) ? (
              booking.format === 'chat' ? (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/session/chat',
                      params: {
                        bookingId: booking.id,
                        panditName,
                        panditId: booking.panditId,
                        durationMinutes: String(durationMins),
                        area: booking.area,
                        format: booking.format,
                      },
                    } as unknown as Href)
                  }
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Join chat session"
                >
                  <Text style={styles.primaryBtnText}>Join Chat Session</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() =>
                    router.push({
                      pathname: booking.format === 'audio' ? '/session/audio' : '/session/video',
                      params: {
                        bookingId: booking.id,
                        panditName: booking.panditName ?? panditName,
                      },
                    } as unknown as Href)
                  }
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={
                    callStatus.state === 'waitingRoom'
                      ? 'Join waiting room'
                      : booking.format === 'audio'
                        ? 'Join audio call'
                        : 'Join video call'
                  }
                >
                  <View style={styles.primaryBtnContent}>
                    <Ionicons
                      name={booking.format === 'audio' ? 'call' : 'videocam'}
                      size={20}
                      color={WHITE}
                    />
                    <Text style={styles.primaryBtnText}>
                      {callStatus.state === 'waitingRoom'
                        ? 'Join Waiting Room'
                        : booking.format === 'audio'
                          ? 'Join Audio Call'
                          : 'Join Video Call'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            ) : null}

            {booking && confirmationActionOrder(confirmationShowsJoin(booking.format, booking.status, canJoinCall)).includes('bookings') ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.replace('/bookings/history' as unknown as Href)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="View my bookings"
              >
                <Text style={styles.primaryBtnText}>View My Bookings</Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.divider} />

            <DetailRow label="Date & time" value={dateTimeLabel} />
            {booking ? (
              <>
            <DetailRow label="Format" value={formatDisplayLabel(booking.format)} />
            <DetailRow label="Area" value={areaDisplayLabel(booking.area)} />
            <DetailRow label="Depth" value={depthDisplayLabel(booking.depth)} />
            <DetailRow label="Duration" value={`${durationMins} mins`} />
            <DetailRow label="Coins deducted" value={`${formatCoins(coinsTotal)} coins`} highlight />
            <View style={styles.joinBox}>
              <Text style={styles.joinTitle}>How to join</Text>
              {confirmationJoinSteps(booking.format).map((line) => (
                <Text key={line} style={styles.joinLine}>
                  {line}
                </Text>
              ))}
            </View>
              </>
            ) : null}
          </View>

          {booking ? (
            <>
          {calendarUrl ? (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onAddToCalendar}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Add session to calendar"
            >
              <Text style={styles.secondaryBtnText}>Add to calendar</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.reminderRow}>
            <Text style={styles.reminderLabel}>Remind me before the session</Text>
            <Switch
              value={remindersOn}
              onValueChange={onToggleReminders}
              trackColor={{ false: HEADER_RULE_GREY, true: GOLD }}
              accessibilityLabel="Remind me before the session"
            />
          </View>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.replace('/(tabs)/home')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Go home"
          >
            <Text style={styles.secondaryBtnText}>Go Home</Text>
          </TouchableOpacity>
            </>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.detailValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: WARM_IVORY,
    paddingHorizontal: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '500',
    color: GREY_LABEL,
  },
  fallbackText: {
    marginTop: 40,
    textAlign: 'center',
    color: GREY_LABEL,
    fontSize: 15,
  },
  errorText: {
    textAlign: 'center',
    color: GREY_LABEL,
    fontSize: 15,
    marginBottom: 16,
  },
  retryBtn: {
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: WHITE,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: GOLD,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  joinBox: {
    width: '100%',
    marginTop: 8,
    gap: 6,
  },
  joinTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  joinLine: {
    fontSize: 13,
    lineHeight: 18,
    color: GREY_LABEL,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: HEADER_RULE_GREY,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: SCRIM_BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  iconWrap: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: BLACK,
    marginBottom: 6,
    textAlign: 'center',
  },
  panditName: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    marginBottom: 4,
  },
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: HEADER_RULE_GREY,
    marginVertical: 18,
  },
  detailRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: GREY_LABEL,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
  },
  detailValueHighlight: {
    color: GOLD,
    fontWeight: '700',
  },
  primaryBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD,
  },
  reminderRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  reminderLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
  },
});
