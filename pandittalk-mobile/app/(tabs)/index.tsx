import { type Href, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArticleCard } from '../../components/ArticleCard';
import { KeyboardAwareFlatList } from '../../components/KeyboardAwareScreen';
import { PremiumCard } from '../../components/premium-auth-ui';
import { ProfileProgressCard } from '../../components/ProfileProgressCard';
import { SearchBar } from '../../components/SearchBar';
import { TabTopHeader } from '../../components/TabTopHeader';
import { AccentTile } from '../../components/ui/AccentTile';
import { AnimatedPressable } from '../../components/ui/AnimatedPressable';
import { HeroBanner } from '../../components/ui/HeroBanner';
import { ScreenBackground } from '../../components/ui/ScreenBackground';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { GUIDANCE_HOME_HINT } from '@/lib/guidanceEntry';
import { HOME_LIST_WINDOW } from '@/lib/listUiWork';
import { SkeletonCard } from '../../components/ui/Skeleton';
import {
  BLOG_CARD_BORDER,
  DEEP_GREY,
  GOLD,
  GREY_LABEL,
  SURFACE,
} from '../../constants/Colors';
import { type AccentToneKey } from '../../constants/Gradients';
import { shadowElevated } from '../../constants/Shadows';
import { PAGE_PAD, SECTION_GAP, TAB_BAR_CLEARANCE } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useUserProfile } from '../../hooks/useUserProfile';
import { fetchArticles, type ArticleListItem } from '../../lib/articlesApi';
import { getUserProfile } from '../../lib/authApi';
import {
  coerceProfileRecord,
  mergeCoinBalanceIntoRecord,
} from '../../lib/profileUtils';
import { useAuthStore } from '../../store/useAuthStore';

type SvgAssetSource = number;

const guidanceAreas: {
  id: string;
  title: string;
  Icon: SvgAssetSource;
  areaKey: string;
  tone: AccentToneKey;
}[] = [
  {
    id: '1',
    title: 'Career &\nBusiness',
    Icon: require('../../assets/images/Homepageicons/CareerBusiness.png'),
    areaKey: 'career',
    tone: 'gold',
  },
  {
    id: '2',
    title: 'Love &\nRelationships',
    Icon: require('../../assets/images/Homepageicons/LoveRelationships.png'),
    areaKey: 'love',
    tone: 'rose',
  },
  {
    id: '3',
    title: 'Finance &\nWealth',
    Icon: require('../../assets/images/Homepageicons/FinanceWealth.png'),
    areaKey: 'finance',
    tone: 'gold',
  },
  {
    id: '4',
    title: 'Marriage &\nFamily',
    Icon: require('../../assets/images/Homepageicons/MarriageFamily.png'),
    areaKey: 'marriage',
    tone: 'rose',
  },
  {
    id: '5',
    title: 'Legal Advice',
    Icon: require('../../assets/images/Homepageicons/LegalAdvice.png'),
    areaKey: 'business',
    tone: 'indigo',
  },
  {
    id: '6',
    title: 'Health &\nWellbeing',
    Icon: require('../../assets/images/Homepageicons/HealthWellbeing.png'),
    areaKey: 'health',
    tone: 'sage',
  },
  {
    id: '7',
    title: 'Life Path',
    Icon: require('../../assets/images/Homepageicons/LifePath.png'),
    areaKey: 'education',
    tone: 'indigo',
  },
  {
    id: '8',
    title: 'Spiritual\nProtection',
    Icon: require('../../assets/images/Homepageicons/SpiritualProtection.png'),
    areaKey: 'family',
    tone: 'sage',
  },
];

