import { Image } from 'expo-image';

import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import {

  Animated,

  Pressable,

  StyleSheet,

  Text,

  View,

  type StyleProp,

  type ViewStyle,

} from 'react-native';



import { resolveArticleCoverUrl } from '@/constants/articleCoverImages';

import {

  BANNER_GRADIENT_END,

  BANNER_GRADIENT_START,

  BLOG_CARD_BG,

  BLOG_CARD_BORDER,

  DEEP_GREY,

  GREY_LABEL,

  MUTED_GREY,

  SHADOW_BLACK,

  SOFT_YELLOW,

  TEXT_PRIMARY_DARK,

  WHITE,

} from '@/constants/Colors';

import { articleCategoryLabel } from '@/constants/articleCategories';
import { articleImageSource, ARTICLE_IMAGE_CACHE } from '@/lib/articleImageCache';

import type { ArticleListItem } from '@/lib/articlesApi';



type Variant = 'compact' | 'feed' | 'tile' | 'featured';



type Props = {

  article: ArticleListItem;

  variant: Variant;

  onPress?: () => void;

  style?: StyleProp<ViewStyle>;

  tileSize?: number;

};

const PANDITTALK_LOGO = require('../assets/icon.png');
const METADATA_HOLD_MS = 7000;
const METADATA_FADE_MS = 1200;



function CoverImage({

  url,

  category,

  style,

  square,

  overlay,

}: {

  url: string;

  category: ArticleListItem['category'];

  style: StyleProp<ViewStyle>;

  square?: boolean;

  overlay?: boolean;

}) {

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

    <View style={[style, styles.coverWrap, square && styles.coverSquare]}>

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

      {overlay ? (

        <LinearGradient

          colors={['transparent', 'rgba(0,0,0,0.65)']}

          style={styles.coverOverlay}

        />

      ) : null}

    </View>

  );

}



function CategoryChip({

  category,

  onCover,

}: {

  category: ArticleListItem['category'];

  onCover?: boolean;

}) {

  return (

    <View style={[styles.chip, onCover && styles.chipOnCover]}>

      <Text style={[styles.chipText, onCover && styles.chipTextOnCover]}>

        {articleCategoryLabel(category)}

      </Text>

    </View>

  );

}



function ReadTime({ minutes, light }: { minutes: number; light?: boolean }) {

  return (

    <Text style={[styles.readTime, light && styles.readTimeLight]}>

      {minutes} min read

    </Text>

  );

}

function FeedMetadata({ article }: { article: ArticleListItem }) {
  const [showCategory, setShowCategory] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const scheduleNext = () => {
      timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: METADATA_FADE_MS,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (cancelled || !finished) return;

          setShowCategory((current) => !current);
          Animated.timing(opacity, {
            toValue: 1,
            duration: METADATA_FADE_MS,
            useNativeDriver: true,
          }).start(({ finished: fadeInFinished }) => {
            if (!cancelled && fadeInFinished) scheduleNext();
          });
        });
      }, METADATA_HOLD_MS);
    };

    scheduleNext();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      opacity.stopAnimation();
    };
  }, [opacity]);

  return (
    <Animated.Text style={[styles.feedMetadata, { opacity }]}>
      {showCategory ? articleCategoryLabel(article.category) : `${article.readTimeMinutes} min read`}
    </Animated.Text>
  );
}

