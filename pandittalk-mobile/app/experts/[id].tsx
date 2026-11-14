import { Ionicons } from '@expo/vector-icons';
import { BackChevron } from '@/components/BackChevron';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios, { isAxiosError } from 'axios';
import { ADD_COINS_LABEL, INSUFFICIENT_COINS_TITLE, insufficientCoinsBody } from '@/lib/insufficientCoins';
import { AVATAR_IMAGE_CACHE, avatarImageSource } from '@/lib/avatarImageCache';

import {
  BLACK,
  GOLD,
  GREY_LABEL,
  HEADER_RULE_GREY,
  MUTED_GREY,
  PLACEHOLDER_GREY,
  SCRIM_BLACK,
  SHADOW_BLACK,
  STAR_EMPTY,
  TEXT_PRIMARY_DARK,
  WHITE,
  WARM_IVORY,
  GOLD_BORDER,
} from '../../constants/Colors';
import { shadowCard } from '../../constants/Shadows';
import { PAGE_PAD } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { AvailabilityStatus } from '../../components/AvailabilityStatus';
import { KeyboardAvoidingContainer } from '../../components/KeyboardAwareScreen';
import { CancellationPolicySummary } from '../../components/CancellationPolicySummary';
import { ScreenBackground } from '../../components/ui/ScreenBackground';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { formatApiConnectionError, getApiBase } from '../../lib/authApi';
import { getUserBookings, type Booking } from '../../lib/bookingApi';
import { firstUnreviewedSession } from '../../lib/firstReview';
import {
  BOOKING_AREAS,
  BOOKING_DEPTHS,
  BOOKING_FORMATS,
  type BookingAreaKey,
  type BookingDepthKey,
  type BookingFormatKey,
  bookingDurationMinutes,
  computeBookingTotal,
  DEPTH_PRICE_HINT,
  DEPTH_SUMMARIES,
  depthOfferCopy,
  formatPerMinuteRate,
  formatRupee,
} from '../../lib/bookingPricing';
import {
  getCallBookingStatus,
  getCallRoute,
} from '../../lib/callBookingStatus';
import { getChatBookingStatus, getChatRouteParams } from '../../lib/chatBookingStatus';
import { type ExpertEntity, fetchExpertById, fetchFollowStatus, setPanditFollowed } from '../../lib/expertsApi';
import {
  canBookAvSessions,
  canJoinAvSessions,
  IOS_AV_UNAVAILABLE_MESSAGE,
  IOS_AV_UNAVAILABLE_TITLE,
} from '../../lib/iosStorePolicy';
import { ensureAdultForMarketplace } from '../../lib/ageGate';
import { refreshWalletBalance } from '../../lib/walletApi';
import { useAuthStore } from '../../store/useAuthStore';

const FOOTER_BAR_HEIGHT = 52;
const JOIN_WINDOW_PROMISE =
  'If they have not joined within 10 minutes, the charge returns to your wallet.';
const AVATAR_LARGE = 120;
const CHAT_NOW_COST = 101;
const CHAT_NOW_DURATION_MINUTES = 15;

type ChatNowResponse = { id?: string; data?: { id?: string } };

function toCallPayload(booking: Booking) {
  return {
    ...booking,
    panditName: booking.panditName ?? '',
    startTime: booking.startTime,
    durationMinutes: bookingDurationMinutes(booking.depth),
  };
}

function StarRow({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: max }, (_, i) => (
        <Text key={i} style={[styles.star, i < count && styles.starFilled]}>
          ★
        </Text>
      ))}
    </View>
  );
}

type BookSessionSheetProps = {
  visible: boolean;
  expertName: string;
  onClose: () => void;
  onChooseSlot: (selection: {
    area: BookingAreaKey;
    depth: BookingDepthKey;
    format: BookingFormatKey;
    totalPrice: number;
    durationMinutes: number;
  }) => void;
};

