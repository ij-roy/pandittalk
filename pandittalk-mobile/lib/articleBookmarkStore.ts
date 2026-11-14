import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ArticleDetail } from '@/lib/articlesApi';
import { findBookmark, toggleBookmark } from '@/lib/articleBookmarks';

const STORAGE_KEY = 'pandittalk.articleBookmarks';

function parseBookmarks(raw: string | null): ArticleDetail[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ArticleDetail => {
      if (!item || typeof item !== 'object') return false;
      const row = item as ArticleDetail;
      return typeof row.slug === 'string' && typeof row.title === 'string' && typeof row.content === 'string';
    });
  } catch {
    return [];
  }
}

export async function readBookmarks(): Promise<ArticleDetail[]> {
  try {
    return parseBookmarks(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export async function toggleArticleBookmark(article: ArticleDetail): Promise<ArticleDetail[]> {
  const next = toggleBookmark(await readBookmarks(), article);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // The button can still reflect the change for this visit.
  }
  return next;
}

export async function readBookmark(slug: string): Promise<ArticleDetail | null> {
  return findBookmark(await readBookmarks(), slug);
}
