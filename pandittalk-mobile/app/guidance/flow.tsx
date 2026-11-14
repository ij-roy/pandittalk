import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntertainmentDisclaimer } from '@/components/EntertainmentDisclaimer';
import { KeyboardAvoidingContainer } from '@/components/KeyboardAwareScreen';
import { CancellationPolicySummary } from '@/components/CancellationPolicySummary';
import { TabTopHeader } from '@/components/TabTopHeader';
import {
  AVAILABLE_GREEN,
  BG,
  CHIP_BORDER,
  DEEP_GREY,
  GOLD,
  GREY_LABEL,
  HEADER_RULE_GREY,
  IMAGE_PLACEHOLDER,
  MUTED_GREY,
  SHADOW_BLACK,
  SOFT_YELLOW,
  TEXT_PRIMARY_DARK,
  WARM_IVORY,
  WHITE,
  STEP_FUTURE,
} from '@/constants/Colors';
import { PAGE_PAD } from '@/constants/Spacing';
import {
  BOOKING_DEPTHS,
  type BookingAreaKey,
  type BookingDepthKey,
  type BookingFormatKey,
  areaByKey,
  areaDisplayLabel,
  bookingDurationMinutes,
  computeBookingTotal,
  DEPTH_PRICE_HINT,
  depthDisplayLabel,
  depthOfferCopy,
  depthByKey,
  formatDisplayLabel,
  formatRupee,
} from '@/lib/bookingPricing';
import { ADD_COINS_LABEL, INSUFFICIENT_COINS_TITLE, insufficientCoinsBody } from '@/lib/insufficientCoins';
import { presenceLabel } from '@/lib/presenceCopy';
import { type ExpertEntity, fetchExpertById, fetchExperts } from '@/lib/expertsApi';
import { AVATAR_IMAGE_CACHE, avatarImageSource } from '@/lib/avatarImageCache';
import {
  guidanceStepAfterArea,
  nextGuidanceStep,
  previousGuidanceStep,
  SEE_EXPERTS_LABEL,
  SESSION_LENGTH_FIRST_LABEL,
  CHOOSE_SESSION_LENGTH_LABEL,
} from '@/lib/guidanceDropOff';
import { guideMatchExplanation } from '@/lib/guideMatchExplanation';
import { SAVED_GUIDANCE_NOTE } from '@/lib/guidancePreferences';
import { loadGuidancePreferences, saveGuidancePreferences } from '@/lib/guidancePreferencesStore';
import {
  canBookAvSessions,
  IOS_AV_UNAVAILABLE_MESSAGE,
  IOS_AV_UNAVAILABLE_TITLE,
} from '@/lib/iosStorePolicy';
import { useAuthStore } from '@/store/useAuthStore';
import {
  type GuidanceStepIndex,
  useGuidanceFlowStore,
} from '@/store/useGuidanceFlowStore';

const STEP_DONE = DEEP_GREY;
const FOOTER_HEIGHT = 56;
const FOOTER_PADDING_TOP = 8;
const FOOTER_PADDING_BOTTOM = 4;
const SCROLL_END_PAD = 12;
const STEP_LABELS = ['Area', 'Depth', 'Format', 'Pandit'] as const;

