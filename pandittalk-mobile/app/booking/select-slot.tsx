import { BackChevron } from '@/components/BackChevron';
import { isAxiosError } from 'axios';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
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
  IMAGE_PLACEHOLDER,
  SHADOW_BLACK,
  TEXT_PRIMARY_DARK,
  WHITE,
  WARM_IVORY,
} from '@/constants/Colors';
import { PAGE_PAD } from '@/constants/Spacing';
import { EntertainmentDisclaimer } from '@/components/EntertainmentDisclaimer';
import { CancellationPolicySummary } from '@/components/CancellationPolicySummary';
import {
  createBooking,
  getAvailableSlots,
  rescheduleBooking,
  type DisplaySlot,
} from '@/lib/bookingApi';
import { ensureAdultForMarketplace } from '@/lib/ageGate';
import { syncAllBookingReminders } from '@/lib/localNotificationScheduler';
import { refreshWalletBalance, getWallet, type CoinPackage } from '@/lib/walletApi';
import { formatRupee } from '@/lib/bookingPricing';
import { SLOT_LIST_HINT } from '@/lib/presenceCopy';
import {
  ADD_COINS_LABEL,
  INSUFFICIENT_COINS_TITLE,
} from '@/lib/insufficientCoins';
import {
  coinsShortfall,
  isInsufficientCoinsMessage,
  lowBalanceBookingCopy,
  suggestCoinPack,
} from '@/lib/lowBalanceBooking';
import { useAuthStore } from '@/store/useAuthStore';
import { useGuidanceFlowStore } from '@/store/useGuidanceFlowStore';

const FOOTER_BAR_HEIGHT = 52;
const IST = 'Asia/Kolkata';
const IST_DATE_OPTS = { timeZone: IST } as const;
const IST_SLOT_TIME_OPTS = {
  hour: 'numeric' as const,
  minute: '2-digit' as const,
  hour12: true,
  timeZone: IST,
};

type SelectSlotParams = {
  panditId: string;
  panditName: string;
  area: string;
  depth: string;
  format: string;
  totalPrice: string;
  durationMinutes: string;
  notes?: string;
  rescheduleBookingId?: string;
};

function paramString(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

function formatSlotTime(startTime: string): string {
  const d = new Date(startTime);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', IST_SLOT_TIME_OPTS);
}

function formatHourLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    hour: 'numeric',
    hour12: true,
  }).formatToParts(d);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '';
  const period = (parts.find((p) => p.type === 'dayPeriod')?.value ?? 'AM').toUpperCase();
  return `${hour} ${period}`;
}

function slotIstHourKey(startTime: string): string {
  const d = new Date(startTime);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    hour: 'numeric',
    hour12: true,
    dayPeriod: 'short',
  }).formatToParts(d);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '0';
  const period = parts.find((p) => p.type === 'dayPeriod')?.value ?? 'AM';
  return `${hour}-${period}`;
}

function slotSortKey(startTime: string): number {
  return new Date(startTime).getTime();
}

function isSlotInPast(startTime: string): boolean {
  const t = new Date(startTime).getTime();
  return Number.isNaN(t) || t < Date.now();
}

type HourGroup = {
  hourKey: string;
  label: string;
  slots: DisplaySlot[];
};

