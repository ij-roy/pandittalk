import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import { Image } from 'expo-image';
import { Link, router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvailabilityStatus } from '../../components/AvailabilityStatus';
import { KeyboardAvoidingContainer } from '../../components/KeyboardAwareScreen';
import { TabTopHeader } from '../../components/TabTopHeader';
import { SearchBar } from '../../components/SearchBar';
import { formatInr } from '@/lib/bookingPricing';
import { AnimatedPressable } from '../../components/ui/AnimatedPressable';
import { ScreenBackground } from '../../components/ui/ScreenBackground';
import { SkeletonCard } from '../../components/ui/Skeleton';
import {
  AVAILABLE_GREEN,
  BLACK,
  BUSY_AMBER,
  CHIP_BORDER,
  DEEP_GREY,
  FILTER_ACTIVE,
  FILTER_CHIP_ACCENT,
  GOLD,
  GOLD_BORDER,
  GOLD_GLOW,
  GOLD_RING_BORDER,
  GREY_LABEL,
  HEADER_RULE_GREY,
  MUTED_GREY,
  PLACEHOLDER_GREY,
  SCRIM_BLACK,
  SHADOW_BLACK,
  STATUS_ONLINE,
  TEXT_PRIMARY_DARK,
  WHITE,
} from '../../constants/Colors';
import { shadowCard } from '../../constants/Shadows';
import { PAGE_PAD, TAB_BAR_CLEARANCE } from '../../constants/Spacing';
import { getUserBookings, type Booking } from '../../lib/bookingApi';
import { bookingDurationMinutes } from '../../lib/bookingPricing';
import { getCallBookingStatus, getCallRoute } from '../../lib/callBookingStatus';
import { LATE_PANDIT_COMPENSATION } from '@/lib/waitingRoomEta';
import { getChatBookingStatus, getChatRouteParams } from '../../lib/chatBookingStatus';
import { fetchExperts, fetchFollowedExperts, type ExpertEntity } from '../../lib/expertsApi';
import { AVATAR_IMAGE_CACHE, avatarImageSource, avatarUrls } from '../../lib/avatarImageCache';
import { HOME_LIST_WINDOW } from '../../lib/listUiWork';
import {
  canBookAvSessions,
  canJoinAvSessions,
} from '../../lib/iosStorePolicy';
import { getBlockedPanditIds, syncBlockedPanditIds } from '../../lib/blockedPandits';
import { useAuthStore } from '../../store/useAuthStore';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useUserProfile } from '../../hooks/useUserProfile';

/** Horizontal padding aligned with app-wide screen content */

const AVATAR = 54;

function toCallPayload(booking: Booking) {
  return {
    ...booking,
    panditName: booking.panditName ?? '',
    startTime: booking.startTime,
    durationMinutes: bookingDurationMinutes(booking.depth),
  };
}

export type ExpertCategoryFilterId =
  | 'all'
  | 'career_business'
  | 'love_relationships'
  | 'finance_wealth'
  | 'marriage_family'
  | 'legal_advice'
  | 'health_wellbeing'
  | 'life_path'
  | 'spiritual_protection';

const CATEGORY_LABEL: Record<ExpertCategoryFilterId, string> = {
  career_business: 'Career & Business',
  love_relationships: 'Love & Relationships',
  finance_wealth: 'Finance & Wealth',
  marriage_family: 'Marriage & Family',
  legal_advice: 'Legal Advice',
  health_wellbeing: 'Health & Wellbeing',
  life_path: 'Life Path',
  spiritual_protection: 'Spiritual Protection',
  all: 'All',
};

/** Dropdown order: business categories only ("All" is a separate control). */
const DROPDOWN_ORDER: ExpertCategoryFilterId[] = [
  'career_business',
  'love_relationships',
  'finance_wealth',
  'marriage_family',
  'legal_advice',
  'health_wellbeing',
  'life_path',
  'spiritual_protection',
];

const SORT_OPTIONS = [
  'Price: Low to High',
  'Price: High to Low',
  'Experience: High to Low',
  'Rating: High to Low',
  'Most Reviews',
] as const;


type QuickFilterChip =
  | { kind: 'following'; label: string }
  | { kind: 'premium'; label: string }
  | { kind: 'category'; id: ExpertCategoryFilterId; label: string };

/** Horizontal filter chips. Topic names match the filter menu and the home screen. */
const QUICK_FILTER_CHIPS: QuickFilterChip[] = [
  { kind: 'following', label: 'Following' },
  { kind: 'premium', label: 'Premium' },
  ...DROPDOWN_ORDER.map(
    (id): QuickFilterChip => ({ kind: 'category', id, label: CATEGORY_LABEL[id] }),
  ),
];

