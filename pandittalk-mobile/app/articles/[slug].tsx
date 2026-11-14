import { Image } from 'expo-image';
import { BackChevron } from '@/components/BackChevron';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown, { renderRules } from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BANNER_GRADIENT_END,
  BANNER_GRADIENT_START,
  BG,
  BLOG_CARD_BG,
  BLOG_CARD_BORDER,
  DEEP_GREY,
  GOLD,
  GREY_LABEL,
  HEADER_RULE_GREY,
  MUTED_GREY,
  SHADOW_BLACK,
  SOFT_YELLOW,
  TEXT_PRIMARY_DARK,
  WARM_IVORY,
  WHITE,
} from '@/constants/Colors';
import { resolveArticleCoverUrl } from '@/constants/articleCoverImages';
import { articleCategoryLabel } from '@/constants/articleCategories';
import { fetchArticleBySlug, recordArticleEvent, type ArticleDetail, type ArticleCategory } from '@/lib/articlesApi';
import { bookmarkLabel } from '@/lib/articleBookmarks';
import { articleExpertTarget } from '@/lib/articleExpertCta';
import { articleImageSource, ARTICLE_IMAGE_CACHE } from '@/lib/articleImageCache';
import {
  ARTICLE_BODY_SIZE,
  ARTICLE_H1_SIZE,
  ARTICLE_H2_SIZE,
  ARTICLE_H3_SIZE,
  articleTypeScale,
} from '@/lib/articleTypeScale';
import { readBookmark, readBookmarks, toggleArticleBookmark } from '@/lib/articleBookmarkStore';