function groupSlotsByHour(slots: DisplaySlot[]): HourGroup[] {
  const map = new Map<string, { label: string; sortKey: number; slots: DisplaySlot[] }>();
  for (const slot of slots) {
    const hourKey = slotIstHourKey(slot.startTime);
    if (!hourKey) continue;
    const existing = map.get(hourKey);
    if (!existing) {
      map.set(hourKey, {
        label: formatHourLabel(slot.startTime),
        sortKey: slotSortKey(slot.startTime),
        slots: [slot],
      });
    } else {
      existing.slots.push(slot);
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => a[1].sortKey - b[1].sortKey)
    .map(([hourKey, group]) => ({
      hourKey,
      label: group.label,
      slots: group.slots
        .sort((a, b) => slotSortKey(a.startTime) - slotSortKey(b.startTime))
        .slice(0, 4),
    }));
}

function istCalendarParts(ref: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(ref);
  return {
    y: Number(parts.find((p) => p.type === 'year')?.value),
    m: Number(parts.find((p) => p.type === 'month')?.value),
    d: Number(parts.find((p) => p.type === 'day')?.value),
  };
}

function dateAtIstNoon(y: number, m: number, d: number): Date {
  return new Date(
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T12:00:00+05:30`,
  );
}

function istApiDate(ref: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ref);
}

function titleCaseWord(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function depthLabel(depth: string): string {
  const key = depth.trim().toLowerCase();
  if (key === 'entry') return 'Entry';
  if (key === 'standard') return 'Standard';
  if (key === 'deep') return 'Deep';
  return titleCaseWord(depth);
}

function formatLabel(format: string): string {
  const key = format.trim().toLowerCase();
  if (key === 'video') return 'Video';
  if (key === 'audio') return 'Audio';
  return titleCaseWord(format);
}

function areaLabel(area: string): string {
  return area
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(titleCaseWord)
    .join(' ');
}

function messageFromError(err: unknown): string {
  if (isAxiosError(err)) {
    if (isSlotConflictError(err)) {
      return 'That time was just taken by someone else. Pick another available slot — nearby times often open up.';
    }
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

function isSlotConflictError(err: unknown): boolean {
  if (!isAxiosError(err)) return false;
  if (err.response?.status === 409) return true;
  const data = err.response?.data as { message?: unknown; code?: unknown } | undefined;
  if (data?.code === 'PANDIT_BUSY') return true;
  const msg =
    typeof data?.message === 'string'
      ? data.message
      : Array.isArray(data?.message)
        ? data.message.map(String).join(' ')
        : '';
  return /slot no longer available|no longer available|already booked|currently on another call/i.test(
    msg,
  );
}

function buildNext7Days(): { apiDate: string; label: string }[] {
  const { y, m, d } = istCalendarParts(new Date());
  const anchor = dateAtIstNoon(y, m, d);
  return Array.from({ length: 7 }, (_, i) => {
    const dayDate = new Date(anchor.getTime() + i * 86_400_000);
    const apiDate = istApiDate(dayDate);
    const weekday = dayDate.toLocaleDateString('en-IN', { ...IST_DATE_OPTS, weekday: 'short' });
    const dayNum = dayDate.toLocaleDateString('en-IN', { ...IST_DATE_OPTS, day: 'numeric' });
    return { apiDate, label: `${weekday} ${dayNum}` };
  });
}

export default function SelectSlotScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const walletBalance = useAuthStore((s) => s.walletBalance);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const raw = useLocalSearchParams<SelectSlotParams>();

  const panditId = paramString(raw.panditId);
  const area = paramString(raw.area);
  const depth = paramString(raw.depth);
  const format = paramString(raw.format);
  const totalPrice = paramString(raw.totalPrice);
  const durationMinutes = paramString(raw.durationMinutes);
  const notesParam = paramString(raw.notes);
  const rescheduleBookingId = paramString(raw.rescheduleBookingId);
  const notesFromStore = useGuidanceFlowStore((s) => s.notes);
  const notes = notesParam.trim() || notesFromStore.trim();

  const durationNum = useMemo(() => {
    const n = Number.parseInt(durationMinutes, 10);
    return Number.isFinite(n) && n > 0 ? n : 60;
  }, [durationMinutes]);

  const dayOptions = useMemo(() => buildNext7Days(), []);
  const [selectedApiDate, setSelectedApiDate] = useState(
    () => buildNext7Days()[0]?.apiDate ?? istApiDate(new Date()),
  );
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedHourKey, setSelectedHourKey] = useState<string | null>(null);
  const [allSlots, setAllSlots] = useState<DisplaySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [suggestedPack, setSuggestedPack] = useState<CoinPackage | null>(null);

  const loadSlots = useCallback(async () => {
    if (!panditId) {
      setAllSlots([]);
      setSlotsLoading(false);
      setSlotsError('Missing pandit.');
      return;
    }
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const data = await getAvailableSlots(panditId, selectedApiDate, durationNum);
      setAllSlots(data);
    } catch (e) {
      setAllSlots([]);
      setSlotsError(messageFromError(e));
    } finally {
      setSlotsLoading(false);
    }
  }, [panditId, selectedApiDate, durationNum]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

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

  useEffect(() => {
    setSelectedStartTime(null);
    setSelectedHourKey(null);
  }, [selectedApiDate]);

  const visibleSlots = useMemo(
    () => allSlots.filter((slot) => !isSlotInPast(slot.startTime)),
    [allSlots],
  );

  const hourGroups = useMemo(() => groupSlotsByHour(visibleSlots), [visibleSlots]);

  const selectedSlot = useMemo(
    () => visibleSlots.find((slot) => slot.startTime === selectedStartTime) ?? null,
    [visibleSlots, selectedStartTime],
  );

  const slotsInSelectedHour = useMemo(() => {
    if (!selectedHourKey) return [];
    return hourGroups.find((g) => g.hourKey === selectedHourKey)?.slots ?? [];
  }, [hourGroups, selectedHourKey]);

  useEffect(() => {
    if (slotsLoading || hourGroups.length === 0) return;
    setSelectedHourKey((prev) => {
      if (prev && hourGroups.some((g) => g.hourKey === prev)) return prev;
      return hourGroups[0]?.hourKey ?? null;
    });
  }, [hourGroups, slotsLoading, selectedApiDate]);

  useEffect(() => {
    if (!selectedStartTime) return;
    if (
      !selectedSlot ||
      selectedSlot.status !== 'available' ||
      slotIstHourKey(selectedStartTime) !== selectedHourKey
    ) {
      setSelectedStartTime(null);
    }
  }, [selectedHourKey, selectedStartTime, selectedSlot]);

  const priceNum = Number.parseInt(totalPrice.replace(/\D/g, ''), 10);
  const priceDisplay = Number.isFinite(priceNum) ? formatRupee(priceNum) : `₹${totalPrice || '0'}`;
  const durationDisplay = durationMinutes || String(durationNum);
  const sessionCoins = Number.isFinite(priceNum) ? priceNum : 0;
  const shortfall = rescheduleBookingId
    ? 0
    : coinsShortfall(sessionCoins, walletBalance ?? 0);

  useEffect(() => {
    if (shortfall <= 0 || !accessToken) {
      setSuggestedPack(null);
      return;
    }
    let cancelled = false;
    void getWallet(accessToken)
      .then((data) => {
        if (!cancelled) setSuggestedPack(suggestCoinPack(data.packages, shortfall));
      })
      .catch(() => {
        if (!cancelled) setSuggestedPack(null);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, shortfall]);

  const offerAddCoins = useCallback(() => {
    const balance = useAuthStore.getState().walletBalance ?? 0;
    Alert.alert(
      INSUFFICIENT_COINS_TITLE,
      lowBalanceBookingCopy(sessionCoins, balance, suggestedPack?.coins),
      [
        { text: 'Keep this time', style: 'cancel' },
        { text: ADD_COINS_LABEL, onPress: () => router.push('/wallet/recharge') },
      ],
    );
  }, [router, sessionCoins, suggestedPack]);

  const scrollBottomPad =
    FOOTER_BAR_HEIGHT + (shortfall > 0 ? 88 : 0) + 20 + Math.max(insets.bottom, 12);
  const canConfirm = Boolean(
    selectedSlot?.status === 'available' && accessToken && !confirming,
  );

  const handleConfirm = useCallback(async () => {
    if (!selectedStartTime || !panditId) return;
    if (!accessToken) {
      Alert.alert('Sign in required', 'Please log in to confirm your booking.');
      return;
    }
    const adultOk = await ensureAdultForMarketplace({
      accessToken,
      user,
      setUser,
      router,
    });
    if (!adultOk) return;

    if (!rescheduleBookingId) {
      const balance = useAuthStore.getState().walletBalance ?? 0;
      if (coinsShortfall(sessionCoins, balance) > 0) {
        offerAddCoins();
        return;
      }
    }

    setConfirming(true);
    try {
      if (rescheduleBookingId) {
        await rescheduleBooking(rescheduleBookingId, selectedStartTime);
        void syncAllBookingReminders().catch(() => {});
        Alert.alert('Rescheduled', 'Your session was moved. No extra coins were charged.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }
      const booking = await createBooking({
        panditId,
        startTime: selectedStartTime,
        area,
        depth,
        format,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      await refreshWalletBalance(accessToken).catch(() => {});
      router.replace({
        pathname: '/booking/confirmation',
        params: { bookingId: booking.id, startTime: booking.startTime ?? '' },
      });
    } catch (e) {
      if (isSlotConflictError(e)) {
        setSelectedStartTime(null);
        Alert.alert('Slot unavailable', messageFromError(e), [
          {
            text: 'Refresh slots',
            onPress: () => {
              void loadSlots();
            },
          },
          { text: 'OK', style: 'cancel' },
        ]);
      } else {
        const message = messageFromError(e);
        if (!rescheduleBookingId && isInsufficientCoinsMessage(message)) {
          offerAddCoins();
        } else {
          Alert.alert(
            rescheduleBookingId ? 'Could not reschedule' : 'Booking failed',
            message,
          );
        }
      }
    } finally {
      setConfirming(false);
    }
  }, [
    accessToken,
    area,
    depth,
    format,
    loadSlots,
    notes,
    panditId,
    rescheduleBookingId,
    router,
    selectedStartTime,
    sessionCoins,
    offerAddCoins,
    setUser,
    user,
  ]);

  if (!panditId) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backHit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackChevron color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.fallbackText}>Invalid booking link.</Text>
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
          accessibilityLabel="Back"
        >
          <BackChevron color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {rescheduleBookingId ? 'Reschedule session' : 'Select a Time Slot'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: scrollBottomPad }]}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Session summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Area</Text>
            <Text style={styles.summaryValue}>{areaLabel(area)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Depth</Text>
            <Text style={styles.summaryValue}>{depthLabel(depth)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Format</Text>
            <Text style={styles.summaryValue}>{formatLabel(format)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price</Text>
            <Text style={styles.summaryValue}>{priceDisplay}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{durationDisplay} mins</Text>
          </View>
        </View>

        <EntertainmentDisclaimer compact />

        <Text style={styles.sectionLabel}>Choose a date</Text>
        <Text style={styles.sectionHint}>{SLOT_LIST_HINT}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}
        >
          {dayOptions.map((day) => {
            const selected = day.apiDate === selectedApiDate;
            return (
              <TouchableOpacity
                key={day.apiDate}
                style={styles.dateChip}
                onPress={() => setSelectedApiDate(day.apiDate)}
                activeOpacity={0.75}
              >
                <Text style={[styles.dateChipText, selected && styles.dateChipTextSelected]}>
                  {day.label}
                </Text>
                {selected ? <View style={styles.dateUnderline} /> : <View style={styles.dateUnderlinePlaceholder} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionLabel}>Open times</Text>
        {slotsLoading ? (
          <View style={styles.slotsState}>
            <ActivityIndicator size="small" color={GOLD} />
          </View>
        ) : slotsError ? (
          <View style={styles.slotsState}>
            <Text style={styles.slotsEmpty}>{slotsError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => void loadSlots()} activeOpacity={0.85}>
              <Text style={styles.retryBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : hourGroups.length === 0 ? (
          <View style={styles.slotsState}>
            <Text style={styles.slotsEmpty}>
              {rescheduleBookingId
                ? 'No open times on this day. Try another date.'
                : 'No open times on this day. Try another date, or talk to a different pandit.'}
            </Text>
            {rescheduleBookingId ? null : (
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => router.push('/(tabs)/experts')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="See other pandits"
              >
                <Text style={styles.retryBtnText}>See other pandits</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourStrip}
            >
              {hourGroups.map((group) => {
                const selected = group.hourKey === selectedHourKey;
                return (
                  <TouchableOpacity
                    key={group.hourKey}
                    style={[styles.hourChip, selected && styles.hourChipSelected]}
                    onPress={() => setSelectedHourKey(group.hourKey)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.hourChipText, selected && styles.hourChipTextSelected]}>
                      {group.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.slotGrid}>
              {slotsInSelectedHour.map((slot) => {
                const booked = slot.status === 'booked';
                const selected = slot.startTime === selectedStartTime;
                return (
                  <View key={slot.startTime} style={styles.slotCell}>
                    <TouchableOpacity
                      style={[
                        styles.slotTouchable,
                        selected && styles.slotTouchableSelected,
                        booked && styles.slotTouchableBooked,
                      ]}
                      onPress={() => !booked && setSelectedStartTime(slot.startTime)}
                      disabled={booked}
                      activeOpacity={booked ? 1 : 0.85}
                    >
                      <Text
                        style={[
                          styles.slotLabel,
                          selected && styles.slotLabelSelected,
                          booked && styles.slotLabelBooked,
                        ]}
                      >
                        {formatSlotTime(slot.startTime)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            paddingTop: 10,
          },
        ]}
      >
        <CancellationPolicySummary compact />
        {shortfall > 0 ? (
          <View style={styles.lowBalance}>
            <Text style={styles.lowBalanceText}>
              {lowBalanceBookingCopy(sessionCoins, walletBalance ?? 0, suggestedPack?.coins)}
            </Text>
            <TouchableOpacity
              style={styles.lowBalanceBtn}
              onPress={() => router.push('/wallet/recharge')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Add coins"
            >
              <Text style={styles.lowBalanceBtnText}>{ADD_COINS_LABEL}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
          onPress={() => void handleConfirm()}
          disabled={!canConfirm}
          activeOpacity={0.85}
        >
          {confirming ? (
            <ActivityIndicator color={WHITE} />
          ) : (
            <Text style={styles.confirmBtnText}>
              {rescheduleBookingId
                ? 'Confirm new time'
                : `Confirm Booking — ${priceDisplay}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const SLOT_GAP = 10;
const SLOT_COLS = 2;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: WARM_IVORY,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAGE_PAD,
    paddingBottom: 10,
    backgroundColor: WHITE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HEADER_RULE_GREY,
  },
  backHit: {
    paddingVertical: 4,
    paddingRight: 8,
    minWidth: 72,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: BLACK,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
  },
  headerSpacer: {
    minWidth: 72,
  },
  fallbackText: {
    marginTop: 24,
    textAlign: 'center',
    color: GREY_LABEL,
    fontSize: 15,
    paddingHorizontal: PAGE_PAD,
  },
  scrollInner: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 16,
  },
  summaryCard: {
    backgroundColor: WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: HEADER_RULE_GREY,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BLACK,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: GREY_LABEL,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: BLACK,
    marginBottom: 12,
  },
  sectionHint: {
    fontSize: 13,
    lineHeight: 18,
    color: GREY_LABEL,
    marginTop: -8,
    marginBottom: 12,
  },
  dateStrip: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 20,
  },
  dateChip: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 4,
    minWidth: 64,
  },
  dateChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: GREY_LABEL,
  },
  dateChipTextSelected: {
    color: BLACK,
    fontWeight: '700',
  },
  dateUnderline: {
    marginTop: 6,
    height: 3,
    width: '100%',
    borderRadius: 2,
    backgroundColor: GOLD,
  },
  dateUnderlinePlaceholder: {
    marginTop: 6,
    height: 3,
    width: '100%',
  },
  slotsState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  slotsEmpty: {
    fontSize: 14,
    fontWeight: '500',
    color: GREY_LABEL,
    textAlign: 'center',
    paddingVertical: 24,
  },
  retryBtn: {
    marginTop: 12,
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
  hourStrip: {
    gap: 10,
    paddingBottom: 16,
  },
  hourChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: WHITE,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourChipSelected: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  hourChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  hourChipTextSelected: {
    color: WHITE,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SLOT_GAP / 2,
  },
  slotCell: {
    width: `${100 / SLOT_COLS}%`,
    paddingHorizontal: SLOT_GAP / 2,
    marginBottom: SLOT_GAP,
  },
  slotTouchable: {
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTouchableSelected: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  slotTouchableBooked: {
    backgroundColor: IMAGE_PLACEHOLDER,
    borderColor: HEADER_RULE_GREY,
    opacity: 0.85,
  },
  slotLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
  },
  slotLabelSelected: {
    color: WHITE,
  },
  slotLabelBooked: {
    color: GREY_LABEL,
    textDecorationLine: 'line-through',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: PAGE_PAD,
    backgroundColor: WHITE,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HEADER_RULE_GREY,
    shadowColor: SHADOW_BLACK,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  lowBalance: {
    marginBottom: 10,
    gap: 8,
  },
  lowBalanceText: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_PRIMARY_DARK,
  },
  lowBalanceBtn: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  lowBalanceBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: GOLD,
  },
  confirmBtn: {
    height: FOOTER_BAR_HEIGHT,
    borderRadius: 12,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.45,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
  },
});
