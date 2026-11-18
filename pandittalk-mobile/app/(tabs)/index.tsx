import { type Href, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ProfileProgressCard } from '../../components/ProfileProgressCard';
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
import { useUserProfile } from '../../hooks/useUserProfile';
import { fetchArticles, type ArticleListItem } from '../../lib/articlesApi';
import { getUserProfile } from '../../lib/authApi';
import { formatInr } from '../../lib/bookingPricing';
import { fetchExperts, type ExpertEntity } from '../../lib/expertsApi';
import { AVATAR_IMAGE_CACHE, avatarImageSource } from '../../lib/avatarImageCache';
import { selectFeaturedPandit } from '../../lib/homeFeaturedPandit';
import {
  coerceProfileRecord,
  mergeCoinBalanceIntoRecord,
} from '../../lib/profileUtils';
import { useAuthStore } from '../../store/useAuthStore';

type SvgAssetSource = number;

type ExpertArea =
  | 'career_business'
  | 'love_relationships'
  | 'finance_wealth'
  | 'marriage_family'
  | 'health_wellbeing'
  | 'spiritual_protection';

const guidanceAreas: {
  id: string;
  title: string;
  Icon: SvgAssetSource;
  expertArea: ExpertArea;
  tone: AccentToneKey;
}[] = [
  {
    id: '1',
    title: 'Career &\nBusiness',
    Icon: require('../../assets/images/Homepageicons/CareerBusiness.png'),
    expertArea: 'career_business',
    tone: 'gold',
  },
  {
    id: '2',
    title: 'Love &\nRelationships',
    Icon: require('../../assets/images/Homepageicons/LoveRelationships.png'),
    expertArea: 'love_relationships',
    tone: 'rose',
  },
  {
    id: '3',
    title: 'Finance &\nWealth',
    Icon: require('../../assets/images/Homepageicons/FinanceWealth.png'),
    expertArea: 'finance_wealth',
    tone: 'gold',
  },
  {
    id: '4',
    title: 'Marriage &\nFamily',
    Icon: require('../../assets/images/Homepageicons/MarriageFamily.png'),
    expertArea: 'marriage_family',
    tone: 'rose',
  },
  {
    id: '5',
    title: 'Health &\nWellbeing',
    Icon: require('../../assets/images/Homepageicons/HealthWellbeing.png'),
    expertArea: 'health_wellbeing',
    tone: 'sage',
  },
  {
    id: '6',
    title: 'Spiritual\nProtection',
    Icon: require('../../assets/images/Homepageicons/SpiritualProtection.png'),
    expertArea: 'spiritual_protection',
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

function FeaturedPanditCard({ expert }: { expert: ExpertEntity }) {
  const avatar = avatarImageSource(expert.imageUrl ?? '');
  const reviewLine =
    expert.totalReviews > 0
      ? `${expert.ratingDisplay.toFixed(1)} ★ · ${expert.reviewCountLabel}`
      : 'New on PanditTalk';
  const priceLine =
    expert.pricePerSession > 0
      ? `Chat from ₹${formatInr(expert.pricePerSession)}`
      : 'Price shown before booking';

  return (
    <View style={styles.featuredPanditWrap}>
      <Text style={styles.featuredPanditEyebrow}>
        {expert.isOnline ? 'Available now' : 'Available to book'}
      </Text>
      <AnimatedPressable
        style={styles.featuredPanditCard}
        onPress={() => router.push(`/experts/${expert.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`View ${expert.name}`}
      >
        <View style={styles.featuredPanditAvatar}>
          {avatar ? (
            <Image
              source={avatar}
              style={styles.featuredPanditAvatarImage}
              contentFit="cover"
              cachePolicy={AVATAR_IMAGE_CACHE}
              recyclingKey={expert.id}
              transition={0}
            />
          ) : (
            <Ionicons name="person-outline" size={25} color={GOLD} />
          )}
        </View>
        <View style={styles.featuredPanditCopy}>
          <Text style={styles.featuredPanditName} numberOfLines={1}>
            {expert.name}
          </Text>
          <Text style={styles.featuredPanditMeta} numberOfLines={1}>
            {expert.languagesDisplay}
          </Text>
          <Text style={styles.featuredPanditMeta} numberOfLines={1}>
            {reviewLine}
          </Text>
          <Text style={styles.featuredPanditPrice} numberOfLines={1}>
            {priceLine}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={GOLD} />
      </AnimatedPressable>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { greetingTitle } = useUserProfile();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [featuredPandit, setFeaturedPandit] = useState<ExpertEntity | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);

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

  const loadFeaturedPandit = useCallback(async () => {
    const experts = await fetchExperts();
    setFeaturedPandit(selectFeaturedPandit(experts));
  }, []);

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
        loadFeaturedPandit().catch(() => setFeaturedPandit(null)),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadArticles, refreshProfile, loadFeaturedPandit]);

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
    let cancelled = false;
    void (async () => {
      try {
        const experts = await fetchExperts();
        if (!cancelled) setFeaturedPandit(selectFeaturedPandit(experts));
      } catch {
        if (!cancelled) setFeaturedPandit(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const featuredArticles = useMemo(() => articles.slice(0, FEATURED_COUNT), [articles]);
  const feedArticles = useMemo(() => articles.slice(FEATURED_COUNT), [articles]);

  const listHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <View style={styles.heroWrap}>
          <HeroBanner
            edgeToEdge
            eyebrow="Live pandit consultations"
            title="Talk to a verified pandit"
            subtitle="Start a live chat or book an audio or video consultation with an expert you trust."
            ctaLabel="Browse pandits"
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

        {featuredPandit ? <FeaturedPanditCard expert={featuredPandit} /> : null}

        <View style={styles.progressWrap}>
          <ProfileProgressCard />
        </View>

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
                  pathname: '/experts',
                  params: { area: item.expertArea },
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

        <SectionHeader title="Self-service tools" />
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

        {feedArticles.length > 0 ? (
          <SectionHeader title="Latest" style={styles.latestSection} />
        ) : null}

      </View>
    ),
    [
      featuredArticles,
      feedArticles.length,
      featuredPandit,
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

  featuredPanditWrap: {
    marginBottom: SECTION_GAP,
  },
  featuredPanditEyebrow: {
    ...Typography.caption,
    color: GOLD,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  featuredPanditCard: {
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderColor: BLOG_CARD_BORDER,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 92,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...shadowElevated,
  },
  featuredPanditAvatar: {
    alignItems: 'center',
    backgroundColor: '#F7F1C8',
    borderColor: BLOG_CARD_BORDER,
    borderRadius: 30,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 58,
  },
  featuredPanditAvatarImage: {
    height: '100%',
    width: '100%',
  },
  featuredPanditCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  featuredPanditName: {
    ...Typography.body,
    color: DEEP_GREY,
    fontWeight: '800',
  },
  featuredPanditMeta: {
    ...Typography.caption,
    color: GREY_LABEL,
  },
  featuredPanditPrice: {
    ...Typography.caption,
    color: DEEP_GREY,
    fontWeight: '700',
    marginTop: 2,
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

  latestSection: {
    marginTop: 32,
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