type AreaTile = {
  key: BookingAreaKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const AREA_TILES: AreaTile[] = [
  { key: 'career', label: 'Career', icon: 'briefcase-outline' },
  { key: 'love', label: 'Love', icon: 'heart-outline' },
  { key: 'family', label: 'Family', icon: 'people-outline' },
  { key: 'marriage', label: 'Marriage', icon: 'infinite-outline' },
  { key: 'education', label: 'Education', icon: 'school-outline' },
  { key: 'health', label: 'Health', icon: 'fitness-outline' },
  { key: 'business', label: 'Business', icon: 'business-outline' },
  { key: 'finance', label: 'Finance & Money', icon: 'cash-outline' },
];

const DEPTH_BULLETS: Record<BookingDepthKey, string[]> = {
  entry: [
    'Quick clarity on a specific concern',
    'Ideal for first-time users',
    'Focused guidance',
  ],
  standard: [
    'Detailed discussion of your situation',
    'Covers related influencing factors',
    'Clear direction with practical insight',
  ],
  deep: [
    'In-depth exploration of complex situations',
    'Multiple life areas considered',
    'Strategic long-term perspective',
  ],
};

const FORMAT_ORDER: BookingFormatKey[] = ['video', 'audio'];

const FORMAT_SUBTITLES: Record<BookingFormatKey, string> = {
  video: 'Face to Face Conversation',
  audio: 'Voice-only session',
};

function availableFormatOrder(): BookingFormatKey[] {
  return canBookAvSessions() ? FORMAT_ORDER : [];
}

function paramString(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

function parseAreaKey(raw: string): BookingAreaKey | null {
  const found = areaByKey(raw);
  return found?.key ?? null;
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

type GuidanceStepperProps = {
  currentStep: GuidanceStepIndex;
  onStepPress: (step: GuidanceStepIndex) => void;
};

function GuidanceStepper({ currentStep, onStepPress }: GuidanceStepperProps) {
  const activeIndex = Math.min(currentStep - 1, 3);
  return (
    <View style={styles.stepperRow}>
      {STEP_LABELS.map((label, index) => {
        const stepNumber = (index + 1) as GuidanceStepIndex;
        const isActive = index === activeIndex && currentStep <= 4;
        const isDone = currentStep > stepNumber || currentStep === 5;
        const canJump = currentStep > stepNumber;
        const bg = isActive ? GOLD : isDone ? STEP_DONE : STEP_FUTURE;
        const textColor = isActive || isDone ? WHITE : DEEP_GREY;
        return (
          <View key={label} style={styles.stepperSegmentWrap}>
            <TouchableOpacity
              style={styles.stepperSegmentPressable}
              activeOpacity={canJump ? 0.85 : 1}
              disabled={!canJump}
              onPress={() => onStepPress(stepNumber)}
              accessibilityRole="button"
              accessibilityLabel={canJump ? `Go back to ${label}` : label}
              accessibilityState={{ disabled: !canJump }}
            >
              <View style={[styles.stepperSegment, { backgroundColor: bg }]}>
                <Text style={[styles.stepperLabel, { color: textColor }]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
            {index < STEP_LABELS.length - 1 ? (
              <View style={[styles.stepperChevron, { borderLeftColor: bg }]} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export default function StartGuidanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const walletBalance = useAuthStore((s) => s.walletBalance);
  const params = useLocalSearchParams<{ area?: string; expertId?: string; notes?: string }>();
  const areaParam = paramString(params.area);
  const expertIdParam = paramString(params.expertId);
  const notesParam = paramString(params.notes);
  const appliedEntryKeyRef = useRef('');

  const step = useGuidanceFlowStore((s) => s.step);
  const area = useGuidanceFlowStore((s) => s.area);
  const notes = useGuidanceFlowStore((s) => s.notes);
  const depth = useGuidanceFlowStore((s) => s.depth);
  const format = useGuidanceFlowStore((s) => s.format);
  const expert = useGuidanceFlowStore((s) => s.expert);
  const setStep = useGuidanceFlowStore((s) => s.setStep);
  const setArea = useGuidanceFlowStore((s) => s.setArea);
  const setNotes = useGuidanceFlowStore((s) => s.setNotes);
  const setDepth = useGuidanceFlowStore((s) => s.setDepth);
  const setFormat = useGuidanceFlowStore((s) => s.setFormat);
  const setExpert = useGuidanceFlowStore((s) => s.setExpert);

  const [experts, setExperts] = useState<ExpertEntity[]>([]);
  const [expertsLoading, setExpertsLoading] = useState(false);
  const [expertsError, setExpertsError] = useState<string | null>(null);
  const [restoredChoices, setRestoredChoices] = useState(false);
  const applyEntryParams = useCallback(() => {
    const entryKey = `${areaParam}|${expertIdParam}|${notesParam}`;
    if (!areaParam && !expertIdParam && !notesParam) return;
    if (appliedEntryKeyRef.current === entryKey) return;
    appliedEntryKeyRef.current = entryKey;

    if (notesParam) {
      setNotes(notesParam);
    }

    if (expertIdParam) {
      setStep(4);
      void (async () => {
        try {
          const data = await fetchExpertById(expertIdParam);
          if (data) setExpert(data);
        } catch {
          // User can pick from list.
        }
      })();
    }

    const parsedArea = areaParam ? parseAreaKey(areaParam) : null;
    if (parsedArea) {
      setArea(parsedArea);
      if (!expertIdParam) setStep(guidanceStepAfterArea());
    }
  }, [areaParam, expertIdParam, notesParam, setArea, setExpert, setNotes, setStep]);

  useFocusEffect(
    useCallback(() => {
      applyEntryParams();
    }, [applyEntryParams]),
  );

  useEffect(() => {
    let cancelled = false;
    void loadGuidancePreferences().then((prefs) => {
      if (cancelled || !prefs) return;
      const state = useGuidanceFlowStore.getState();
      const area =
        !areaParam && !state.area ? parseAreaKey(prefs.area) : null;
      const depth = !state.depth ? (depthByKey(prefs.depth)?.key ?? null) : null;
      const format =
        !state.format && availableFormatOrder().includes(prefs.format as BookingFormatKey)
          ? (prefs.format as BookingFormatKey)
          : null;
      if (area) setArea(area);
      if (depth) setDepth(depth);
      if (format) setFormat(format);
      if (area && depth && format) setRestoredChoices(true);
    });
    return () => {
      cancelled = true;
    };
  }, [areaParam, setArea, setDepth, setFormat]);

  const goBackOneStep = useCallback(() => {
    const previous = previousGuidanceStep(step, {
      depth: Boolean(depth),
      format: Boolean(format),
      expert: Boolean(expert),
    });
    if (previous == null) {
      router.navigate('/');
      return;
    }
    setStep(previous);
  }, [depth, expert, format, router, setStep, step]);

  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        if (step > 1) {
          goBackOneStep();
          return true;
        }
        router.navigate('/');
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [goBackOneStep, router, step]),
  );

  const selectArea = useCallback(
    (key: BookingAreaKey) => {
      if (area !== key) {
        setDepth(null);
        setFormat(null);
        setExpert(null);
      }
      setArea(key);
    },
    [area, setArea, setDepth, setExpert, setFormat],
  );

  const goToStep = useCallback(
    (target: GuidanceStepIndex) => {
      if (target >= step || target < 1 || target > 4) return;
      setStep(target);
    },
    [setStep, step],
  );

  const totalPrice = useMemo(() => {
    if (!depth || !format) return 0;
    return computeBookingTotal(depth, format);
  }, [depth, format]);

  const durationMinutes = useMemo(
    () => (depth ? bookingDurationMinutes(depth) : 0),
    [depth],
  );

  const loadExperts = useCallback(async () => {
    if (!area) {
      setExperts([]);
      return;
    }
    setExpertsLoading(true);
    setExpertsError(null);
    try {
      const list = await fetchExperts({ area });
      setExperts(list);
      const currentExpert = useGuidanceFlowStore.getState().expert;
      if (currentExpert && !list.some((e) => e.id === currentExpert.id)) {
        setExpert(null);
      }
    } catch (e) {
      setExperts([]);
      setExpertsError(messageFromError(e));
    } finally {
      setExpertsLoading(false);
    }
  }, [area, setExpert]);

  useEffect(() => {
    if (step === 4 && area) {
      void loadExperts();
    }
  }, [step, area, loadExperts]);

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(area);
    if (step === 2) return Boolean(depth);
    if (step === 3) return Boolean(format);
    if (step === 4) return Boolean(expert);
    return true;
  }, [step, area, depth, format, expert]);

  const showInsufficientAlert = useCallback(() => {
    Alert.alert(INSUFFICIENT_COINS_TITLE, insufficientCoinsBody(totalPrice, walletBalance), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: ADD_COINS_LABEL,
        onPress: () => router.push({ pathname: '/wallet/recharge', params: { returnTo: '/guidance/flow' } }),
      },
    ]);
  }, [router, totalPrice, walletBalance]);

  const handleProceedToSlotPicker = useCallback(() => {
    if (!area || !depth || !format || !expert) return;
    if (!accessToken) {
      Alert.alert('Sign in required', 'Please log in to confirm your booking.');
      return;
    }
    if (walletBalance < totalPrice) {
      showInsufficientAlert();
      return;
    }
    void saveGuidancePreferences({ area, depth, format });
    router.push({
      pathname: '/booking/select-slot',
      params: {
        panditId: expert.id,
        panditName: expert.name,
        area,
        depth,
        format,
        totalPrice: String(totalPrice),
        durationMinutes: String(durationMinutes),
        notes: notes.trim(),
      },
    });
  }, [
    accessToken,
    area,
    depth,
    durationMinutes,
    expert,
    format,
    notes,
    router,
    showInsufficientAlert,
    totalPrice,
    walletBalance,
  ]);

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <>
          <Text style={styles.stepTitle}>What would you like guidance on today?</Text>
          {restoredChoices ? <Text style={styles.stepHint}>{SAVED_GUIDANCE_NOTE}</Text> : null}
          <View style={styles.areaGrid}>
            {AREA_TILES.map((tile) => {
              const selected = area === tile.key;
              return (
                <TouchableOpacity
                  key={tile.key}
                  style={[styles.areaTile, selected && styles.areaTileSelected]}
                  onPress={() => selectArea(tile.key)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={tile.icon}
                    size={28}
                    color={selected ? WHITE : GOLD}
                  />
                  <Text style={[styles.areaTileLabel, selected && styles.areaTileLabelSelected]}>
                    {tile.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.optionalLabel}>
            Anything specific you&apos;d like your guide to know? (Optional)
          </Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Briefly describe your concern..."
            placeholderTextColor={MUTED_GREY}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <Text style={styles.stepTitle}>Choose the depth of guidance</Text>
          <Text style={styles.stepHint}>{DEPTH_PRICE_HINT}</Text>
          {BOOKING_DEPTHS.map((item) => {
            const selected = depth === item.key;
            const isStandard = item.key === 'standard';
            const badge =
              item.key === 'entry' ? 'First Session' : item.badge ?? null;
            const offer = depthOfferCopy(item.price, item.minutes);
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.depthCard,
                  isStandard && styles.depthCardFeatured,
                  selected && styles.depthCardSelected,
                ]}
                onPress={() => setDepth(item.key)}
                activeOpacity={0.85}
              >
                <View style={styles.depthCardHeader}>
                  <Text style={[styles.depthCardTitle, selected && styles.depthCardTitleSelected]}>
                    {item.label.toUpperCase()}
                  </Text>
                  {badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.depthPrice}>{offer.session}</Text>
                {offer.compare ? <Text style={styles.depthCompare}>{offer.compare}</Text> : null}
                {DEPTH_BULLETS[item.key].map((line) => (
                  <View key={line} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{line}</Text>
                  </View>
                ))}
              </TouchableOpacity>
            );
          })}
        </>
      );
    }

    if (step === 3) {
      const baseDepth = depth;
      const formats = availableFormatOrder();
      return (
        <>
          <Text style={styles.stepTitle}>How would you like to connect?</Text>
          {formats.length === 0 ? (
            <View>
              <Text style={styles.rulesHeading}>{IOS_AV_UNAVAILABLE_TITLE}</Text>
              <Text style={styles.rulesLine}>{IOS_AV_UNAVAILABLE_MESSAGE}</Text>
              <TouchableOpacity
                style={[styles.formatCard, { marginTop: 12 }]}
                onPress={() => router.push('/(tabs)/experts')}
                activeOpacity={0.85}
              >
                <View style={styles.formatIconCircle}>
                  <Ionicons name="chatbubbles" size={32} color={GOLD} />
                </View>
                <View style={styles.formatCopy}>
                  <Text style={styles.formatTitle}>Use Chat Now</Text>
                  <Text style={styles.formatSubtitle}>
                    Book a live chat consultation with a pandit from Experts.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {formats.map((fmtKey) => {
                const selected = format === fmtKey;
                const price = baseDepth ? computeBookingTotal(baseDepth, fmtKey) : 0;
                const label = fmtKey === 'video' ? 'VIDEO' : 'AUDIO';
                return (
                  <TouchableOpacity
                    key={fmtKey}
                    style={[styles.formatCard, selected && styles.formatCardSelected]}
                    onPress={() => setFormat(fmtKey)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.formatIconCircle}>
                      <Ionicons
                        name={fmtKey === 'video' ? 'videocam' : 'volume-high'}
                        size={32}
                        color={GOLD}
                      />
                    </View>
                    <View style={styles.formatCopy}>
                      <Text style={styles.formatTitle}>
                        {label} {formatRupee(price)}
                      </Text>
                      <Text style={styles.formatSubtitle}>{FORMAT_SUBTITLES[fmtKey]}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <Text style={styles.rulesHeading}>RULES</Text>
              <Text style={styles.rulesLine}>• Video appears first.</Text>
              <Text style={styles.rulesLine}>• No default selection.</Text>
            </>
          )}
        </>
      );
    }

    if (step === 4) {
      return (
        <>
          <Text style={styles.stepTitle}>Choose your guide</Text>
          <Text style={styles.stepHint}>
            {guideMatchExplanation(area ? areaDisplayLabel(area) : '')}
          </Text>
          {expertsLoading ? (
            <ActivityIndicator size="large" color={GOLD} style={styles.loader} />
          ) : expertsError ? (
            <View style={styles.errorBlock}>
              <Text style={styles.errorText}>{expertsError}</Text>
              <TouchableOpacity onPress={() => void loadExperts()} activeOpacity={0.85}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : experts.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyText}>No guides available for this area yet.</Text>
            </View>
          ) : (
            experts.map((item) => {
              const selected = expert?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.expertCard, selected && styles.expertCardSelected]}
                  onPress={() => setExpert(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.expertAvatar}>
                    {avatarImageSource(item.imageUrl ?? '') ? (
                      <Image
                        source={avatarImageSource(item.imageUrl ?? '')!}
                        style={styles.expertAvatarImage}
                        contentFit="cover"
                        cachePolicy={AVATAR_IMAGE_CACHE}
                        transition={0}
                      />
                    ) : (
                      <Ionicons name="person" size={28} color={GREY_LABEL} />
                    )}
                  </View>
                  <View style={styles.expertBody}>
                    <Text style={styles.expertName}>{item.name}</Text>
                    <Text style={styles.expertExp}>{item.experienceLabel}</Text>
                    <Text style={styles.expertSpec}>Specialization: {item.specialty}</Text>
                    <View style={styles.availRow}>
                      <View
                        style={[
                          styles.availDot,
                          { backgroundColor: item.isOnline ? AVAILABLE_GREEN : MUTED_GREY },
                        ]}
                      />
                      <Text style={styles.availText}>
                        {presenceLabel(item.isOnline)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </>
      );
    }

    return (
      <>
        <Text style={styles.stepTitle}>Your Session</Text>
        <View style={styles.summaryCard}>
          <SummaryRow label="Area" value={area ? areaDisplayLabel(area) : '—'} />
          <View style={styles.summaryDivider} />
          <SummaryRow label="Depth" value={depth ? depthDisplayLabel(depth) : '—'} />
          <View style={styles.summaryDivider} />
          <SummaryRow label="Format" value={format ? formatDisplayLabel(format) : '—'} />
          <View style={styles.summaryDivider} />
          <SummaryRow label="Pandit" value={expert?.name ?? '—'} />
          <View style={styles.summaryDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalValue}>{formatRupee(totalPrice)}</Text>
          </View>
        </View>
      </>
    );
  };

  const handleContinue = () => {
    if (!canContinue) return;
    if (step < 5) {
      setStep(
        nextGuidanceStep(step, {
          depth: Boolean(depth),
          format: Boolean(format),
          expert: Boolean(expert),
        }),
      );
      return;
    }
    handleProceedToSlotPicker();
  };

  return (
    <View style={styles.screen}>
      <TabTopHeader title="Guidance" onWalletPress={() => router.push('/wallet')} />
      <KeyboardAvoidingContainer style={styles.body} headerOffset={insets.top + 56}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollInner, { paddingBottom: SCROLL_END_PAD }]}
          keyboardShouldPersistTaps="handled"
        >
          {step <= 4 ? (
            <GuidanceStepper currentStep={step} onStepPress={goToStep} />
          ) : (
            <GuidanceStepper currentStep={5} onStepPress={goToStep} />
          )}
          <EntertainmentDisclaimer compact />
          {renderStepContent()}
        </ScrollView>

        <View style={styles.footer}>
          {step === 1 ? (
            <View style={styles.footerStack}>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.primaryBtnFull, !canContinue && styles.btnDisabled]}
                disabled={!canContinue}
                onPress={() => setStep(guidanceStepAfterArea())}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>{SEE_EXPERTS_LABEL}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.textLinkHit}
                disabled={!canContinue}
                onPress={handleContinue}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={SESSION_LENGTH_FIRST_LABEL}
              >
                <Text style={[styles.textLink, !canContinue && styles.btnDisabledText]}>
                  {SESSION_LENGTH_FIRST_LABEL}
                </Text>
              </TouchableOpacity>
            </View>
          ) : step === 5 ? (
            <>
              <CancellationPolicySummary compact />
              <TouchableOpacity
                style={[styles.primaryBtn, styles.primaryBtnFull]}
                onPress={handleContinue}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Confirm & Proceed</Text>
              </TouchableOpacity>
              <Text style={styles.footerSubtitle}>
                One Complete Session. No Time Pressure.
              </Text>
            </>
          ) : (
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={goBackOneStep}
                activeOpacity={0.85}
              >
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.primaryBtnFlex, !canContinue && styles.btnDisabled]}
                disabled={!canContinue}
                onPress={handleContinue}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>
                  {step === 4 && (!depth || !format) ? CHOOSE_SESSION_LENGTH_LABEL : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingContainer>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  body: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 8,
    flexGrow: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  stepperSegmentWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    minWidth: 0,
  },
  stepperSegmentPressable: {
    flex: 1,
    minWidth: 0,
  },
  stepperSegment: {
    flex: 1,
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  stepperChevron: {
    width: 0,
    height: 0,
    borderTopWidth: 18,
    borderBottomWidth: 18,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: -1,
  },
  stepperLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  stepHint: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED_GREY,
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 16,
  },
  areaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,
  },
  areaTile: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 10,
    backgroundColor: WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CHIP_BORDER,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    minHeight: 88,
    justifyContent: 'center',
  },
  areaTileSelected: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  areaTileLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
  },
  areaTileLabelSelected: {
    color: WHITE,
  },
  optionalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: DEEP_GREY,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: CHIP_BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    fontSize: 14,
    color: TEXT_PRIMARY_DARK,
    marginBottom: 8,
  },
  depthCard: {
    backgroundColor: SOFT_YELLOW,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CHIP_BORDER,
    padding: 14,
    marginBottom: 12,
  },
  depthCardFeatured: {
    borderColor: GOLD,
    borderWidth: 1.5,
  },
  depthCardSelected: {
    borderColor: GOLD,
    borderWidth: 2,
    backgroundColor: WARM_IVORY,
  },
  depthCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  depthCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_PRIMARY_DARK,
  },
  depthCardTitleSelected: {
    color: DEEP_GREY,
  },
  depthPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: DEEP_GREY,
    marginBottom: 4,
  },
  depthCompare: {
    fontSize: 12,
    lineHeight: 16,
    color: MUTED_GREY,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: GOLD,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: WHITE,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  bulletDot: {
    marginRight: 6,
    color: DEEP_GREY,
    fontSize: 14,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: DEEP_GREY,
    lineHeight: 18,
  },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CHIP_BORDER,
    padding: 16,
    marginBottom: 12,
  },
  formatCardSelected: {
    borderColor: GOLD,
    borderWidth: 2,
  },
  formatIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: WARM_IVORY,
    borderWidth: 1,
    borderColor: HEADER_RULE_GREY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  formatCopy: {
    flex: 1,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_PRIMARY_DARK,
  },
  formatSubtitle: {
    fontSize: 13,
    color: GREY_LABEL,
    marginTop: 4,
  },
  rulesHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: DEEP_GREY,
    marginTop: 8,
    marginBottom: 6,
  },
  rulesLine: {
    fontSize: 13,
    color: GREY_LABEL,
    marginBottom: 4,
  },
  expertCard: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CHIP_BORDER,
    padding: 12,
    marginBottom: 10,
  },
  expertCardSelected: {
    borderColor: GOLD,
    borderWidth: 2,
  },
  expertAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: IMAGE_PLACEHOLDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  expertBody: {
    flex: 1,
    minWidth: 0,
  },
  expertName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  expertExp: {
    fontSize: 12,
    color: GREY_LABEL,
    marginTop: 2,
  },
  expertSpec: {
    fontSize: 12,
    fontWeight: '600',
    color: GOLD,
    marginTop: 4,
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  availDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  availText: {
    fontSize: 12,
    color: DEEP_GREY,
  },
  loader: {
    marginVertical: 32,
  },
  errorBlock: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  errorText: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: PAGE_PAD,
  },
  emptyText: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
  },
  expertAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
  },
  summaryCard: {
    backgroundColor: WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CHIP_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: GREY_LABEL,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: HEADER_RULE_GREY,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_PRIMARY_DARK,
  },
  footer: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: FOOTER_PADDING_TOP,
    paddingBottom: FOOTER_PADDING_BOTTOM,
    backgroundColor: BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HEADER_RULE_GREY,
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: SHADOW_BLACK,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
    }),
  },
  footerStack: {
    gap: 8,
  },
  textLinkHit: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textLink: {
    fontSize: 15,
    fontWeight: '600',
    color: GOLD,
    textAlign: 'center',
  },
  btnDisabledText: {
    opacity: 0.4,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footerSubtitle: {
    textAlign: 'center',
    fontSize: 12,
    color: GREY_LABEL,
    marginTop: 8,
  },
  backBtn: {
    flex: 1,
    height: FOOTER_HEIGHT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CHIP_BORDER,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: DEEP_GREY,
  },
  primaryBtn: {
    height: FOOTER_HEIGHT,
    borderRadius: 8,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnFull: {
    width: '100%',
  },
  primaryBtnFlex: {
    flex: 1.4,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
  },
});