function ArticleCover({ url, category }: { url: string; category: ArticleCategory }) {
  const initialUrl = useMemo(() => resolveArticleCoverUrl(url, category), [url, category]);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentUrl(initialUrl);
    setFailed(false);
  }, [initialUrl]);

  const fallbackUrl = resolveArticleCoverUrl('', category);
  const showImage = Boolean(currentUrl) && !failed;

  const handleError = () => {
    if (currentUrl !== fallbackUrl) {
      setCurrentUrl(fallbackUrl);
      return;
    }
    setFailed(true);
  };

  return (
    <View style={styles.cover}>
      <LinearGradient
        colors={[BANNER_GRADIENT_END, BANNER_GRADIENT_START]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {showImage ? (
        <Image
          source={articleImageSource(currentUrl) ?? { uri: currentUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          cachePolicy={ARTICLE_IMAGE_CACHE}
          transition={0}
          onError={handleError}
        />
      ) : null}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.15)']}
        style={styles.coverFade}
      />
    </View>
  );
}

export default function ArticleDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const [offlineCopy, setOfflineCopy] = useState(false);

  useEffect(() => {
    if (!slug || typeof slug !== 'string') {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await fetchArticleBySlug(slug);
        if (cancelled) return;
        if (!data) {
          const cached = await readBookmark(slug);
          if (cached) {
            setArticle(cached);
            setSaved(true);
            setOfflineCopy(true);
            setNotFound(false);
          } else {
            setNotFound(true);
            setArticle(null);
          }
        } else {
          setArticle(data);
          setOfflineCopy(false);
          const bookmarks = await readBookmarks();
          setSaved(bookmarks.some((item) => item.slug === data.slug));
        }
      } catch {
        if (!cancelled) {
          const cached = await readBookmark(slug);
          if (cached) {
            setArticle(cached);
            setSaved(true);
            setOfflineCopy(true);
            setNotFound(false);
          } else {
            setNotFound(true);
            setArticle(null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!article?.slug) return;
    void recordArticleEvent(article.slug, 'view');
    const timer = setTimeout(() => {
      void recordArticleEvent(article.slug, 'read');
    }, 30_000);
    return () => clearTimeout(timer);
  }, [article?.slug]);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[WARM_IVORY, BG]}
        style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backHit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackChevron />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Article
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (!article) return;
            void toggleArticleBookmark(article).then((next) => {
              setSaved(next.some((item) => item.slug === article.slug));
            });
          }}
          style={styles.saveHit}
          disabled={!article}
          accessibilityRole="button"
          accessibilityLabel={bookmarkLabel(saved)}
        >
          <Text style={styles.saveText}>{saved ? 'Saved' : 'Save'}</Text>
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : notFound || !article ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Article not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 88 }]}
            showsVerticalScrollIndicator={false}
          >
            <ArticleCover url={article.coverImageUrl} category={article.category} />

            <View style={styles.body}>
              <Text style={styles.title}>{article.title}</Text>
              {offlineCopy ? (
                <Text style={styles.offlineNote}>Saved copy on this phone.</Text>
              ) : null}

              {article.author ? (
                <Text style={styles.author}>{article.author}</Text>
              ) : null}

              <View style={styles.metaRow}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{articleCategoryLabel(article.category)}</Text>
                </View>
                <Text style={styles.readTime}>{article.readTimeMinutes} min read</Text>
              </View>

              <Markdown style={markdownStyles} rules={articleMarkdownRules}>
                {article.content}
              </Markdown>
            </View>
          </ScrollView>

          <View style={[styles.ctaBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TouchableOpacity
              style={styles.ctaButton}
              activeOpacity={0.9}
              onPress={() => {
                if (article.slug) {
                  void recordArticleEvent(article.slug, 'cta_click');
                }
                const target = articleExpertTarget(article.category);
                router.push({
                  pathname: '/experts',
                  params: {
                    ...(target.area ? { area: target.area } : {}),
                    ...(target.search ? { search: target.search } : {}),
                  },
                });
              }}
            >
              <Text style={styles.ctaButtonText}>
                {articleExpertTarget(article.category).label}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const bodyType = articleTypeScale(ARTICLE_BODY_SIZE);
const heading1Type = articleTypeScale(ARTICLE_H1_SIZE);
const heading2Type = articleTypeScale(ARTICLE_H2_SIZE);
const heading3Type = articleTypeScale(ARTICLE_H3_SIZE);

const articleMarkdownRules = {
  ...renderRules,
  text: (
    node: { key: string; content: string },
    _children: unknown,
    _parent: unknown,
    styles: { text?: object },
    inheritedStyles: object = {},
  ) => (
    <Text
      key={node.key}
      allowFontScaling
      maxFontSizeMultiplier={0}
      style={[inheritedStyles, styles.text]}
    >
      {node.content}
    </Text>
  ),
};

const markdownStyles = StyleSheet.create({
  body: {
    color: DEEP_GREY,
    fontSize: bodyType.fontSize,
    lineHeight: bodyType.lineHeight,
  },
  heading1: {
    color: DEEP_GREY,
    fontSize: heading1Type.fontSize,
    lineHeight: heading1Type.lineHeight,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    color: DEEP_GREY,
    fontSize: heading2Type.fontSize,
    lineHeight: heading2Type.lineHeight,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  heading3: {
    color: DEEP_GREY,
    fontSize: heading3Type.fontSize,
    lineHeight: heading3Type.lineHeight,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  link: {
    color: GOLD,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 14,
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BLOG_CARD_BORDER,
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
    fontSize: 18,
    fontWeight: '700',
    color: DEEP_GREY,
  },
  headerSpacer: {
    minWidth: 44,
  },
  saveHit: {
    minWidth: 64,
    alignItems: 'flex-end',
    paddingVertical: 6,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
    color: GOLD,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: BLOG_CARD_BG,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  cover: {
    width: '100%',
    height: 240,
    overflow: 'hidden',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  coverFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  body: {
    padding: 20,
    marginTop: -8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chip: {
    backgroundColor: SOFT_YELLOW,
    borderWidth: 1,
    borderColor: BLOG_CARD_BORDER,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
  },
  readTime: {
    fontSize: 13,
    color: GREY_LABEL,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: DEEP_GREY,
    lineHeight: 30,
    marginBottom: 6,
  },
  offlineNote: {
    fontSize: 13,
    color: GREY_LABEL,
    marginBottom: 8,
  },
  author: {
    fontSize: 13,
    color: MUTED_GREY,
    marginBottom: 10,
  },
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: WHITE,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HEADER_RULE_GREY,
    shadowColor: SHADOW_BLACK,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 4,
  },
  ctaButton: {
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
  },
});