/** Tailwind blue-600 — active "All" reset state */

type MatchableId = Exclude<ExpertCategoryFilterId, 'all'>;

/** Match backend `category` / `specialty` text when not an exact label hit. */
const CATEGORY_MATCH: Record<MatchableId, RegExp> = {
  career_business: /(career|business|job|corporate|vocation|professional|work)/i,
  love_relationships: /(love|relationship|dating|romance|heartbreak|heart break|partner)/i,
  finance_wealth: /(finance|wealth|money|investment|financial|prosperity)/i,
  marriage_family: /(marriage|family|marital|spouse|children|parent|wedding)/i,
  legal_advice: /(legal|law|litigation|court|compliance|advocate)/i,
  health_wellbeing: /(health|wellbeing|well-being|wellness|medical|healing|body)/i,
  life_path: /(life path|lifepath|numerology|destiny|purpose|karma)/i,
  spiritual_protection: /(spiritual|protection|vastu|tantra|evil eye|negative energy|shield|aura|remedy)/i,
};

function normalizeLabel(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s*&\s*/g, ' and ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sortExpertsCopy(list: ExpertEntity[], activeSort: string | null): ExpertEntity[] {
  if (!activeSort) return list;
  const copy = [...list];
  switch (activeSort) {
    case 'Price: Low to High':
      copy.sort((a, b) => a.pricePerSession - b.pricePerSession);
      break;
    case 'Price: High to Low':
      copy.sort((a, b) => b.pricePerSession - a.pricePerSession);
      break;
    case 'Experience: High to Low':
      copy.sort((a, b) => b.experienceYears - a.experienceYears);
      break;
    case 'Rating: High to Low':
      copy.sort((a, b) => b.ratingDisplay - a.ratingDisplay || b.rating - a.rating);
      break;
    case 'Most Reviews':
      copy.sort((a, b) => b.totalReviews - a.totalReviews);
      break;
    default:
      break;
  }
  return copy;
}