function BookSessionSheet({ visible, expertName, onClose, onChooseSlot }: BookSessionSheetProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [area, setArea] = useState<BookingAreaKey | null>(null);
  const [depth, setDepth] = useState<BookingDepthKey | null>(null);
  const [format, setFormat] = useState<BookingFormatKey | null>(null);
  const availableFormats = canBookAvSessions() ? BOOKING_FORMATS : [];

  useEffect(() => {
    if (!visible) {
      setStep(1);
      setArea(null);
      setDepth(null);
      setFormat(null);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && !canBookAvSessions()) {
      Alert.alert(IOS_AV_UNAVAILABLE_TITLE, IOS_AV_UNAVAILABLE_MESSAGE);
      onClose();
    }
  }, [visible, onClose]);

  const totalPrice = useMemo(() => {
    if (!depth || !format) return 0;
    return computeBookingTotal(depth, format);
  }, [depth, format]);

  const durationMinutes = useMemo(() => {
    if (!depth) return 0;
    return BOOKING_DEPTHS.find((d) => d.key === depth)?.minutes ?? 0;
  }, [depth]);

  const canContinue = useMemo(() => {
    if (step === 1) return area != null;
    if (step === 2) return depth != null;
    return format != null;
  }, [step, area, depth, format]);

  const handleChooseSlot = () => {
    if (!area || !depth || !format) return;
    onChooseSlot({ area, depth, format, totalPrice, durationMinutes });
  };

  const handleContinue = () => {
    if (!canContinue) return;
    if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3);
    else handleChooseSlot();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={sheetStyles.backdrop} onPress={onClose}>
        <Pressable
          style={[sheetStyles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={sheetStyles.handle} />
          <View style={sheetStyles.sheetHeader}>
            <Text style={sheetStyles.sheetTitle}>Book Session</Text>
            <Text style={sheetStyles.sheetSubtitle}>{expertName}</Text>
            <TouchableOpacity style={sheetStyles.closeHit} onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={GREY_LABEL} />
            </TouchableOpacity>
          </View>

          <View style={sheetStyles.stepRow}>
            {([1, 2, 3] as const).map((n) => (
              <View key={n} style={sheetStyles.stepItem}>
                <View
                  style={[
                    sheetStyles.stepDot,
                    step >= n && sheetStyles.stepDotActive,
                    step === n && sheetStyles.stepDotCurrent,
                  ]}
                >
                  <Text
                    style={[
                      sheetStyles.stepDotText,
                      step >= n && sheetStyles.stepDotTextActive,
                      step === n && sheetStyles.stepDotTextCurrent,
                    ]}
                  >
                    {n}
                  </Text>
                </View>
                <Text style={[sheetStyles.stepLabel, step === n && sheetStyles.stepLabelActive]}>
                  {n === 1 ? 'Area' : n === 2 ? 'Depth' : 'Format'}
                </Text>
              </View>
            ))}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={sheetStyles.scroll}
            contentContainerStyle={sheetStyles.scrollInner}
            keyboardShouldPersistTaps="handled"
          >
            {step === 1 ? (
              <>
                <Text style={sheetStyles.stepTitle}>What would you like guidance on?</Text>
                <View style={sheetStyles.areaGrid}>
                  {BOOKING_AREAS.map((item) => {
                    const selected = area === item.key;
                    return (
                      <View key={item.key} style={sheetStyles.areaCell}>
                        <TouchableOpacity
                          style={[sheetStyles.areaChip, selected && sheetStyles.areaChipSelected]}
                          onPress={() => setArea(item.key)}
                          activeOpacity={0.8}
                        >
                          <Text style={[sheetStyles.areaChipText, selected && sheetStyles.areaChipTextSelected]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <TouchableOpacity style={sheetStyles.backStep} onPress={() => setStep(1)} activeOpacity={0.7}>
                  <Text style={sheetStyles.backStepText}>← Change area</Text>
                </TouchableOpacity>
                <Text style={sheetStyles.stepTitle}>Choose session depth</Text>
                <Text style={sheetStyles.stepHint}>{DEPTH_PRICE_HINT}</Text>
                {BOOKING_DEPTHS.map((item) => {
                  const selected = depth === item.key;
                  const offer = depthOfferCopy(item.price, item.minutes);
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[sheetStyles.depthCard, selected && sheetStyles.depthCardSelected]}
                      onPress={() => setDepth(item.key)}
                      activeOpacity={0.85}
                    >
                      <View style={sheetStyles.depthCardTop}>
                        <Text style={[sheetStyles.depthLabel, selected && sheetStyles.depthLabelSelected]}>
                          {item.label}
                        </Text>
                        {item.badge ? (
                          <View style={sheetStyles.badge}>
                            <Text style={sheetStyles.badgeText}>{item.badge}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[sheetStyles.depthSummary, selected && sheetStyles.depthMetaSelected]}>
                        {DEPTH_SUMMARIES[item.key]}
                      </Text>
                      <Text style={[sheetStyles.depthMeta, selected && sheetStyles.depthMetaSelected]}>
                        {offer.session}
                      </Text>
                      {offer.compare ? (
                        <Text style={sheetStyles.depthCompare}>{offer.compare}</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </>
            ) : null}

            {step === 3 ? (
              <>
                <TouchableOpacity style={sheetStyles.backStep} onPress={() => setStep(2)} activeOpacity={0.7}>
                  <Text style={sheetStyles.backStepText}>← Change depth</Text>
                </TouchableOpacity>
                <Text style={sheetStyles.stepTitle}>Choose session format</Text>
                {availableFormats.length === 0 ? (
                  <Text style={sheetStyles.sheetSubtitle}>{IOS_AV_UNAVAILABLE_MESSAGE}</Text>
                ) : (
                  availableFormats.map((item) => {
                  const selected = format === item.key;
                  const base = depth ? (BOOKING_DEPTHS.find((d) => d.key === depth)?.price ?? 0) : 0;
                  const lineTotal = base + item.extra;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[sheetStyles.formatCard, selected && sheetStyles.formatCardSelected]}
                      onPress={() => setFormat(item.key)}
                      activeOpacity={0.85}
                    >
                      <View>
                        <Text style={[sheetStyles.formatLabel, selected && sheetStyles.formatLabelSelected]}>
                          {item.label}
                        </Text>
                        <Text style={[sheetStyles.formatExtra, selected && sheetStyles.formatExtraSelected]}>
                          {item.extra === 0 ? '₹0 extra' : `+${formatRupee(item.extra)}`}
                          {depth
                            ? ` · ${formatPerMinuteRate(lineTotal, BOOKING_DEPTHS.find((d) => d.key === depth)?.minutes ?? 0)}`
                            : ''}
                        </Text>
                      </View>
                      <Text style={[sheetStyles.formatPrice, selected && sheetStyles.formatPriceSelected]}>
                        {formatRupee(lineTotal)}
                      </Text>
                    </TouchableOpacity>
                  );
                })
                )}

                {format && depth ? (
                  <View style={sheetStyles.priceSummary}>
                    <View>
                      <Text style={sheetStyles.priceSummaryLabel}>Total</Text>
                      <Text style={sheetStyles.priceSummaryHint}>
                        {formatPerMinuteRate(totalPrice, durationMinutes)}
                      </Text>
                    </View>
                    <Text style={sheetStyles.priceSummaryValue}>{formatRupee(totalPrice)}</Text>
                  </View>
                ) : null}

                <CancellationPolicySummary compact />
              </>
            ) : null}
          </ScrollView>

          {step === 3 ? <Text style={sheetStyles.joinPromise}>{JOIN_WINDOW_PROMISE}</Text> : null}
          <TouchableOpacity
            style={[sheetStyles.ctaBtn, !canContinue && sheetStyles.ctaBtnDisabled]}
            disabled={!canContinue}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={sheetStyles.ctaBtnText}>
              {step < 3 ? 'Continue' : `Choose Time Slot — ${formatRupee(totalPrice)}`}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type ChatNowSheetProps = {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (area: BookingAreaKey, notes: string) => void;
};

function ChatNowSheet({ visible, loading, onClose, onConfirm }: ChatNowSheetProps) {
  const insets = useSafeAreaInsets();
  const [area, setArea] = useState<BookingAreaKey | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!visible) {
      setArea(null);
      setNotes('');
    }
  }, [visible]);

  const canConfirm = Boolean(area) && !loading;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={sheetStyles.backdrop} onPress={onClose}>
        <KeyboardAvoidingContainer style={sheetStyles.backdropInner} headerOffset={insets.top}>
          <Pressable
            style={[sheetStyles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={sheetStyles.handle} />
            <View style={sheetStyles.sheetHeader}>
              <Text style={sheetStyles.sheetTitle}>Start Chat Session</Text>
              <Text style={sheetStyles.sheetSubtitle}>{CHAT_NOW_COST} coins will be deducted</Text>
              <Text style={sheetStyles.joinPromise}>{JOIN_WINDOW_PROMISE}</Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={sheetStyles.scroll}
              contentContainerStyle={sheetStyles.scrollInner}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={sheetStyles.stepTitle}>What would you like guidance on?</Text>
              <View style={sheetStyles.areaGrid}>
                {BOOKING_AREAS.map((item) => {
                  const selected = area === item.key;
                  return (
                    <View key={item.key} style={sheetStyles.areaCell}>
                      <TouchableOpacity
                        style={[sheetStyles.areaChip, selected && sheetStyles.areaChipSelected]}
                        onPress={() => setArea(item.key)}
                        activeOpacity={0.8}
                      >
                        <Text style={[sheetStyles.areaChipText, selected && sheetStyles.areaChipTextSelected]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              <Text style={chatNowSheetStyles.notesLabel}>Describe your concern (optional)</Text>
              <TextInput
                style={chatNowSheetStyles.notesInput}
                placeholder="Describe your concern (optional)"
                placeholderTextColor={MUTED_GREY}
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={200}
                textAlignVertical="top"
              />

              <CancellationPolicySummary compact />
            </ScrollView>

            <View style={chatNowSheetStyles.modalBtnRow}>
              <TouchableOpacity
                style={chatNowSheetStyles.modalCancelBtn}
                onPress={onClose}
                activeOpacity={0.85}
                disabled={loading}
              >
                <Text style={chatNowSheetStyles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[chatNowSheetStyles.modalConfirmBtn, !canConfirm && sheetStyles.ctaBtnDisabled]}
                disabled={!canConfirm}
                onPress={() => {
                  if (!area) return;
                  onConfirm(area, notes);
                }}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <Text style={sheetStyles.ctaBtnText}>Start Chat - {CHAT_NOW_COST} coins</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingContainer>
      </Pressable>
    </Modal>
  );
}

export default function ExpertDetailByIdScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, openBook } = useLocalSearchParams<{ id: string; openBook?: string }>();
  const expertId = Array.isArray(id) ? id[0] : id;
  const openBookParam = Array.isArray(openBook) ? openBook[0] : openBook;

  const [expert, setExpert] = useState<ExpertEntity | null>(null);
  const [followed, setFollowed] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookSheetVisible, setBookSheetVisible] = useState(false);
  const [chatSheetVisible, setChatSheetVisible] = useState(false);
  const [chatNowLoading, setChatNowLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const openBookHandledRef = useRef(false);

  const accessToken = useAuthStore((s) => s.accessToken);
  const walletBalance = useAuthStore((s) => s.walletBalance);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const load = useCallback(async () => {
    if (!expertId) {
      setExpert(null);
      setLoading(false);
      setError('Missing pandit link.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExpertById(expertId);
      setExpert(data);
      if (!data) setError('Pandit not found.');
    } catch (e) {
      setExpert(null);
      let msg: string = 'Could not load this pandit.';
      if (isAxiosError(e)) {
        const raw = e.response?.data as { message?: unknown } | undefined;
        const m = raw?.message;
        if (typeof m === 'string') msg = m;
        else if (Array.isArray(m)) msg = m.map(String).join(', ');
        else if (e.message) msg = e.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [expertId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!expertId) return;
    const timer = setInterval(() => {
      void fetchExpertById(expertId).then((data) => {
        if (data) setExpert(data);
      });
    }, 30_000);
    return () => clearInterval(timer);
  }, [expertId]);

  useEffect(() => {
    if (!expertId || !accessToken) {
      setFollowed(false);
      return;
    }
    let cancelled = false;
    void fetchFollowStatus(accessToken, expertId)
      .then((value) => {
        if (!cancelled) setFollowed(value);
      })
      .catch(() => {
        if (!cancelled) setFollowed(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, expertId]);

  const toggleFollow = useCallback(async () => {
    if (!expert) return;
    if (!accessToken) {
      Alert.alert('Sign in to follow', 'Followed pandits stay on this account.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/login') },
      ]);
      return;
    }
    if (followBusy) return;
    const next = !followed;
    setFollowed(next);
    setFollowBusy(true);
    try {
      const saved = await setPanditFollowed(accessToken, expert.id, next);
      setFollowed(saved);
    } catch {
      setFollowed(!next);
      Alert.alert('Could not update follow', 'Try again in a moment.');
    } finally {
      setFollowBusy(false);
    }
  }, [accessToken, expert, followBusy, followed, router]);

  const shareExpert = useCallback(async () => {
    if (!expert) return;
    const url = `https://www.pandittalk.com/experts/${expert.id}`;
    try {
      await Share.share({
        message: `${expert.name} on PanditTalk\n${url}`,
        url,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      if (/cancel|dismiss/i.test(message)) return;
    }
  }, [expert]);

  useEffect(() => {
    if (!expert || loading || openBookParam !== '1' || openBookHandledRef.current) return;
    openBookHandledRef.current = true;
    if (!canBookAvSessions()) {
      Alert.alert(IOS_AV_UNAVAILABLE_TITLE, IOS_AV_UNAVAILABLE_MESSAGE);
      return;
    }
    setBookSheetVisible(true);
  }, [expert, loading, openBookParam]);

  const loadBookings = useCallback(async () => {
    if (!accessToken) {
      setBookings([]);
      return;
    }
    try {
      const data = await getUserBookings();
      setBookings(data);
    } catch {
      setBookings([]);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      void loadBookings();
    }, [loadBookings]),
  );

  useEffect(() => {
    const id = setInterval(() => void loadBookings(), 30_000);
    return () => clearInterval(id);
  }, [loadBookings]);

  const callStatus = useMemo(() => {
    if (!expertId) return { state: 'none' as const };
    return getCallBookingStatus(bookings.map(toCallPayload), expertId);
  }, [bookings, expertId]);

  const unreviewedSession = useMemo(
    () => (expertId ? firstUnreviewedSession(bookings, expertId) : null),
    [bookings, expertId],
  );

  const chatStatus = useMemo(() => {
    if (!expertId) return { state: 'none' as const };
    return getChatBookingStatus(bookings, expertId);
  }, [bookings, expertId]);

  const callButton = useMemo(() => {
    if (!canJoinAvSessions()) {
      return { visible: false as const };
    }
    switch (callStatus.state) {
      case 'active':
      case 'waitingRoom':
        return {
          visible: true,
          style: styles.callBtn,
          textStyle: styles.callBtnText,
          label: 'Join Call',
          disabled: false,
          showHelper: false,
        };
      case 'soon':
      case 'upcoming':
        return {
          visible: true,
          style: styles.callBtnDisabled,
          textStyle: styles.callBtnTextDisabled,
          label: 'Join Call',
          disabled: true,
          showHelper: true,
        };
      default:
        return { visible: false as const };
    }
  }, [callStatus]);

  const handleCallPress = useCallback(() => {
    if (!canJoinAvSessions()) {
      Alert.alert(IOS_AV_UNAVAILABLE_TITLE, IOS_AV_UNAVAILABLE_MESSAGE);
      return;
    }
    if (
      (callStatus.state !== 'active' && callStatus.state !== 'waitingRoom') ||
      !expert
    ) {
      return;
    }
    router.push({
      pathname: getCallRoute(callStatus.booking),
      params: { bookingId: callStatus.booking.id, panditName: expert.name },
    });
  }, [callStatus, expert, router]);

  const handleOpenBookSession = useCallback(() => {
    if (!canBookAvSessions()) {
      Alert.alert(IOS_AV_UNAVAILABLE_TITLE, IOS_AV_UNAVAILABLE_MESSAGE);
      return;
    }
    setBookSheetVisible(true);
  }, []);

  const handleChooseSlot = useCallback(
    (selection: {
      area: BookingAreaKey;
      depth: BookingDepthKey;
      format: BookingFormatKey;
      totalPrice: number;
      durationMinutes: number;
    }) => {
      if (!expert) return;
      setBookSheetVisible(false);
      router.push({
        pathname: '/booking/select-slot',
        params: {
          panditId: expert.id,
          panditName: expert.name,
          area: selection.area,
          depth: selection.depth,
          format: selection.format,
          totalPrice: String(selection.totalPrice),
          durationMinutes: String(selection.durationMinutes),
        },
      });
    },
    [expert, router],
  );

  const handleChatNowPress = useCallback(() => {
    if (!expert) return;
    if (chatStatus.state !== 'none') {
      router.push(getChatRouteParams(chatStatus.booking));
      return;
    }
    if (!expert.isOnline) {
      Alert.alert(`${expert.name} is currently offline`);
      return;
    }
    setChatSheetVisible(true);
  }, [chatStatus, expert, router]);

  const handleChatNowConfirm = useCallback(
    async (area: BookingAreaKey, notes: string) => {
      if (!expert) return;

      if (chatStatus.state !== 'none') {
        setChatSheetVisible(false);
        router.replace(getChatRouteParams(chatStatus.booking));
        return;
      }

      if (walletBalance < CHAT_NOW_COST) {
        setChatSheetVisible(false);
        Alert.alert(INSUFFICIENT_COINS_TITLE, insufficientCoinsBody(CHAT_NOW_COST, walletBalance), [
          { text: 'Cancel', style: 'cancel' },
          { text: ADD_COINS_LABEL, onPress: () => router.push({ pathname: '/wallet/recharge', params: { returnTo: `/experts/${expert.id}` } }) },
        ]);
        return;
      }

      if (!accessToken) {
        Alert.alert('Sign in required', 'Please log in to start a chat session.');
        return;
      }

      const adultOk = await ensureAdultForMarketplace({
        accessToken,
        user,
        setUser,
        router,
      });
      if (!adultOk) {
        setChatSheetVisible(false);
        return;
      }

      setChatNowLoading(true);
      try {
        const fresh = await fetchExpertById(expert.id);
        if (fresh && !fresh.isOnline) {
          setExpert(fresh);
          setChatSheetVisible(false);
          Alert.alert(`${expert.name} just went offline`, 'They are no longer available for chat now.');
          return;
        }

        const res = await axios.post(
          `${getApiBase()}/bookings/chat-now`,
          { panditId: expert.id, area, notes: notes.trim() || undefined },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        );
        const body = res.data as ChatNowResponse;
        const bookingId = body.id ?? body.data?.id;
        if (!bookingId) {
          throw new Error('Invalid booking response');
        }
        await refreshWalletBalance(accessToken).catch(() => {});
        setChatSheetVisible(false);
        router.replace({
          pathname: '/session/chat',
          params: {
            bookingId,
            panditName: expert.name,
            panditId: expert.id,
            durationMinutes: String(CHAT_NOW_DURATION_MINUTES),
            area,
            format: 'chat',
          },
        });
      } catch (e) {
        Alert.alert('Error', formatApiConnectionError(e, getApiBase()));
      } finally {
        setChatNowLoading(false);
      }
    },
    [accessToken, chatStatus, expert, router, setUser, user, walletBalance],
  );

  const scrollBottomPad = FOOTER_BAR_HEIGHT + 48 + Math.max(insets.bottom, 12);

  if (!expertId) {
    return (
      <ScreenBackground motifVariant="yantra">
        <View style={[styles.screen, { paddingTop: insets.top }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backRow}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackChevron color={BLACK} />
          </TouchableOpacity>
          <Text style={styles.fallbackText}>Invalid link.</Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground motifVariant="yantra">
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
        {expert ? (
          <View style={styles.topActions}>
            <TouchableOpacity
              onPress={() => void shareExpert()}
              style={styles.followHit}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Share ${expert.name}`}
            >
              <Ionicons name="share-outline" size={22} color={GOLD} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void toggleFollow()}
              style={styles.followHit}
              activeOpacity={0.7}
              disabled={followBusy}
              accessibilityRole="button"
              accessibilityLabel={followed ? `Unfollow ${expert.name}` : `Follow ${expert.name}`}
            >
              <Ionicons name={followed ? 'heart' : 'heart-outline'} size={24} color={GOLD} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.followHit} />
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <SkeletonCard showAvatar lines={4} />
          <SkeletonCard lines={3} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void load()} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : expert ? (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollInner, { paddingBottom: scrollBottomPad }]}
          >
            <View style={styles.profileBlock}>
              <View style={styles.photoCircle}>
                {expert.imageUrl ? (
                  <Image
                    source={avatarImageSource(expert.imageUrl) ?? { uri: expert.imageUrl }}
                    style={styles.photoImage}
                    contentFit="cover"
                    cachePolicy={AVATAR_IMAGE_CACHE}
                    transition={0}
                  />
                ) : null}
              </View>
              <Text style={styles.name}>{expert.name}</Text>
              <Text style={styles.specialization}>{expert.specialty}</Text>
              <Text style={styles.languages}>{expert.languagesDisplay}</Text>
              <Text style={styles.metaMuted}>{expert.experienceLabel}</Text>
              <AvailabilityStatus online={expert.isOnline} />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Rating</Text>
                <View style={styles.statValueRow}>
                  <StarRow count={expert.rating} />
                  <Text style={styles.statValueText}>{expert.ratingDisplay.toFixed(1)}</Text>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Reviews</Text>
                <Text style={styles.statValueSingle}>{expert.totalReviews.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Experience</Text>
                <Text style={styles.statValueSingle}>
                  {expert.experienceYears > 0 ? `${expert.experienceYears} yrs` : '—'}
                </Text>
              </View>
            </View>

            {expert.totalReviews === 0 ? (
              <View style={styles.reviewEmpty}>
                <Text style={styles.reviewEmptyTitle}>No reviews yet</Text>
                {unreviewedSession ? (
                  <>
                    <Text style={styles.reviewEmptyBody}>
                      You finished a session with {expert.name}. Your review would be the first.
                    </Text>
                    <TouchableOpacity
                      style={styles.reviewEmptyBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/bookings/review',
                          params: {
                            bookingId: unreviewedSession.id,
                            panditName: expert.name,
                          },
                        })
                      }
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`Write the first review for ${expert.name}`}
                    >
                      <Text style={styles.reviewEmptyBtnText}>Write the first review</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.reviewEmptyBody}>
                    Reviews show up here after a completed session.
                  </Text>
                )}
              </View>
            ) : null}

            <View style={styles.bioSection}>
              <Text style={styles.bioTitle}>About</Text>
              <Text style={styles.bioBody}>{expert.bio}</Text>
            </View>
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                paddingBottom: Math.max(insets.bottom, 12),
                paddingTop: 8,
              },
            ]}
          >
            <Text style={styles.joinPromise}>{JOIN_WINDOW_PROMISE}</Text>
            <View style={styles.footerActions}>
            <TouchableOpacity
              style={[styles.chatBtn, styles.chatBtnActive]}
              activeOpacity={0.85}
              onPress={handleChatNowPress}
            >
              <Text style={[styles.chatBtnText, styles.chatBtnTextActive]}>
                {chatStatus.state !== 'none' ? '💬 Join Chat' : '💬 Chat Now'}
              </Text>
            </TouchableOpacity>
            {canBookAvSessions() ? (
              <TouchableOpacity style={styles.bookBtn} onPress={handleOpenBookSession} activeOpacity={0.85}>
                <Text style={styles.bookBtnText}>Book Audio or Video</Text>
              </TouchableOpacity>
            ) : null}
            {callButton.visible ? (
              <View style={styles.callSlot}>
                <TouchableOpacity
                  style={callButton.style}
                  activeOpacity={callButton.disabled ? 1 : 0.85}
                  disabled={callButton.disabled}
                  onPress={handleCallPress}
                >
                  <Text style={callButton.textStyle}>{callButton.label}</Text>
                </TouchableOpacity>
                {callButton.showHelper ? (
                  <Text style={styles.callHelper}>Available at session time</Text>
                ) : null}
              </View>
            ) : null}
            </View>
          </View>

          {canBookAvSessions() ? (
            <BookSessionSheet
              visible={bookSheetVisible}
              expertName={expert.name}
              onClose={() => setBookSheetVisible(false)}
              onChooseSlot={handleChooseSlot}
            />
          ) : null}

          <ChatNowSheet
            visible={chatSheetVisible}
            loading={chatNowLoading}
            onClose={() => setChatSheetVisible(false)}
            onConfirm={(area, notes) => void handleChatNowConfirm(area, notes)}
          />
        </>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.fallbackText}>Pandit not found.</Text>
        </View>
      )}
    </ScreenBackground>
  );
}

const sheetStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: SCRIM_BLACK,
    justifyContent: 'flex-end',
  },
  backdropInner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '88%',
    paddingTop: 8,
    paddingHorizontal: PAGE_PAD,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: HEADER_RULE_GREY,
    marginBottom: 8,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 28,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BLACK,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: GREY_LABEL,
    marginTop: 2,
  },
  joinPromise: {
    fontSize: 12,
    lineHeight: 16,
    color: GREY_LABEL,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  closeHit: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: HEADER_RULE_GREY,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepDotActive: {
    borderColor: GOLD,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  stepDotCurrent: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  stepDotText: {
    fontSize: 13,
    fontWeight: '700',
    color: GREY_LABEL,
  },
  stepDotTextActive: {
    color: GOLD,
  },
  stepDotTextCurrent: {
    color: WHITE,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: GREY_LABEL,
  },
  stepLabelActive: {
    color: BLACK,
  },
  scroll: {
    maxHeight: 360,
  },
  scrollInner: {
    paddingBottom: 8,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BLACK,
    marginBottom: 14,
  },
  stepHint: {
    fontSize: 13,
    lineHeight: 18,
    color: GREY_LABEL,
    marginTop: -8,
    marginBottom: 14,
  },
  backStep: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backStepText: {
    fontSize: 13,
    fontWeight: '600',
    color: GOLD,
  },
  areaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  areaCell: {
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  areaChip: {
    borderWidth: 1.5,
    borderColor: HEADER_RULE_GREY,
    borderRadius: 10,
    backgroundColor: WARM_IVORY,
    paddingVertical: 12,
    alignItems: 'center',
  },
  areaChipSelected: {
    borderColor: GOLD,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  areaChipText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
  },
  areaChipTextSelected: {
    color: BLACK,
    fontWeight: '700',
  },
  depthCard: {
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: HEADER_RULE_GREY,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  depthCardSelected: {
    borderColor: GOLD,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  depthCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  depthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: BLACK,
  },
  depthLabelSelected: {
    color: BLACK,
  },
  badge: {
    backgroundColor: GOLD,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: WHITE,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  depthMeta: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
  },
  depthSummary: {
    fontSize: 14,
    lineHeight: 20,
    color: GREY_LABEL,
    marginBottom: 6,
  },
  depthCompare: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: GREY_LABEL,
  },
  depthMetaSelected: {
    color: TEXT_PRIMARY_DARK,
  },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: HEADER_RULE_GREY,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  formatCardSelected: {
    borderColor: GOLD,
    backgroundColor: GOLD,
  },
  formatLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: BLACK,
  },
  formatLabelSelected: {
    color: WHITE,
  },
  formatExtra: {
    fontSize: 13,
    fontWeight: '500',
    color: GREY_LABEL,
    marginTop: 2,
  },
  formatExtraSelected: {
    color: 'rgba(255,255,255,0.85)',
  },
  formatPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: GOLD,
  },
  formatPriceSelected: {
    color: WHITE,
  },
  priceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: WARM_IVORY,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  priceSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: GREY_LABEL,
  },
  priceSummaryHint: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED_GREY,
    marginTop: 2,
  },
  priceSummaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD,
  },
  ctaBtn: {
    height: FOOTER_BAR_HEIGHT,
    borderRadius: 12,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  ctaBtnDisabled: {
    opacity: 0.45,
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
  },
});

const chatNowSheetStyles = StyleSheet.create({
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 8,
    marginTop: 4,
  },
  notesInput: {
    backgroundColor: WARM_IVORY,
    borderWidth: 1,
    borderColor: HEADER_RULE_GREY,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    fontSize: 14,
    color: TEXT_PRIMARY_DARK,
    marginBottom: 12,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: FOOTER_BAR_HEIGHT,
    borderRadius: 12,
    backgroundColor: MUTED_GREY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
  },
  modalConfirmBtn: {
    flex: 1.4,
    height: FOOTER_BAR_HEIGHT,
    borderRadius: 12,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAGE_PAD,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backHit: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingRight: 12,
  },
  backRow: {
    paddingHorizontal: PAGE_PAD,
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: BLACK,
  },
  fallbackText: {
    marginTop: 24,
    textAlign: 'center',
    color: GREY_LABEL,
    fontSize: 15,
  },
  errorText: {
    textAlign: 'center',
    color: GREY_LABEL,
    fontSize: 15,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: PAGE_PAD,
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
  scrollInner: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 20,
  },
  profileBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoCircle: {
    width: AVATAR_LARGE,
    height: AVATAR_LARGE,
    borderRadius: AVATAR_LARGE / 2,
    backgroundColor: PLACEHOLDER_GREY,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: BLACK,
    textAlign: 'center',
    marginBottom: 6,
  },
  specialization: {
    fontSize: 14,
    fontWeight: '500',
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 20,
  },
  languages: {
    fontSize: 13,
    fontWeight: '500',
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 6,
  },
  metaMuted: {
    fontSize: 12,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: GOLD_BORDER,
    paddingVertical: 14,
    marginBottom: 24,
    ...shadowCard,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: HEADER_RULE_GREY,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: GREY_LABEL,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: BLACK,
  },
  statValueSingle: {
    fontSize: 15,
    fontWeight: '700',
    color: BLACK,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 12,
    color: STAR_EMPTY,
    marginHorizontal: 0.5,
  },
  starFilled: {
    color: GOLD,
  },
  reviewEmpty: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.2,
    borderColor: GOLD_BORDER,
    marginBottom: 16,
    ...shadowCard,
  },
  reviewEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BLACK,
    marginBottom: 6,
  },
  reviewEmptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: GREY_LABEL,
  },
  reviewEmptyBtn: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  reviewEmptyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
  },
  bioSection: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.2,
    borderColor: GOLD_BORDER,
    ...shadowCard,
  },
  bioTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BLACK,
    marginBottom: 10,
  },
  bioBody: {
    fontSize: 14,
    fontWeight: '400',
    color: GREY_LABEL,
    lineHeight: 22,
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
  joinPromise: {
    fontSize: 12,
    lineHeight: 16,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatBtn: {
    flex: 1,
    height: FOOTER_BAR_HEIGHT,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBtnActive: {
    backgroundColor: GOLD,
    borderWidth: 0,
  },
  chatBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  chatBtnTextActive: {
    color: WHITE,
  },
  bookBtn: {
    flex: 1.15,
    height: FOOTER_BAR_HEIGHT,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
  },
  callBtn: {
    flex: 1,
    height: FOOTER_BAR_HEIGHT,
    borderRadius: 12,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  callBtnSoon: {
    flex: 1,
    height: FOOTER_BAR_HEIGHT,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  callBtnDisabled: {
    flex: 1,
    height: FOOTER_BAR_HEIGHT,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: MUTED_GREY,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: WHITE,
    textAlign: 'center',
  },
  callBtnSoonText: {
    fontSize: 11,
    fontWeight: '600',
    color: GOLD,
    textAlign: 'center',
  },
  callBtnTextDisabled: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED_GREY,
    textAlign: 'center',
  },
  callSlot: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  callHelper: {
    ...Typography.caption,
    color: GREY_LABEL,
    marginTop: 2,
    textAlign: 'center',
  },
});
