import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleShare } from '@/components/articles/ArticleShare';
import { ArticleTracker } from '@/components/articles/ArticleTracker';
import { ConsultCta } from '@/components/articles/ConsultCta';
import { MarkdownBody } from '@/components/articles/MarkdownBody';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { SoftResourceNotFound } from '@/components/site/SoftResourceNotFound';
import {
  CATEGORY_LABELS,
  fetchArticle,
  fetchArticles,
  fetchSitemap,
} from '@/lib/articles/api';
import { formatDate, formatReadTime, htmlLang } from '@/lib/articles/format';
import { absoluteUrl, SITE_URL } from '@/lib/articles/site';

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const rows = await fetchSitemap();
  return rows.map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) return { title: 'Article not found', robots: { index: false, follow: true } };
  const title = article.seoTitle || article.title;
  const description = article.seoDescription || article.excerpt;
  const url = absoluteUrl(`/articles/${article.slug}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      locale: article.language === 'en' ? 'en_IN' : 'hi_IN',
      images: article.coverImageUrl
        ? [{ url: absoluteUrl(article.coverImageUrl) }]
        : [{ url: absoluteUrl('/logo.png'), width: 512, height: 512, alt: 'Pandit Talk' }],
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [article.coverImageUrl ? absoluteUrl(article.coverImageUrl) : absoluteUrl('/logo.png')],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) {
    return (
      <SoftResourceNotFound
        eyebrow="Journal"
        title="This article could not be found."
        description="The link may be old, unpublished, or mistyped. Reading the journal never creates a booking or charge. Browse other articles, try a free tool, or prepare a private draft."
        primaryHref="/articles"
        primaryLabel="Browse the journal"
        links={[
          { href: '/guidance', label: 'Explore guidance' },
          { href: '/tools', label: 'Try free tools' },
          { href: '/guidance/start', label: 'Prepare a draft' },
          { href: '/pandits', label: 'Explore Pandits' },
        ]}
        notifySource="website_article_missing"
      />
    );
  }

  let related = (await fetchArticles({ limit: 8, category: article.category }))
    .filter((item) => item.slug !== article.slug)
    .slice(0, 3);
  const relatedFromCategory = related.length > 0;
  if (!relatedFromCategory) {
    related = (await fetchArticles({ limit: 8 }))
      .filter((item) => item.slug !== article.slug)
      .slice(0, 3);
  }
  const authorHref = article.authorPanditId
    ? `/authors/${article.authorPanditId}`
    : null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.seoDescription || article.excerpt,
    image: article.coverImageUrl,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: htmlLang(article.language),
    author: {
      '@type': article.authorPanditId ? 'Person' : 'Organization',
      name: article.authorProfile?.name || article.author,
      url: authorHref ? absoluteUrl(authorHref) : SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Pandit Talk',
      url: SITE_URL,
    },
    mainEntityOfPage: absoluteUrl(`/articles/${article.slug}`),
  };

  return (
    <main
      id="main-content"
      className="page journal-detail"
      lang={htmlLang(article.language)}
      tabIndex={-1}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ArticleTracker slug={article.slug} />
      <article className="journal-reading">
        <Link href="/articles" className="journal-back"><span aria-hidden="true">←</span> Back to the journal</Link>
        <p className="eyebrow">
          <span className="sr-only" id="journal-article-meta-hint">Category opens the filtered journal. Escape blurs. Skip remains site-content.</span>
          <LinkKeyboardGroup as="span" aria-label="Article category" aria-describedby="journal-article-meta-hint">
            <Link href={`/articles?category=${article.category}`}>
              {CATEGORY_LABELS[article.category] || article.category.replaceAll('_', ' ')}
            </Link>
          </LinkKeyboardGroup>
          {' · '}
          {formatReadTime(article.readTimeMinutes, article.content)}
        </p>
        <h1>
          {article.title}
        </h1>
        <p className="journal-byline">
          {authorHref ? (
            <>
              <span className="sr-only" id="journal-article-byline-hint">Arrow keys move to the author profile link. Escape blurs.</span>
              <LinkKeyboardGroup as="span" aria-label="Article author" aria-describedby="journal-article-byline-hint">
                <Link href={authorHref}>{article.author}</Link>
              </LinkKeyboardGroup>
            </>
          ) : (
            <span>{article.author}</span>
          )}
          {' · '}
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        </p>
        {article.coverImageUrl ? <img
          className="journal-cover"
          src={article.coverImageUrl}
          alt={article.coverAlt || article.title}
          width={1200}
          height={728}
        /> : null}
        <MarkdownBody content={article.content} />
        <ArticleShare
          slug={article.slug}
          title={article.title}
          url={absoluteUrl(`/articles/${article.slug}`)}
        />
        <section className="journal-related" aria-labelledby="journal-related-title">
          <h2 id="journal-related-title">
            {related.length > 0
              ? relatedFromCategory
                ? `More in ${CATEGORY_LABELS[article.category] || article.category.replaceAll('_', ' ')}`
                : 'More from the journal'
              : 'Keep reading'}
          </h2>
          <p className="sr-only" id="journal-related-keys">Arrow keys move between related articles. Escape blurs the focused link.</p>
          {related.length > 0 ? (
            <LinkKeyboardGroup className="journal-related__grid" aria-label="Related articles" aria-describedby="journal-related-keys">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/articles/${item.slug}`}
                  className="journal-related__link"
                >
                  <p className="article-card__meta">
                    {formatReadTime(item.readTimeMinutes)}
                  </p>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                </Link>
              ))}
            </LinkKeyboardGroup>
          ) : (
            <LinkKeyboardGroup className="journal-related__empty" as="p" aria-label="Journal empty related next steps" aria-describedby="journal-related-keys">
              No other published pieces are available yet. New No Timer bookings stay closed — reading here does not create a charge.{' '}
              <Link href="/articles">Browse the journal</Link>
              {' · '}
              <Link href="/guidance">Explore guidance topics</Link>
              {' · '}
              <Link href="/tools">Try free tools</Link>
              {' · '}
              <Link href="/guidance/start">Prepare a draft</Link>
            </LinkKeyboardGroup>
          )}
          {related.length > 0 && (
            <p className="journal-related__more">
              <span className="sr-only" id="journal-related-more-hint">Arrow keys move between related browse links. Escape blurs. Skip remains site-content.</span>
              <LinkKeyboardGroup as="span" aria-label="Browse more journal articles" aria-describedby="journal-related-more-hint">
                {relatedFromCategory ? (
                  <Link href={`/articles?category=${article.category}`}>
                    All {CATEGORY_LABELS[article.category] || 'category'} articles →
                  </Link>
                ) : (
                  <Link href="/articles">Browse the full journal →</Link>
                )}
                {' · '}
                <Link href="/guidance">Explore guidance →</Link>
                {' · '}
                <Link href="/tools">Try free tools →</Link>
              </LinkKeyboardGroup>
            </p>
          )}
        </section>
      </article>
      <div className="journal-sidebar">
        <ConsultCta
          slug={article.slug}
          authorName={article.authorProfile?.name || article.author}
          authorHref={authorHref}
          authorId={article.authorPanditId || article.authorProfile?.id}
        />
      </div>
    </main>
  );
}
