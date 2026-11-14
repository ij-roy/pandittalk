import { LinearGradient } from 'expo-linear-gradient';
import { BackChevron } from '@/components/BackChevron';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArticleCard } from '@/components/ArticleCard';
import { SectionRule } from '@/components/premium-auth-ui';
import {
  ARTICLE_CATEGORY_TABS,
  type ArticleCategoryFilter,
} from '@/constants/articleCategories';
import {
  BG,
  BLOG_CARD_BORDER,
  DEEP_GREY,
  GOLD,
  GREY_LABEL,
  SOFT_YELLOW,
  WARM_IVORY,
  WHITE,
} from '@/constants/Colors';
import { fetchArticles, type ArticleDetail, type ArticleListItem } from '@/lib/articlesApi';
import { readBookmarks } from '@/lib/articleBookmarkStore';
import { emptyCategoryMessage } from '@/lib/articleEmptyCategory';
import { articleCoverUrls } from '@/lib/articleImageCache';

export default function ArticlesIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [category, setCategory] = useState<ArticleCategoryFilter>('all');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<ArticleDetail[]>([]);
  const [related, setRelated] = useState<ArticleListItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void readBookmarks().then((rows) => {
        if (!cancelled) setSaved(rows);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const loadPage = useCallback(
    async (opts: {
      cursor?: string;
      append?: boolean;
      cat?: ArticleCategoryFilter;
    }) => {
      const activeCategory = opts.cat ?? category;
      const res = await fetchArticles({
        limit: 10,
        cursor: opts.cursor,
        category: activeCategory === 'all' ? undefined : activeCategory,
      });
      setArticles((prev) =>
        opts.append ? [...prev, ...res.articles] : res.articles,
      );
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
      return res;
    },
    [category],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      setRelated([]);
      try {
        const res = await loadPage({ cat: category });
        if (cancelled) return;
        void Image.prefetch(articleCoverUrls(res.articles.map((item) => item.coverImageUrl)));
        if (category !== 'all' && res.articles.length === 0) {
          const others = await fetchArticles({ limit: 5 });
          if (!cancelled) {
            setRelated(others.articles);
            void Image.prefetch(articleCoverUrls(others.articles.map((item) => item.coverImageUrl)));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load articles.');
          setArticles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, loadPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await loadPage({ cat: category });
      void Image.prefetch(articleCoverUrls(res.articles.map((item) => item.coverImageUrl)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refresh articles.');
    } finally {
      setRefreshing(false);
    }
  }, [category, loadPage]);

  const onEndReached = useCallback(async () => {
    if (!hasMore || loadingMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await loadPage({ cursor: nextCursor, append: true });
      void Image.prefetch(articleCoverUrls(res.articles.map((item) => item.coverImageUrl)));
    } catch {
      // Keep existing list.
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, loadPage, nextCursor]);

  const onCategoryPress = (id: ArticleCategoryFilter) => {
    if (id === category) return;
    setCategory(id);
  };

  const showFeatured = category === 'all' && articles.length > 0;
  const featuredArticle = showFeatured ? articles[0] : null;
  const listArticles = useMemo(
    () => (showFeatured ? articles.slice(1) : articles),
    [articles, showFeatured],
  );

  const listHeader = useMemo(() => {
    const savedBlock =
      category === 'all' && saved.length > 0 ? (
        <View style={styles.savedBlock}>
          <SectionRule label="Saved" />
          {saved.map((item) => (
            <TouchableOpacity
              key={item.slug}
              onPress={() => router.push(`/articles/${item.slug}`)}
              accessibilityRole="button"
              accessibilityLabel={`Open saved article ${item.title}`}
            >
              <Text style={styles.savedTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null;
    if (!featuredArticle) return savedBlock;
    return (
      <View style={styles.featuredWrap}>
        {savedBlock}
        <ArticleCard
          article={featuredArticle}
          variant="featured"
          onPress={() => router.push(`/articles/${featuredArticle.slug}`)}
        />
        {listArticles.length > 0 ? <SectionRule label="Latest" /> : null}
      </View>
    );
  }, [category, featuredArticle, listArticles.length, router, saved]);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[WARM_IVORY, SOFT_YELLOW, BG]}
        locations={[0, 0.6, 1]}
        style={[styles.heroHeader, { paddingTop: Math.max(insets.top, 12) }]}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backHit}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackChevron />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Articles</Text>
          <View style={styles.headerSpacer} />
        </View>
        <Text style={styles.heroSubtitle}>Rituals, remedies, and cosmic insights</Text>
      </LinearGradient>

      <View style={styles.tabsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
          style={styles.tabsScroll}
        >
          {ARTICLE_CATEGORY_TABS.map((tab) => {
            const active = tab.id === category;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabChip, active && styles.tabChipActive]}
                onPress={() => onCategoryPress(tab.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : error && articles.length === 0 && saved.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={listArticles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => (
            <ArticleCard
              article={item}
              variant="feed"
              onPress={() => router.push(`/articles/${item.slug}`)}
            />
          )}
          ListEmptyComponent={
            error ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>{error}</Text>
                <TouchableOpacity onPress={() => void onRefresh()} activeOpacity={0.75}>
                  <Text style={styles.retryText}>Tap to retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>
                  {category !== 'all'
                    ? emptyCategoryMessage(
                        ARTICLE_CATEGORY_TABS.find((tab) => tab.id === category)?.label ?? 'This topic',
                      )
                    : 'No articles yet.'}
                </Text>
                {related.map((item) => (
                  <ArticleCard
                    key={item.id}
                    article={item}
                    variant="feed"
                    onPress={() => router.push(`/articles/${item.slug}`)}
                  />
                ))}
              </View>
            )
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={GOLD} />
          }
          onEndReached={() => void onEndReached()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footerSpinner} color={GOLD} />
            ) : null
          }
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
  heroHeader: {
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BLOG_CARD_BORDER,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  backHit: {
    minWidth: 44,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 22,
    fontWeight: '600',
    color: DEEP_GREY,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: DEEP_GREY,
  },
  headerSpacer: {
    minWidth: 44,
  },
  heroSubtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: GREY_LABEL,
    paddingHorizontal: 24,
    marginBottom: 2,
  },
  tabsBar: {
    backgroundColor: WHITE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BLOG_CARD_BORDER,
    paddingVertical: 12,
  },
  tabsScroll: {
    flexGrow: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingRight: 16,
    gap: 8,
    alignItems: 'center',
  },
  tabChip: {
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: BLOG_CARD_BORDER,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabChipActive: {
    borderColor: GOLD,
    backgroundColor: SOFT_YELLOW,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    color: GREY_LABEL,
    textAlignVertical: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  tabChipTextActive: {
    color: DEEP_GREY,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  featuredWrap: {
    marginBottom: 4,
  },
  savedBlock: {
    marginBottom: 12,
  },
  savedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DEEP_GREY,
    paddingVertical: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: GREY_LABEL,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: GREY_LABEL,
    textAlign: 'center',
    marginTop: 40,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
  },
  retryText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
  },
  footerSpinner: {
    marginVertical: 16,
  },
});
