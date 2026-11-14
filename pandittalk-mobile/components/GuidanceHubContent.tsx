import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { ArticleCard } from './ArticleCard';
import { AVATAR_IMAGE_CACHE, avatarImageSource } from '@/lib/avatarImageCache';
import {
  AVAILABLE_GREEN,
  BLACK,
  BUSY_AMBER,
  DEEP_GREY,
  GOLD,
  GREY_LABEL,
  HOW_BORDER_GREY,
  HOW_GLYPH_GREY,
  HOW_SURFACE_LIGHT,
  ORB_BALL_BORDER,
  ORB_BALL_FILL,
  ORB_SHADOW,
  ORB_STAND_GREY,
  PLACEHOLDER_GREY,
  SHADOW_BLACK,
  SOFT_YELLOW,
  STACK_LAYER_BACK,
  STACK_LAYER_MID,
  STAR_EMPTY,
  TEXT_PRIMARY_DARK,
  WHITE,
} from '../constants/Colors';
import { fetchArticles, type ArticleListItem } from '../lib/articlesApi';
import { fetchExperts, type ExpertEntity } from '../lib/expertsApi';
import { presenceLabel } from '../lib/presenceCopy';

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

function pickFeaturedExperts(experts: ExpertEntity[]): ExpertEntity[] {
  const online = experts.filter((e) => e.isOnline);
  const pool = online.length >= 3 ? online : experts;
  return pool.slice(0, 3);
}

export type GuidanceHubBlogLayout = 'horizontal' | 'grid';

type GuidanceHubContentProps = {
  blogLayout?: GuidanceHubBlogLayout;
  showGuides?: boolean;
  showHowItWorks?: boolean;
  blogSectionTitle?: string;
};

const HOME_SCROLL_HORIZONTAL_PAD = 32;
const BLOG_GRID_GAP = 10;