const astrologyTools: { id: string; title: string; Icon: SvgAssetSource; route: Href }[] = [
  {
    id: '1',
    title: 'Basic\nKundli',
    Icon: require('../../assets/images/Homepageicons/BasicKundli.png'),
    route: '/tools/kundli',
  },
  {
    id: '2',
    title: 'Daily\nHoroscope',
    Icon: require('../../assets/images/Homepageicons/DailyHoroscope.png'),
    route: '/tools/horoscope',
  },
  {
    id: '3',
    title: 'Compatibility\nCheck',
    Icon: require('../../assets/images/Homepageicons/CompatibilityCheck.png'),
    route: '/tools/compatibility',
  },
  {
    id: '4',
    title: 'Palmistry',
    Icon: require('../../assets/images/Homepageicons/Palmistry.png'),
    route: '/tools/palm-reading',
  },
];

const FEATURED_COUNT = 4;
const SEARCH_RESULTS_GAP = 4;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { greetingTitle } = useUserProfile();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 400);
  const [searchResults, setSearchResults] = useState<ArticleListItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [resultsTop, setResultsTop] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const headerBlockRef = useRef<View>(null);
  const searchSectionRef = useRef<View>(null);

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  const measureSearchAnchor = useCallback(() => {
    const header = headerBlockRef.current;
    const search = searchSectionRef.current;
    if (!header || !search) return;

    search.measureLayout(
      header,
      (_x, y, _w, h) => {
        setResultsTop(y + h + SEARCH_RESULTS_GAP);
      },
      () => {},
    );
  }, []);

  const loadArticles = useCallback(async () => {
    const res = await fetchArticles({ limit: 8 });
    setArticles(res.articles);
    return res;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await getUserProfile(accessToken);
      const record = coerceProfileRecord(res.data);
      if (record) {
        setUser(mergeCoinBalanceIntoRecord(res.data, record));
      }
    } catch {
      // Keep existing store user on failure.
    }
  }, [accessToken, setUser]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setArticlesError(null);
    try {
      await Promise.all([
        loadArticles().catch((err: unknown) => {
          setArticlesError(err instanceof Error ? err.message : 'Could not load articles.');
          setArticles([]);
        }),
        refreshProfile(),
        debouncedSearch.trim()
          ? fetchArticles({ search: debouncedSearch, limit: 10 })
              .then((res) => setSearchResults(res.articles))
              .catch(() => setSearchResults([]))
          : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadArticles, refreshProfile, debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setArticlesLoading(true);
      setArticlesError(null);
      try {
        await loadArticles();
      } catch (err) {
        if (!cancelled) {
          setArticlesError(err instanceof Error ? err.message : 'Could not load articles.');
          setArticles([]);
        }
      } finally {
        if (!cancelled) setArticlesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadArticles]);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      setSearchLoading(true);
      try {
        const res = await fetchArticles({ search: debouncedSearch, limit: 10 });
        if (!cancelled) setSearchResults(res.articles);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const showResultsPanel = debouncedSearch.trim().length > 0;
  const featuredArticles = useMemo(() => articles.slice(0, FEATURED_COUNT), [articles]);
  const feedArticles = useMemo(() => articles.slice(FEATURED_COUNT), [articles]);

  const listHeader = useMemo(
    () => (
      <View ref={headerBlockRef} style={styles.headerBlock} onLayout={measureSearchAnchor}>
        <View style={styles.heroWrap}>
          <HeroBanner
            edgeToEdge
            eyebrow="Live pandit consultations"
            title="Talk to a verified Pandit"
            subtitle="Start a live chat or book an audio or video consultation with an expert you trust."
            ctaLabel="Browse Pandits"
            onPress={() => router.push('/experts')}
          />
        </View>

        <View style={styles.primaryActions}>
          <AnimatedPressable
            style={styles.chatNowAction}
            onPress={() => router.push('/experts')}
            accessibilityRole="button"
            accessibilityLabel="Chat now with an online pandit"
          >
            <Ionicons name="chatbubbles" size={20} color={SURFACE} />
            <View style={styles.primaryActionCopy}>
              <Text style={styles.chatNowTitle}>Chat Now</Text>
              <Text style={styles.chatNowSubtitle}>Connect with an online pandit</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={SURFACE} />
          </AnimatedPressable>

          <AnimatedPressable
            style={styles.bookAction}
            onPress={() => router.push('/experts')}
            accessibilityRole="button"
            accessibilityLabel="Book a live consultation"
          >
            <Ionicons name="calendar-outline" size={20} color={GOLD} />
            <Text style={styles.bookActionText}>Book chat, audio or video</Text>
          </AnimatedPressable>
        </View>

        <View style={styles.progressWrap}>
          <ProfileProgressCard />
        </View>

        <PremiumCard>
          <View ref={searchSectionRef} style={styles.searchSection} onLayout={measureSearchAnchor}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search journal articles…"
            />
          </View>
        </PremiumCard>

        <SectionHeader title="What would you like to discuss?" />
        <Text style={styles.guidanceHint}>{GUIDANCE_HOME_HINT}</Text>
        <View style={styles.guidanceGrid}>
          {guidanceAreas.map((item) => (
            <AccentTile
              key={item.id}
              title={item.title}
              tone={item.tone}
              icon={item.Icon}
              style={styles.guidanceTile}
              onPress={() =>
                router.push({
                  pathname: '/guidance',
                  params: { area: item.areaKey },
                })
              }
            />
          ))}
        </View>

        <SectionHeader
          title="Helpful reading"
          right={
            <AnimatedPressable hitSlop={8} onPress={() => router.push('/articles')}>
              <Text style={styles.viewAll}>View all</Text>
            </AnimatedPressable>
          }
        />

        {featuredArticles.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredCarousel}
            style={styles.featuredScroll}
          >
            {featuredArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="tile"
                tileSize={160}
                onPress={() => router.push(`/articles/${article.slug}`)}
              />
            ))}
          </ScrollView>
        ) : null}

        {feedArticles.length > 0 ? (
          <Text style={styles.latestLabel}>Latest</Text>
        ) : null}

        <SectionHeader title="Optional self-service tools" />
        <Text style={styles.toolsIntro}>
          Explore these on your own, or talk through your questions with a pandit in a live session.
        </Text>
        <View style={styles.toolsRow}>
          {astrologyTools.map((item) => (
            <AccentTile
              key={item.id}
              title={item.title}
              tone="gold"
              icon={item.Icon}
              iconSize={30}
              iconPlate
              style={styles.toolTile}
              onPress={() => router.push(item.route)}
            />
          ))}
        </View>

        {showResultsPanel ? (
          <View style={[styles.floatingResults, { top: resultsTop }]}>
            {searchLoading ? (
              <View style={styles.searchLoadingRow}>
                <SkeletonCard lines={2} />
              </View>
            ) : searchResults.length === 0 ? (
              <Text style={styles.noResultsText}>No articles found</Text>
            ) : (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                style={styles.floatingResultsScroll}
              >
                {searchResults.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant="compact"
                    onPress={() => {
                      setSearchQuery('');
                      router.push(`/articles/${article.slug}`);
                    }}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}
      </View>
    ),
    [
      searchQuery,
      showResultsPanel,
      searchLoading,
      searchResults,
      featuredArticles,
      feedArticles.length,
      resultsTop,
      measureSearchAnchor,
    ],
  );

  return (
    <ScreenBackground>
      <TabTopHeader title={greetingTitle} onWalletPress={() => router.push('/wallet')} />
      <KeyboardAwareFlatList
        headerOffset={insets.top + 56}
        bottomInset={TAB_BAR_CLEARANCE}
        data={feedArticles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ArticleCard
            article={item}
            variant="feed"
            onPress={() => router.push(`/articles/${item.slug}`)}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          articlesLoading && !refreshing ? (
            <View style={styles.blogLoadingRow}>
              <SkeletonCard showAvatar lines={2} />
              <SkeletonCard showAvatar lines={2} />
              <SkeletonCard showAvatar lines={2} />
            </View>
          ) : articlesError ? (
            <View style={styles.blogEmptyWrap}>
              <Text style={styles.blogEmptyText}>{articlesError}</Text>
              <AnimatedPressable
                onPress={() => {
                  setArticlesLoading(true);
                  setArticlesError(null);
                  void loadArticles()
                    .catch((err: unknown) => {
                      setArticlesError(
                        err instanceof Error ? err.message : 'Could not load articles.',
                      );
                      setArticles([]);
                    })
                    .finally(() => setArticlesLoading(false));
                }}
              >
                <Text style={styles.retryText}>Tap to retry</Text>
              </AnimatedPressable>
            </View>
          ) : featuredArticles.length === 0 ? (
            <Text style={styles.blogEmptyText}>No articles yet.</Text>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={GOLD}
            colors={[GOLD]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={HOME_LIST_WINDOW.initialNumToRender}
        maxToRenderPerBatch={HOME_LIST_WINDOW.maxToRenderPerBatch}
        windowSize={HOME_LIST_WINDOW.windowSize}
        updateCellsBatchingPeriod={HOME_LIST_WINDOW.updateCellsBatchingPeriod}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: PAGE_PAD,
    paddingBottom: 40,
  },

  headerBlock: {
    width: '100%',
    position: 'relative',
  },

  heroWrap: {
    marginHorizontal: -PAGE_PAD,
    marginBottom: SECTION_GAP,
  },
  progressWrap: {
    marginBottom: SECTION_GAP,
  },

  primaryActions: {
    gap: 10,
    marginBottom: SECTION_GAP,
  },
  chatNowAction: {
    alignItems: 'center',
    backgroundColor: GOLD,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 16,
  },
  primaryActionCopy: {
    flex: 1,
  },
  chatNowTitle: {
    ...Typography.body,
    color: SURFACE,
    fontWeight: '800',
  },
  chatNowSubtitle: {
    ...Typography.bodySm,
    color: SURFACE,
    opacity: 0.88,
  },
  bookAction: {
    alignItems: 'center',
    borderColor: GOLD,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  bookActionText: {
    ...Typography.bodySm,
    color: GOLD,
    fontWeight: '700',
  },

  searchSection: {
    position: 'relative',
  },

  floatingResults: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: BLOG_CARD_BORDER,
    maxHeight: 320,
    overflow: 'hidden',
    ...shadowElevated,
    zIndex: 100,
    elevation: 12,
  },

  floatingResultsScroll: {
    maxHeight: 320,
  },

  searchLoadingRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },

  noResultsText: {
    padding: 14,
    ...Typography.bodySm,
    color: DEEP_GREY,
    textAlign: 'center',
  },

  guidanceHint: {
    marginTop: -8,
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
    color: GREY_LABEL,
  },
  guidanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },

  guidanceTile: {
    width: '31.5%',
  },

  toolsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toolsIntro: {
    ...Typography.bodySm,
    color: GREY_LABEL,
    lineHeight: 20,
    marginBottom: 12,
  },

  toolTile: {
    flex: 1,
  },

  viewAll: {
    ...Typography.bodySm,
    fontWeight: '700',
    color: GOLD,
  },

  featuredScroll: {
    marginHorizontal: -PAGE_PAD,
    marginBottom: 8,
  },

  featuredCarousel: {
    paddingHorizontal: PAGE_PAD,
    paddingBottom: 4,
  },

  latestLabel: {
    ...Typography.bodySm,
    fontWeight: '600',
    color: DEEP_GREY,
    marginBottom: 10,
    marginTop: 4,
  },

  blogLoadingRow: {
    paddingVertical: 8,
    gap: 4,
  },

  blogEmptyWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },

  blogEmptyText: {
    ...Typography.bodySm,
    color: GREY_LABEL,
    textAlign: 'center',
  },

  retryText: {
    marginTop: 10,
    ...Typography.bodySm,
    fontWeight: '600',
    color: GOLD,
  },
});