function FeedAuthor({ author }: { author: string }) {
  const normalizedAuthor = author.trim();
  const isPanditTalkTeam = !normalizedAuthor || /^pandittalk( team)?$/i.test(normalizedAuthor);
  const displayName = isPanditTalkTeam ? 'PanditTalk Team' : normalizedAuthor;
  const subtitle = isPanditTalkTeam
    ? 'Curated guidance for everyday questions'
    : 'Guidance from the PanditTalk community';

  return (
    <View style={styles.feedIdentity}>
      <View style={styles.authorAvatar}>
        <Image source={PANDITTALK_LOGO} style={styles.authorAvatarImage} contentFit="cover" />
      </View>
      <View style={styles.authorCopy}>
        <Text style={styles.feedAuthorName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.feedAuthorSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="ellipsis-horizontal" size={18} color={MUTED_GREY} />
    </View>
  );
}

function FeedArticlePost({ article }: { article: ArticleListItem }) {
  return (
    <View style={styles.feedCard}>
      <FeedAuthor author={article.author} />
      <View style={styles.feedCoverFrame}>
        <CoverImage
          url={article.coverImageUrl}
          category={article.category}
          style={styles.feedCover}
          overlay
        />
        <FeedMetadata article={article} />
      </View>
      <View style={styles.feedBody}>
        <Text style={styles.feedTitle} numberOfLines={2}>
          {article.title}
        </Text>
        {article.excerpt ? (
          <Text style={styles.feedExcerpt} numberOfLines={2}>
            {article.excerpt}
          </Text>
        ) : null}
      </View>
    </View>
  );
}



export function ArticleCard({ article, variant, onPress, style, tileSize }: Props) {

  const content = (() => {

    if (variant === 'compact') {

      return (

        <View style={styles.compactRow}>

          <View style={styles.compactBody}>

            <Text style={styles.compactTitle} numberOfLines={2}>

              {article.title}

            </Text>

            <View style={styles.compactMeta}>

              <CategoryChip category={article.category} />

              <ReadTime minutes={article.readTimeMinutes} />

            </View>

          </View>

        </View>

      );

    }



    if (variant === 'featured') {

      return (

        <View style={styles.featuredCard}>

          <CoverImage

            url={article.coverImageUrl}

            category={article.category}

            style={styles.featuredCover}

            overlay

          />

          <View style={styles.featuredBody}>

            <View style={styles.featuredMetaRow}>

              <CategoryChip category={article.category} onCover />

              <ReadTime minutes={article.readTimeMinutes} light />

            </View>

            <Text style={styles.featuredTitle} numberOfLines={3}>

              {article.title}

            </Text>

            {article.excerpt ? (

              <Text style={styles.featuredExcerpt} numberOfLines={2}>

                {article.excerpt}

              </Text>

            ) : null}

          </View>

        </View>

      );

    }



    if (variant === 'tile') {

      const size = tileSize ?? 160;

      return (

        <View style={[styles.tileCard, { width: size, height: size + 52 }]}>

          <CoverImage

            url={article.coverImageUrl}

            category={article.category}

            style={[styles.tileCover, { height: size }]}

            square

          />

          <Text style={styles.tileTitle} numberOfLines={2}>

            {article.title}

          </Text>

        </View>

      );

    }



    return <FeedArticlePost article={article} />;

  })();



  if (onPress) {

    return (

      <Pressable onPress={onPress} style={style} accessibilityRole="button">

        {content}

      </Pressable>

    );

  }



  return <View style={style}>{content}</View>;

}



const cardShadow = {

  shadowColor: SHADOW_BLACK,

  shadowOpacity: 0.04,

  shadowRadius: 20,

  shadowOffset: { width: 0, height: 8 },

  elevation: 2,

} as const;



const styles = StyleSheet.create({

  coverWrap: {

    overflow: 'hidden',

  },

  coverOverlay: {

    position: 'absolute',

    left: 0,

    right: 0,

    bottom: 0,

    height: '55%',

  },

  compactRow: {

    paddingVertical: 10,

    paddingHorizontal: 12,

    borderBottomWidth: StyleSheet.hairlineWidth,

    borderBottomColor: BLOG_CARD_BORDER,

  },

  compactBody: {

    flex: 1,

  },

  compactTitle: {

    fontSize: 14,

    fontWeight: '600',

    color: DEEP_GREY,

    marginBottom: 6,

  },

  compactMeta: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 8,

    flexWrap: 'wrap',

  },

  chip: {

    backgroundColor: BLOG_CARD_BG,

    borderWidth: 1,

    borderColor: BLOG_CARD_BORDER,

    borderRadius: 999,

    paddingHorizontal: 8,

    paddingVertical: 2,

  },

  chipOnCover: {

    backgroundColor: SOFT_YELLOW,

    borderColor: BLOG_CARD_BORDER,

  },

  chipText: {

    fontSize: 11,

    fontWeight: '600',

    color: TEXT_PRIMARY_DARK,

  },

  chipTextOnCover: {

    color: DEEP_GREY,

  },

  readTime: {

    fontSize: 11,

    color: MUTED_GREY,

  },

  readTimeLight: {

    color: 'rgba(255,255,255,0.9)',

  },

  feedCard: {

    backgroundColor: WHITE,

    borderRadius: 0,

    borderWidth: 1,

    borderColor: BLOG_CARD_BORDER,

    overflow: 'visible',

    marginBottom: 24,

    ...cardShadow,

  },

  feedCover: {

    width: '100%',

    height: 220,

  },

  feedIdentity: {
    alignItems: 'center',
    backgroundColor: WHITE,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  authorAvatar: {
    alignItems: 'center',
    backgroundColor: SOFT_YELLOW,
    borderColor: BLOG_CARD_BORDER,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 36,
  },

  authorAvatarImage: {
    height: '100%',
    width: '100%',
  },

  authorCopy: {
    flex: 1,
    minWidth: 0,
  },

  feedAuthorName: {
    color: DEEP_GREY,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },

  feedAuthorSubtitle: {
    color: GREY_LABEL,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },

  feedCoverFrame: {
    position: 'relative',
  },

  feedMetadata: {
    bottom: 12,
    color: WHITE,
    fontSize: 12,
    fontWeight: '600',
    position: 'absolute',
    right: 14,
    textShadowColor: 'rgba(0,0,0,0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  feedBody: {

    padding: 14,

  },

  feedMetaRow: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 8,

  },

  feedTitle: {

    fontSize: 17,

    fontWeight: '700',

    color: DEEP_GREY,

    lineHeight: 23,

    marginBottom: 6,

  },

  feedAuthor: {

    fontSize: 12,

    color: MUTED_GREY,

    marginBottom: 6,

  },

  feedExcerpt: {

    fontSize: 14,

    lineHeight: 20,

    color: GREY_LABEL,

  },

  featuredCard: {

    backgroundColor: WHITE,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: BLOG_CARD_BORDER,

    overflow: 'hidden',

    marginBottom: 16,

    ...cardShadow,

  },

  featuredCover: {

    width: '100%',

    height: 240,

  },

  featuredBody: {

    position: 'absolute',

    left: 0,

    right: 0,

    bottom: 0,

    padding: 16,

  },

  featuredMetaRow: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 8,

  },

  featuredTitle: {

    fontSize: 20,

    fontWeight: '800',

    color: WHITE,

    marginBottom: 4,

  },

  featuredExcerpt: {

    fontSize: 14,

    lineHeight: 20,

    color: 'rgba(255,255,255,0.88)',

  },

  tileCard: {

    backgroundColor: WHITE,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: BLOG_CARD_BORDER,

    overflow: 'hidden',

    marginRight: 12,

    ...cardShadow,

  },

  tileCover: {

    width: '100%',

  },

  coverSquare: {

    borderRadius: 0,

  },

  tileTitle: {

    padding: 10,

    fontSize: 13,

    fontWeight: '600',

    color: DEEP_GREY,

    backgroundColor: WHITE,

    flex: 1,

  },

});