const anchorDropdownStyles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SCRIM_BLACK,
  },
  panel: {
    position: 'absolute',
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: GOLD_BORDER,
    ...Platform.select({
      ios: {
        shadowColor: SHADOW_BLACK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  scrollContent: {
    paddingVertical: 4,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HEADER_RULE_GREY,
  },
  rowSelected: {
    backgroundColor: GOLD_GLOW,
  },
  rowLabel: {
    fontSize: 15,
    color: DEEP_GREY,
    fontWeight: '500',
  },
  rowLabelSelected: {
    fontWeight: '700',
    color: BLACK,
  },
});

type AnchorRect = { x: number; y: number; width: number; height: number };

const DROPDOWN_BELOW_GAP = 6;

function computeDropdownLayout(
  anchor: AnchorRect,
  insetsBottom: number,
  minPanelWidth: number,
): { top: number; left: number; width: number; maxHeight: number } {
  const { width: sw, height: sh } = Dimensions.get('window');
  const top = anchor.y + anchor.height + DROPDOWN_BELOW_GAP;
  const panelW = Math.min(Math.max(anchor.width, minPanelWidth), sw - PAGE_PAD * 2);
  const left = Math.max(PAGE_PAD, Math.min(anchor.x, sw - PAGE_PAD - panelW));
  const maxHeight = Math.max(160, sh - top - Math.max(insetsBottom, 12) - 8);
  return { top, left, width: panelW, maxHeight };
}

type AnchorDropdownModalProps = {
  visible: boolean;
  anchor: AnchorRect | null;
  onRequestClose: () => void;
  minPanelWidth: number;
  children: React.ReactNode;
};

function AnchorDropdownModal({
  visible,
  anchor,
  onRequestClose,
  minPanelWidth,
  children,
}: AnchorDropdownModalProps) {
  const insets = useSafeAreaInsets();
  const layout =
    anchor != null
      ? computeDropdownLayout(anchor, insets.bottom, minPanelWidth)
      : { top: 0, left: 0, width: 0, maxHeight: 0 };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      {visible && anchor != null ? (
        <View style={anchorDropdownStyles.modalRoot}>
          <Pressable style={anchorDropdownStyles.backdrop} onPress={onRequestClose} />
          <View
            style={[
              anchorDropdownStyles.panel,
              {
                top: layout.top,
                left: layout.left,
                width: layout.width,
                maxHeight: layout.maxHeight,
              },
            ]}
            pointerEvents="box-none"
          >
            <ScrollView
              style={{ maxHeight: layout.maxHeight }}
              contentContainerStyle={anchorDropdownStyles.scrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              {children}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

function formatExpertCategoryLabel(category: string | null): string | null {
  const raw = (category ?? '').trim();
  if (!raw) return null;
  const normalized = normalizeLabel(raw);
  for (const [id, label] of Object.entries(CATEGORY_LABEL)) {
    if (id === 'all') continue;
    const key = normalizeLabel(label);
    if (normalized === key || normalized.includes(key) || key.includes(normalized)) {
      return label;
    }
  }
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function expertMatchesCategory(expert: ExpertEntity, filterId: ExpertCategoryFilterId): boolean {
  if (filterId === 'all') return true;

  const target = normalizeLabel(CATEGORY_LABEL[filterId]);
  const catRaw = (expert.category ?? '').trim();
  if (catRaw) {
    const c = normalizeLabel(catRaw);
    if (c === target || c.includes(target) || target.includes(c)) return true;
  }

  const blob = normalizeLabel(`${expert.category ?? ''} ${expert.specialty}`);
  return CATEGORY_MATCH[filterId].test(blob);
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

type ExpertCardProps = {
  expert: ExpertEntity;
  callReadyBookings: ReturnType<typeof toCallPayload>[];
  bookings: Booking[];
};

function ExpertCard({ expert, callReadyBookings, bookings }: ExpertCardProps) {
  const categoryLabel = formatExpertCategoryLabel(expert.category);
  const showTags = expert.isPremium || Boolean(categoryLabel);
  const callStatus = getCallBookingStatus(callReadyBookings, expert.id);
  const chatStatus = getChatBookingStatus(bookings, expert.id);

  const callPill =
    !canJoinAvSessions()
      ? null
      : callStatus.state === 'active' || callStatus.state === 'waitingRoom' ? (
      <Pressable
        style={styles.callPillActive}
        onPress={(e) => {
          e.stopPropagation();
          router.push({
            pathname: getCallRoute(callStatus.booking),
            params: { bookingId: callStatus.booking.id, panditName: expert.name },
          });
        }}
      >
        <Text style={styles.callPillActiveText}>
          {callStatus.state === 'waitingRoom'
            ? 'Join Waiting Room'
            : callStatus.booking.format === 'audio'
              ? '📞 Call Now'
              : '📹 Call Now'}
        </Text>
      </Pressable>
    ) : callStatus.state === 'soon' ? (
      <View style={styles.callPillSoon}>
        <Text style={styles.callPillSoonText}>
          {`Call in ${Math.max(1, Math.ceil((callStatus.startsAt.getTime() - Date.now()) / 60000))} min`}
        </Text>
      </View>
    ) : null;

  const avatar = avatarImageSource(expert.imageUrl ?? '');

  return (
    <Link href={`/experts/${expert.id}` as Href} asChild>
      <AnimatedPressable style={styles.card}>
        <View style={styles.cardInner}>
          <View style={styles.leftCol}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                {avatar ? (
                  <Image
                    source={avatar}
                    style={styles.avatarImage}
                    contentFit="cover"
                    cachePolicy={AVATAR_IMAGE_CACHE}
                    recyclingKey={expert.id}
                    transition={0}
                  />
                ) : null}
              </View>
              <View
                style={[
                  styles.avatarStatusDot,
                  expert.isOnline ? styles.avatarStatusDotOnline : styles.avatarStatusDotAway,
                ]}
                accessible={false}
              />
            </View>
            <StarRow count={expert.rating} />
            <Text style={styles.reviewCount}>{expert.reviewCountLabel}</Text>
          </View>

          <View style={styles.cardBody}>
            {expert.verified ? (
              <View style={styles.verifiedBadge} accessibilityLabel="Verified">
                <Ionicons name="checkmark" size={9} color={WHITE} />
              </View>
            ) : null}

            <Text style={styles.name} numberOfLines={1}>
              {expert.name}
            </Text>
            <Text style={styles.spec}>{expert.specialty}</Text>
            <Text style={styles.meta}>{expert.languagesDisplay}</Text>
            <AvailabilityStatus online={expert.isOnline} />
            <Text style={styles.meta}>{expert.experienceLabel}</Text>
            {expert.pricePerSession > 0 ? (
              <Text style={styles.price}>Chat from ₹{formatInr(expert.pricePerSession)}</Text>
            ) : null}

            {showTags ? (
              <View style={styles.tagRow}>
                {expert.isPremium ? (
                  <View style={[styles.tag, styles.tagPremium]}>
                    <Text style={[styles.tagText, styles.tagTextPremium]}>Premium</Text>
                  </View>
                ) : null}
                {categoryLabel ? (
                  <View style={styles.tag}>
                    <Text style={styles.tagText} numberOfLines={1}>
                      {categoryLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {expert.bio ? (
              <Text style={styles.bioSnippet} numberOfLines={2} ellipsizeMode="tail">
                {expert.bio}
              </Text>
            ) : null}

            <View style={styles.actionCol}>
              {chatStatus.state !== 'none' ? (
                <Pressable
                  style={styles.callPillActive}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(getChatRouteParams(chatStatus.booking));
                  }}
                >
                  <Text style={styles.callPillActiveText}>💬 Join Chat</Text>
                </Pressable>
              ) : expert.isOnline ? (
                <AnimatedPressable
                  style={styles.chatBtn}
                  onPress={() => router.push(`/experts/${expert.id}`)}
                >
                  <Text style={styles.chatBtnText}>💬 Chat Now</Text>
                </AnimatedPressable>
              ) : null}
              {callPill}
              {callStatus.state === 'waitingRoom' || chatStatus.state === 'waiting' ? (
                <Text style={styles.latePanditNote}>{LATE_PANDIT_COMPENSATION}</Text>
              ) : null}
              {canBookAvSessions() ? (
                <AnimatedPressable
                  style={styles.guidanceBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push({
                      pathname: '/experts/[id]',
                      params: { id: expert.id, openBook: '1' },
                    });
                  }}
                >
                  <Text style={styles.guidanceBtnText}>Book Session</Text>
                </AnimatedPressable>
              ) : null}
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Link>
  );
}

const NO_EXPERTS_MSG = 'No pandits are available right now';

export default function ExpertsScreen() {
  const insets = useSafeAreaInsets();
  const routeParams = useLocalSearchParams<{ area?: string; search?: string }>();
  const { greetingTitle } = useUserProfile();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [allExperts, setAllExperts] = useState<ExpertEntity[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterAnchor, setFilterAnchor] = useState<AnchorRect | null>(null);
  const [sortAnchor, setSortAnchor] = useState<AnchorRect | null>(null);
  const [activeFilter, setActiveFilter] = useState<ExpertCategoryFilterId>('all');
  const [activeSort, setActiveSort] = useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = useState<string | null>(null);
  const [premiumFilterActive, setPremiumFilterActive] = useState(false);
  const [followingOnly, setFollowingOnly] = useState(false);
  const [followedExperts, setFollowedExperts] = useState<ExpertEntity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const routeArea = typeof routeParams.area === 'string' ? routeParams.area : '';
  const routeSearch = typeof routeParams.search === 'string' ? routeParams.search : '';

  useEffect(() => {
    if (routeArea && routeArea in CATEGORY_LABEL && routeArea !== 'all') {
      setActiveFilter(routeArea as ExpertCategoryFilterId);
    }
    if (routeSearch) setSearchQuery(routeSearch);
  }, [routeArea, routeSearch]);
  const debouncedSearch = useDebouncedValue(searchQuery, 400);
  const filterTriggerWrapRef = useRef<View>(null);
  const sortTriggerWrapRef = useRef<View>(null);
  const hasLoadedOnceRef = useRef(false);

  const callReadyBookings = useMemo(() => bookings.map(toCallPayload), [bookings]);

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

  const loadFollowed = useCallback(async () => {
    if (!accessToken) {
      setFollowedExperts([]);
      return;
    }
    try {
      const data = await fetchFollowedExperts(accessToken);
      const blocked = await getBlockedPanditIds();
      const blockedSet = new Set(blocked);
      setFollowedExperts(blockedSet.size ? data.filter((e) => !blockedSet.has(e.id)) : data);
      void Image.prefetch(
        avatarUrls((blockedSet.size ? data.filter((e) => !blockedSet.has(e.id)) : data).map((expert) => expert.imageUrl)),
      );
    } catch {
      setFollowedExperts([]);
    }
  }, [accessToken]);

  const loadExperts = useCallback(
    async (opts?: { refreshOnly?: boolean }) => {
      const refreshOnly = opts?.refreshOnly ?? false;
      if (refreshOnly) setRefreshing(true);
      else setLoading(true);
      setLoadFailed(false);
      try {
        const data = await fetchExperts({
          search: debouncedSearch || undefined,
          area: activeFilter === 'all' ? undefined : activeFilter,
        });
        const blocked = await syncBlockedPanditIds(accessToken);
        const blockedSet = new Set(blocked);
        const visible = blockedSet.size ? data.filter((e) => !blockedSet.has(e.id)) : data;
        setAllExperts(visible);
        void Image.prefetch(avatarUrls(visible.map((expert) => expert.imageUrl)));
      } catch (e) {
        setAllExperts([]);
        setLoadFailed(true);
        if (__DEV__ && isAxiosError(e)) {
          // eslint-disable-next-line no-console
          console.warn('[experts] fetch failed', e.message, e.response?.status);
        }
      } finally {
        hasLoadedOnceRef.current = true;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [debouncedSearch, activeFilter, accessToken],
  );

  useFocusEffect(
    useCallback(() => {
      void loadBookings();
      void loadFollowed();
      void loadExperts(hasLoadedOnceRef.current ? { refreshOnly: true } : undefined);
      const timer = setInterval(() => {
        void loadExperts({ refreshOnly: true });
      }, 30_000);
      return () => clearInterval(timer);
    }, [loadBookings, loadExperts, loadFollowed]),
  );

  useEffect(() => {
    void loadExperts();
  }, [loadExperts]);

  const onRefresh = useCallback(() => {
    void loadExperts({ refreshOnly: true });
    void loadBookings();
    void loadFollowed();
  }, [loadExperts, loadBookings, loadFollowed]);

  const filteredExperts = useMemo(() => {
    let list = allExperts;
    if (premiumFilterActive) {
      list = list.filter((e) => e.isPremium);
    }
    if (activeFilter === 'all') {
      list = list.filter((e) => expertMatchesCategory(e, activeFilter));
    }
    if (languageFilter) {
      const wanted = languageFilter.toLowerCase();
      list = list.filter((e) =>
        e.languages.some((lang) => lang.toLowerCase() === wanted),
      );
    }
    return list;
  }, [allExperts, premiumFilterActive, activeFilter, languageFilter]);

  const languageOptions = useMemo(() => {
    const names = new Set<string>();
    for (const expert of allExperts) {
      for (const lang of expert.languages) names.add(lang);
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'en'));
  }, [allExperts]);

  const sortedFilteredExperts = useMemo(
    () => sortExpertsCopy(filteredExperts, activeSort),
    [filteredExperts, activeSort],
  );

  const sortedFollowedExperts = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = q
      ? followedExperts.filter(
          (e) =>
            e.name.toLowerCase().includes(q) || e.specialty.toLowerCase().includes(q),
        )
      : followedExperts;
    return sortExpertsCopy(list, activeSort);
  }, [followedExperts, debouncedSearch, activeSort]);

  const listData = followingOnly
    ? sortedFollowedExperts
    : loadFailed || allExperts.length === 0
      ? []
      : sortedFilteredExperts;
  const showEmptyBackend = !loading && loadFailed;
  const showEmptyFilter =
    !loading && !loadFailed && allExperts.length > 0 && filteredExperts.length === 0;

  const onPickCategory = (id: ExpertCategoryFilterId) => {
    setActiveFilter(id);
    setFilterModalVisible(false);
    setFilterAnchor(null);
  };

  const onPickSort = (label: string) => {
    setActiveSort(label);
    setSortModalVisible(false);
    setSortAnchor(null);
  };

  const closeFilterMenu = () => {
    setFilterModalVisible(false);
    setFilterAnchor(null);
  };

  const closeSortMenu = () => {
    setSortModalVisible(false);
    setSortAnchor(null);
  };

  const openFilterMenu = () => {
    setSortModalVisible(false);
    setSortAnchor(null);
    filterTriggerWrapRef.current?.measureInWindow((x, y, w, h) => {
      setFilterAnchor({ x, y, width: w, height: h });
      setFilterModalVisible(true);
    });
  };

  const openSortMenu = () => {
    setFilterModalVisible(false);
    setFilterAnchor(null);
    sortTriggerWrapRef.current?.measureInWindow((x, y, w, h) => {
      setSortAnchor({ x, y, width: w, height: h });
      setSortModalVisible(true);
    });
  };

  const resetFilterAndSort = () => {
    setSearchQuery('');
    setActiveFilter('all');
    setActiveSort(null);
    setLanguageFilter(null);
    setPremiumFilterActive(false);
    setFollowingOnly(false);
    setFilterModalVisible(false);
    setFilterAnchor(null);
    setSortModalVisible(false);
    setSortAnchor(null);
  };

  const allResetActive =
    activeFilter === 'all' &&
    activeSort === null &&
    !premiumFilterActive &&
    languageFilter === null &&
    !followingOnly;

  const onQuickFilterChipPress = (chip: QuickFilterChip) => {
    if (chip.kind === 'following') {
      if (!accessToken) {
        Alert.alert('Sign in to follow', 'Followed pandits stay on this account.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Sign in', onPress: () => router.push('/login') },
        ]);
        return;
      }
      setFollowingOnly((v) => !v);
      return;
    }
    if (chip.kind === 'premium') {
      setPremiumFilterActive((v) => !v);
      return;
    }
    setActiveFilter((prev) => (prev === chip.id ? 'all' : chip.id));
  };

  const isQuickFilterChipActive = (chip: QuickFilterChip): boolean => {
    if (chip.kind === 'following') return followingOnly;
    if (chip.kind === 'premium') return premiumFilterActive;
    return activeFilter === chip.id;
  };

  return (
    <ScreenBackground>
      <TabTopHeader title={greetingTitle} onWalletPress={() => router.push('/wallet')} />
      <KeyboardAvoidingContainer style={styles.flex} headerOffset={insets.top + 56}>
      <View style={styles.headerArea}>
        <View style={styles.searchRow}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search pandits by name or specialty…"
          />
        </View>

        <View style={styles.actionBarRow}>
          <View ref={filterTriggerWrapRef} collapsable={false}>
            <AnimatedPressable
              style={[styles.filterTrigger, styles.actionBarCtlSpacing]}
              onPress={openFilterMenu}
              accessibilityRole="button"
              accessibilityLabel="Open category filter"
            >
              <Ionicons name="filter" size={16} color={DEEP_GREY} style={styles.filterTriggerIcon} />
              <Text style={styles.filterTriggerLabel}>Filter</Text>
              <Ionicons name="chevron-down" size={16} color={GREY_LABEL} />
            </AnimatedPressable>
          </View>
          <View ref={sortTriggerWrapRef} collapsable={false}>
            <AnimatedPressable
              style={[styles.filterTrigger, styles.sortTrigger, styles.actionBarCtlSpacing]}
              onPress={openSortMenu}
              accessibilityRole="button"
              accessibilityLabel="Open sort options"
            >
              <Ionicons
                name="swap-vertical"
                size={16}
                color={DEEP_GREY}
                style={styles.filterTriggerIcon}
              />
              <Text style={styles.filterTriggerLabel} numberOfLines={1}>
                {activeSort ?? 'Sort'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={GREY_LABEL} />
            </AnimatedPressable>
          </View>
          <View style={styles.actionBarDivider} />
          <AnimatedPressable
            onPress={resetFilterAndSort}
            accessibilityRole="button"
            accessibilityLabel="Show all experts and clear sort"
          >
            <Text style={[styles.allTextButton, allResetActive && styles.allTextButtonActive]}>
              All
            </Text>
          </AnimatedPressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScrollContent}
          style={styles.chipScroll}
        >
          {QUICK_FILTER_CHIPS.map((chip) => {
            const active = isQuickFilterChipActive(chip);
            const key =
              chip.kind === 'category' ? `cat-${chip.id}` : chip.kind;
            return (
              <AnimatedPressable
                key={key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => onQuickFilterChipPress(chip)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={
                  chip.kind === 'category' ? `Topic ${chip.label}` : chip.label
                }
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {chip.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>

        {languageOptions.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScrollContent}
            style={styles.chipScroll}
          >
            <AnimatedPressable
              style={[styles.filterChip, languageFilter === null && styles.filterChipActive]}
              onPress={() => setLanguageFilter(null)}
              accessibilityRole="button"
              accessibilityState={{ selected: languageFilter === null }}
              accessibilityLabel="All languages"
            >
              <Text
                style={[
                  styles.filterChipText,
                  languageFilter === null && styles.filterChipTextActive,
                ]}
              >
                All languages
              </Text>
            </AnimatedPressable>
            {languageOptions.map((lang) => {
              const active = languageFilter === lang;
              return (
                <AnimatedPressable
                  key={lang}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setLanguageFilter(active ? null : lang)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Language ${lang}`}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {lang}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      {loading && !refreshing ? (
        <View style={styles.listLoading}>
          <SkeletonCard showAvatar lines={3} />
          <SkeletonCard showAvatar lines={3} />
          <SkeletonCard showAvatar lines={3} />
        </View>
      ) : showEmptyBackend && !followingOnly ? (
        <View style={styles.listLoading}>
          <Text style={styles.emptyMainText}>Could not load pandits. Check your connection and try again.</Text>
          <Pressable
            style={styles.emptyAction}
            onPress={onRefresh}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.emptyActionText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={HOME_LIST_WINDOW.initialNumToRender}
          maxToRenderPerBatch={HOME_LIST_WINDOW.maxToRenderPerBatch}
          windowSize={HOME_LIST_WINDOW.windowSize}
          updateCellsBatchingPeriod={HOME_LIST_WINDOW.updateCellsBatchingPeriod}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
          }
          ListEmptyComponent={
            followingOnly ? (
              <View style={styles.emptyBlock}>
                <Text style={styles.emptyText}>You have not followed a pandit yet.</Text>
                <Pressable
                  style={styles.emptyAction}
                  onPress={resetFilterAndSort}
                  accessibilityRole="button"
                  accessibilityLabel="See all pandits"
                >
                  <Text style={styles.emptyActionText}>See all pandits</Text>
                </Pressable>
              </View>
            ) : showEmptyFilter ? (
              <View style={styles.emptyBlock}>
                <Text style={styles.emptyText}>No pandits match the selected filters.</Text>
                <Pressable
                  style={styles.emptyAction}
                  onPress={resetFilterAndSort}
                  accessibilityRole="button"
                  accessibilityLabel="Clear filters"
                >
                  <Text style={styles.emptyActionText}>Clear filters</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.emptyBlock}>
                <Text style={styles.emptyText}>{NO_EXPERTS_MSG}</Text>
                <Pressable
                  style={styles.emptyAction}
                  onPress={onRefresh}
                  accessibilityRole="button"
                  accessibilityLabel="Refresh pandits"
                >
                  <Text style={styles.emptyActionText}>Refresh</Text>
                </Pressable>
                <Pressable
                  style={styles.emptyAction}
                  onPress={() => router.push('/(tabs)/tools')}
                  accessibilityRole="button"
                  accessibilityLabel="Browse free tools"
                >
                  <Text style={styles.emptyActionText}>Browse free tools</Text>
                </Pressable>
              </View>
            )
          }
          renderItem={({ item }) => (
            <ExpertCard expert={item} callReadyBookings={callReadyBookings} bookings={bookings} />
          )}
        />
      )}
      </KeyboardAvoidingContainer>

      <AnchorDropdownModal
        visible={filterModalVisible}
        anchor={filterAnchor}
        onRequestClose={closeFilterMenu}
        minPanelWidth={260}
      >
        {DROPDOWN_ORDER.map((id, index) => {
          const selected = activeFilter === id;
          const isLast = index === DROPDOWN_ORDER.length - 1;
          return (
            <AnimatedPressable
              key={id}
              style={[
                anchorDropdownStyles.row,
                !isLast && anchorDropdownStyles.rowBorder,
                selected && anchorDropdownStyles.rowSelected,
              ]}
              onPress={() => onPickCategory(id)}
            >
              <Text
                style={[
                  anchorDropdownStyles.rowLabel,
                  selected && anchorDropdownStyles.rowLabelSelected,
                ]}
              >
                {CATEGORY_LABEL[id]}
              </Text>
            </AnimatedPressable>
          );
        })}
      </AnchorDropdownModal>

      <AnchorDropdownModal
        visible={sortModalVisible}
        anchor={sortAnchor}
        onRequestClose={closeSortMenu}
        minPanelWidth={288}
      >
        {SORT_OPTIONS.map((label, index) => {
          const selected = activeSort === label;
          const isLast = index === SORT_OPTIONS.length - 1;
          return (
            <AnimatedPressable
              key={label}
              style={[
                anchorDropdownStyles.row,
                !isLast && anchorDropdownStyles.rowBorder,
                selected && anchorDropdownStyles.rowSelected,
              ]}
              onPress={() => onPickSort(label)}
            >
              <Text
                style={[
                  anchorDropdownStyles.rowLabel,
                  selected && anchorDropdownStyles.rowLabelSelected,
                ]}
              >
                {label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </AnchorDropdownModal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  headerArea: {
    backgroundColor: 'transparent',
    paddingHorizontal: PAGE_PAD,
    paddingTop: 8,
    paddingBottom: 8,
  },

  searchRow: {
    marginBottom: 10,
  },

  actionBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionBarCtlSpacing: {
    marginRight: 10,
  },

  actionBarDivider: {
    width: 1,
    height: 24,
    backgroundColor: CHIP_BORDER,
    marginHorizontal: 12,
    flexShrink: 0,
  },

  allTextButton: {
    fontSize: 14,
    fontWeight: '500',
    color: GREY_LABEL,
  },

  allTextButtonActive: {
    color: FILTER_ACTIVE,
    fontWeight: '700',
  },

  filterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: CHIP_BORDER,
    backgroundColor: WHITE,
    flexShrink: 0,
  },
  sortTrigger: {
    flexShrink: 1,
    maxWidth: 200,
  },

  filterTriggerIcon: {
    marginRight: 6,
  },

  filterTriggerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: DEEP_GREY,
    marginRight: 4,
  },

  chipScroll: {
    marginTop: 10,
    marginHorizontal: -PAGE_PAD,
  },

  chipScrollContent: {
    paddingHorizontal: PAGE_PAD,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: CHIP_BORDER,
    backgroundColor: WHITE,
  },

  filterChipActive: {
    borderColor: FILTER_CHIP_ACCENT,
    backgroundColor: GOLD_GLOW,
  },

  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: DEEP_GREY,
  },

  filterChipTextActive: {
    color: FILTER_CHIP_ACCENT,
    fontWeight: '700',
  },

  listLoading: {
    flex: 1,
    paddingHorizontal: PAGE_PAD,
    paddingTop: 10,
    gap: 4,
  },

  emptyMainText: {
    textAlign: 'center',
    color: GREY_LABEL,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },

  emptyText: {
    textAlign: 'center',
    color: GREY_LABEL,
    fontSize: 14,
    paddingTop: 24,
  },

  emptyBlock: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  emptyAction: {
    marginTop: 12,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyActionText: {
    color: GOLD,
    fontSize: 15,
    fontWeight: '600',
  },

  listContent: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 10,
    paddingBottom: TAB_BAR_CLEARANCE,
    flexGrow: 1,
  },

  card: {
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: GOLD_BORDER,
    padding: 12,
    marginBottom: 10,
    ...shadowCard,
  },

  cardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  leftCol: {
    width: AVATAR + 8,
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },

  avatarWrap: {
    width: AVATAR,
    height: AVATAR,
    marginBottom: 6,
    position: 'relative',
  },

  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: PLACEHOLDER_GREY,
    overflow: 'hidden',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  avatarStatusDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: WHITE,
  },

  avatarStatusDotOnline: {
    backgroundColor: STATUS_ONLINE,
    shadowColor: STATUS_ONLINE,
    shadowOpacity: 0.55,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },

  avatarStatusDotAway: {
    backgroundColor: BUSY_AMBER,
  },

  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 3,
    gap: 0,
  },

  star: {
    fontSize: 13,
    color: DEEP_GREY,
  },

  starFilled: {
    color: GOLD_RING_BORDER,
  },

  reviewCount: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
  },

  cardBody: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
    paddingTop: 0,
  },

  verifiedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: AVAILABLE_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },

  name: {
    fontSize: 14,
    fontWeight: '700',
    color: BLACK,
    marginBottom: 4,
    paddingRight: 24,
  },

  spec: {
    fontSize: 11,
    color: GREY_LABEL,
    fontWeight: '500',
    marginBottom: 3,
    lineHeight: 15,
  },

  meta: {
    fontSize: 10,
    color: GREY_LABEL,
    marginBottom: 2,
    lineHeight: 14,
  },
  price: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 2,
  },

  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
    marginBottom: 2,
  },

  tag: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.05)',
    maxWidth: '100%',
  },

  tagPremium: {
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
  },

  tagText: {
    fontSize: 9,
    fontWeight: '600',
    color: GREY_LABEL,
  },

  tagTextPremium: {
    color: GOLD,
  },

  bioSnippet: {
    marginTop: 4,
    fontSize: 10,
    color: DEEP_GREY,
    lineHeight: 14,
    fontWeight: '400',
  },

  actionCol: {
    marginTop: 8,
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    gap: 6,
    maxWidth: '100%',
  },

  guidanceBtn: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: WHITE,
  },

  guidanceBtnText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '700',
  },

  chatBtn: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: WHITE,
  },

  chatBtnText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '700',
  },

  callPillActive: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: GOLD,
  },

  callPillActiveText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '700',
  },
  latePanditNote: {
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_PRIMARY_DARK,
  },

  callPillSoon: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderWidth: 1,
    borderColor: MUTED_GREY,
  },

  callPillSoonText: {
    color: MUTED_GREY,
    fontSize: 12,
    fontWeight: '600',
  },
});