export function GuidanceHubContent({
  blogLayout = 'horizontal',
  showGuides = true,
  showHowItWorks = true,
  blogSectionTitle = 'From the Blogs',
}: GuidanceHubContentProps) {
  const { width: windowWidth } = useWindowDimensions();
  const innerContentWidth = windowWidth - HOME_SCROLL_HORIZONTAL_PAD;
  const blogCellSize =
    blogLayout === 'grid'
      ? Math.floor((innerContentWidth - BLOG_GRID_GAP) / 2)
      : 140;

  const [guides, setGuides] = useState<ExpertEntity[]>([]);
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [guidesLoading, setGuidesLoading] = useState(showGuides);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [guidesFailed, setGuidesFailed] = useState(false);
  const [articlesFailed, setArticlesFailed] = useState(false);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  const loadArticles = useCallback(async () => {
    setArticlesLoading(true);
    setArticlesFailed(false);
    setArticlesError(null);
    try {
      const res = await fetchArticles({ limit: 3 });
      setArticles(res.articles);
    } catch (err) {
      setArticles([]);
      setArticlesFailed(true);
      setArticlesError(err instanceof Error ? err.message : 'Could not load articles.');
    } finally {
      setArticlesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showGuides) {
      setGuidesLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      setGuidesLoading(true);
      setGuidesFailed(false);
      try {
        const data = await fetchExperts();
        if (!cancelled) setGuides(pickFeaturedExperts(data));
      } catch {
        if (!cancelled) {
          setGuides([]);
          setGuidesFailed(true);
        }
      } finally {
        if (!cancelled) setGuidesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showGuides]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setArticlesLoading(true);
      setArticlesFailed(false);
      setArticlesError(null);
      try {
        const res = await fetchArticles({ limit: 3 });
        if (!cancelled) setArticles(res.articles);
      } catch (err) {
        if (!cancelled) {
          setArticles([]);
          setArticlesFailed(true);
          setArticlesError(
            err instanceof Error ? err.message : 'Could not load articles.',
          );
        }
      } finally {
        if (!cancelled) setArticlesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const showGuidesSection = showGuides && !guidesFailed;

  const guideCards = useMemo(() => {
    if (guidesLoading) {
      return (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={GOLD} />
        </View>
      );
    }
    if (guides.length === 0) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hCarouselPad}
      >
        {guides.map((guide) => (
          <TouchableOpacity
            key={guide.id}
            style={styles.guideCard}
            activeOpacity={0.85}
            onPress={() => router.push(`/experts/${guide.id}`)}
          >
            <View style={styles.guideTopRow}>
              {avatarImageSource(guide.imageUrl ?? '') ? (
                <Image
                  source={avatarImageSource(guide.imageUrl ?? '')!}
                  style={styles.avatar}
                  contentFit="cover"
                  cachePolicy={AVATAR_IMAGE_CACHE}
                  transition={0}
                />
              ) : (
                <View style={styles.avatar} />
              )}
              <View style={styles.guideInfo}>
                <Text style={styles.guideName}>{guide.name}</Text>
                <StarRow count={guide.rating} />
              </View>
            </View>

            <Text style={styles.specialisationLabel}>Area of Specialisation</Text>
            <Text style={styles.specialisationValue} numberOfLines={2}>
              {guide.specialty}
            </Text>

            <Text style={styles.expLine}>
              Exp: {guide.experienceYears > 0 ? `${guide.experienceYears} yrs` : guide.experienceLabel}
            </Text>

            <View style={styles.statusRow}>
              <View style={[styles.statusDot, !guide.isOnline && styles.statusDotBusy]} />
              <Text style={styles.statusText}>{presenceLabel(guide.isOnline)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }, [guides, guidesLoading]);

  const articleCards = useMemo(() => {
    if (articlesLoading) {
      return (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={GOLD} />
        </View>
      );
    }
    if (articlesFailed) {
      return (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>
            {articlesError ?? 'Could not load articles.'}
          </Text>
          <TouchableOpacity activeOpacity={0.75} onPress={() => void loadArticles()}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (articles.length === 0) {
      return <Text style={styles.emptyText}>No articles yet.</Text>;
    }

    if (blogLayout === 'horizontal') {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hCarouselPad}
        >
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              variant="tile"
              tileSize={146}
              onPress={() => router.push(`/articles/${article.slug}`)}
            />
          ))}
        </ScrollView>
      );
    }

    return (
      <View style={styles.blogGrid}>
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            variant="tile"
            tileSize={blogCellSize}
            onPress={() => router.push(`/articles/${article.slug}`)}
          />
        ))}
      </View>
    );
  }, [articles, articlesError, articlesFailed, articlesLoading, blogCellSize, blogLayout, loadArticles]);

  return (
    <>
      {showGuidesSection ? (
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Experienced Guides</Text>
          {guideCards}
        </View>
      ) : null}

      <View style={styles.block}>
        <View style={styles.blogHeaderRow}>
          <Text style={styles.sectionTitleInline}>{blogSectionTitle}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={8}
            onPress={() => router.push('/articles')}
          >
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>
        {articleCards}
      </View>

      {showHowItWorks ? (
        <View style={[styles.block, styles.bottomBlock]}>
          <Text style={styles.sectionTitle}>How It Works</Text>

          <View style={styles.howRow}>
            <View style={styles.howStep}>
              <View style={styles.howIconDashed}>
                <Text style={styles.howIconGlyph}>⎔</Text>
              </View>
              <Text style={styles.howLabel}>Choose Area</Text>
            </View>

            <Text style={styles.howArrow}>→</Text>

            <View style={styles.howStep}>
              <View style={styles.howIconStack}>
                <View style={styles.stackLayer} />
                <View style={[styles.stackLayer, styles.stackLayerMid]} />
                <View style={[styles.stackLayer, styles.stackLayerBack]} />
              </View>
              <Text style={styles.howLabel}>Select Depth</Text>
            </View>

            <Text style={styles.howArrow}>→</Text>

            <View style={styles.howStep}>
              <View style={styles.howIconOrb}>
                <View style={styles.orbStand} />
                <View style={styles.orbBall}>
                  <Text style={styles.orbSparkle}>✦</Text>
                </View>
              </View>
              <Text style={[styles.howLabel, styles.howLabelNarrow]}>
                Receive Structured Guidance
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  block: {
    width: '100%',
    marginBottom: 20,
  },

  bottomBlock: {
    marginBottom: 0,
  },

  loadingRow: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  errorWrap: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },

  errorText: {
    fontSize: 13,
    color: GREY_LABEL,
    textAlign: 'center',
  },

  retryText: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
  },

  emptyText: {
    fontSize: 13,
    color: GREY_LABEL,
    paddingVertical: 8,
  },

  sectionTitle: {
    marginBottom: 12,
    color: DEEP_GREY,
    fontSize: 18,
    fontWeight: '600',
  },

  sectionTitleInline: {
    marginBottom: 0,
    color: DEEP_GREY,
    fontSize: 18,
    fontWeight: '600',
    flexShrink: 1,
  },

  hCarouselPad: {
    paddingBottom: 2,
    paddingRight: 2,
  },

  guideCard: {
    width: 226,
    backgroundColor: WHITE,
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    shadowColor: SHADOW_BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },

  guideTopRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PLACEHOLDER_GREY,
    marginRight: 8,
    overflow: 'hidden',
  },

  guideInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  guideName: {
    fontSize: 14,
    fontWeight: '700',
    color: BLACK,
  },

  starRow: {
    flexDirection: 'row',
    marginTop: 3,
    gap: 1,
  },

  star: {
    fontSize: 11,
    color: STAR_EMPTY,
  },

  starFilled: {
    color: GOLD,
  },

  specialisationLabel: {
    fontSize: 9,
    color: GREY_LABEL,
    marginBottom: 1,
  },

  specialisationValue: {
    fontSize: 11,
    color: DEEP_GREY,
    fontWeight: '500',
    marginBottom: 4,
  },

  expLine: {
    fontSize: 10,
    color: TEXT_PRIMARY_DARK,
    marginBottom: 6,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AVAILABLE_GREEN,
    marginRight: 5,
  },

  statusDotBusy: {
    backgroundColor: BUSY_AMBER,
  },

  statusText: {
    fontSize: 10,
    color: TEXT_PRIMARY_DARK,
    fontWeight: '500',
  },

  blogHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },

  viewAll: {
    fontSize: 12,
    color: GREY_LABEL,
    fontWeight: '500',
  },

  blogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BLOG_GRID_GAP,
    width: '100%',
  },

  howRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingBottom: 6,
  },

  howStep: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 88,
    minWidth: 0,
  },

  howArrow: {
    fontSize: 13,
    color: DEEP_GREY,
    marginTop: 18,
    paddingHorizontal: 1,
    flexShrink: 0,
  },

  howLabel: {
    marginTop: 6,
    fontSize: 9,
    fontWeight: '600',
    color: DEEP_GREY,
    textAlign: 'center',
    lineHeight: 12,
  },

  howLabelNarrow: {
    fontSize: 8,
    lineHeight: 11,
    paddingHorizontal: 2,
  },

  howIconDashed: {
    width: 42,
    height: 42,
    borderRadius: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: HOW_BORDER_GREY,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HOW_SURFACE_LIGHT,
  },

  howIconGlyph: {
    fontSize: 16,
    color: HOW_GLYPH_GREY,
  },

  howIconStack: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },

  stackLayer: {
    position: 'absolute',
    width: 26,
    height: 17,
    borderRadius: 3,
    backgroundColor: SOFT_YELLOW,
    borderWidth: 1.2,
    borderColor: GOLD,
    top: 13,
  },

  stackLayerMid: {
    top: 9,
    width: 28,
    backgroundColor: STACK_LAYER_MID,
    zIndex: 1,
  },

  stackLayerBack: {
    top: 4,
    width: 30,
    backgroundColor: STACK_LAYER_BACK,
    zIndex: 2,
  },

  howIconOrb: {
    width: 42,
    height: 42,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  orbStand: {
    width: 21,
    height: 6,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: ORB_STAND_GREY,
    marginTop: -2,
  },

  orbBall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ORB_BALL_FILL,
    borderWidth: 1.5,
    borderColor: ORB_BALL_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -4,
    shadowColor: ORB_SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },

  orbSparkle: {
    fontSize: 11,
    color: GOLD,
  },
});
