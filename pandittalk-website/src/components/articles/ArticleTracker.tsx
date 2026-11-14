'use client';

import { useEffect } from 'react';
import { recordArticleEvent } from '@/lib/articles/events';

export function ArticleTracker({ slug }: { slug: string }) {
  useEffect(() => {
    recordArticleEvent(slug, 'view');
    const timer = window.setTimeout(() => {
      recordArticleEvent(slug, 'read');
    }, 30_000);
    return () => window.clearTimeout(timer);
  }, [slug]);

  return null;
}
