import type { MetadataRoute } from 'next';
import { CATEGORIES, fetchArticles, fetchSitemap } from '@/lib/articles/api';
import { SITE_URL } from '@/lib/articles/site';

const publicPaths = [
  '/', '/pandits', '/guidance', '/how-it-works', '/our-approach', '/about', '/pricing', '/trust',
  '/guidance/career', '/guidance/love', '/guidance/family', '/guidance/marriage', '/guidance/education', '/guidance/health', '/guidance/business', '/guidance/finance',
  '/guidance/start', '/tools', '/tools/kundli', '/tools/kundli/detailed', '/tools/horoscope', '/tools/compatibility', '/tools/compatibility/detailed', '/tools/numerology', '/tools/tarot', '/tools/palm-reading', '/tools/monthly-horoscope',
  '/articles', '/for-pandits', '/download', '/help', '/contact', '/accessibility', '/editorial-policy', '/delete-account',
  '/help/first-consultation', '/help/preparing-a-draft', '/help/tools-and-readings', '/help/coins-and-payment-pending', '/help/booking-cancellation', '/help/joining-audio-video', '/help/chat-reconnect', '/help/account-access', '/help/refunds-and-complaints',

  '/privacy', '/terms-and-conditions', '/refund-and-cancellation-policy', '/pricing-policy', '/disclaimer', '/cookie-policy', '/grievance-redressal',
];

async function fetchPublicExpertIds(): Promise<string[]> {
  try {
    const base = process.env.BACKEND_URL || process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || 'https://pandittalk-load-balancer.admininfo-6d6.workers.dev';
    const response = await fetch(`${base.replace(/\/$/, '')}/experts`, { next: { revalidate: 300 } });
    if (!response.ok) return [];
    const rows = await response.json() as Array<{ id?: string }>;
    return Array.isArray(rows) ? rows.flatMap((row) => row.id ? [`/pandits/${row.id}`] : []) : [];
  } catch { return []; }
}

async function fetchAuthorPaths(): Promise<string[]> {
  try {
    const articles = await fetchArticles({ limit: 100 });
    const ids = new Set<string>();
    for (const article of articles) {
      const id = article.authorPanditId || article.authorProfile?.id;
      if (id) ids.add(id);
    }
    return [...ids].map((id) => `/authors/${id}`);
  } catch {
    return [];
  }
}

function sitemapPriority(path: string): number {
  if (path === '/') return 1;
  if (path === '/pandits' || path === '/guidance' || path === '/pricing') return 0.9;
  if (path.includes('/detailed') || path === '/tools/monthly-horoscope') return 0.35;
  if (path.startsWith('/guidance/') || path.startsWith('/tools') || path === '/articles' || path === '/how-it-works') return 0.8;
  if (path.startsWith('/pandits/')) return 0.7;
  if (path === '/for-pandits' || path === '/our-approach' || path === '/download') return 0.65;
  if (path.startsWith('/authors/')) return 0.55;
  if (path.startsWith('/help') || path === '/trust' || path === '/about' || path === '/contact') return 0.6;
  if (
    path === '/privacy'
    || path === '/terms-and-conditions'
    || path === '/disclaimer'
    || path === '/cookie-policy'
    || path === '/grievance-redressal'
    || path === '/delete-account'
    || path.includes('policy')
  ) return 0.3;
  return 0.5;
}

function sitemapChangeFrequency(path: string): MetadataRoute.Sitemap[number]['changeFrequency'] {
  if (path === '/' || path === '/pandits' || path === '/articles') return 'weekly';
  if (path.startsWith('/pandits/') || path.startsWith('/authors/') || path.startsWith('/articles/')) return 'weekly';
  if (path.includes('policy') || path === '/privacy' || path === '/terms-and-conditions' || path === '/disclaimer' || path === '/cookie-policy') return 'yearly';
  return 'monthly';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await fetchSitemap();
  const expertPaths = await fetchPublicExpertIds();
  const authorPaths = await fetchAuthorPaths();
  const now = new Date();
  const categoryPaths = CATEGORIES.map((id) => `/articles?category=${id}`);
  return [
    ...[...new Set([...publicPaths, ...expertPaths, ...authorPaths, ...categoryPaths])].map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: sitemapChangeFrequency(path),
      priority: path.startsWith('/articles?') ? 0.55 : sitemapPriority(path),
    })),
    ...articles.map((article) => ({
      url: `${SITE_URL}/articles/${article.slug}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),
  ];
}
