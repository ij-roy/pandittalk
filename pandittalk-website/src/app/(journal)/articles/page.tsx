import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { JournalCategoryNav } from '@/components/articles/JournalCategoryNav';
import { EscapeBlurNotice } from '@/components/site/EscapeBlurNotice';
import { FocusMainHeading } from '@/components/site/FocusMainHeading';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { SoftResourceNotFound } from '@/components/site/SoftResourceNotFound';
import {
  CATEGORY_LABELS,
  fetchArticles,
  isCategory,
  type ArticleCategory,
} from '@/lib/articles/api';

export const revalidate = 60;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { category } = await searchParams;
  if (!category) {
    return {
      title: 'Articles',
      description:
        'Read astrology, vastu, numerology, tarot and spiritual guidance from Pandit Talk writers. The journal is not a live consultation — new No Timer bookings stay paused.',
      alternates: { canonical: '/articles' },
    };
  }
  if (!isCategory(category)) {
    return {
      title: 'Category not found',
      description: 'That journal category is not available on Pandit Talk.',
      robots: { index: false, follow: true },
      alternates: { canonical: '/articles' },
    };
  }
  const label = CATEGORY_LABELS[category];
  return {
    title: `${label} articles`,
    description: `Read ${label.toLowerCase()} articles from Pandit Talk writers — thoughtful perspective, named authors. Not a live consultation; new bookings stay paused.`,
    alternates: { canonical: `/articles?category=${category}` },
    openGraph: {
      title: `${label} · Pandit Talk Journal`,
      description: `Published ${label.toLowerCase()} reading from Pandit Talk. Journal reading never opens a booking or charge.`,
      url: `/articles?category=${category}`,
    },
  };
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  if (category && !isCategory(category)) {
    return (
      <SoftResourceNotFound
        eyebrow="Journal"
        title="That journal category is not available."
        description="Categories change over time. Choosing an unknown filter does not create a booking or charge. Browse all articles, try a free tool, or prepare a private draft."
        primaryHref="/articles"
        primaryLabel="View all articles"
        links={[
          { href: '/guidance', label: 'Explore guidance' },
          { href: '/tools', label: 'Try free tools' },
          { href: '/guidance/start', label: 'Prepare a draft' },
          { href: '/editorial-policy', label: 'Editorial policy' },
        ]}
        notifySource="website_journal_category_missing"
      />
    );
  }
  const selected: ArticleCategory | undefined = isCategory(category) ? category : undefined;
  const articles = await fetchArticles({ limit: 50, category: selected });

  return (
    <main id="main-content" className="page journal-page">
      <header className="journal-hero">
        <p className="eyebrow">The Pandit Talk Journal</p>
        <h1>
          {selected
            ? <>{CATEGORY_LABELS[selected]}.<br />A thoughtful next step.</>
            : <>A little perspective.<br />A thoughtful next step.</>}
        </h1>
        <p className="lede">
          {selected
            ? `Published ${CATEGORY_LABELS[selected].toLowerCase()} reading from Pandit Talk writers.`
            : 'Guidance for festivals, home, work, and the questions people bring to a pandit.'}
        </p>
      </header>
      <JournalCategoryNav selected={selected} />
      {articles.length === 0 ? (
        <EscapeBlurNotice className="journal-empty panel stack" aria-label="Empty journal" aria-live="polite">
          <FocusMainHeading id="journal-empty-title" />
          <h2 id="journal-empty-title" tabIndex={-1}>
            {selected ? 'No articles in this category yet.' : 'No published articles yet.'}
          </h2>
          <p>
            {selected
              ? `Nothing is published under ${CATEGORY_LABELS[selected] || 'this category'} right now. Browse another topic, try a free tool, or prepare a private draft — new No Timer bookings are not open yet. Press Escape to leave this notice.`
              : 'The journal has no published pieces yet. You can still explore our approach, try free tools, or prepare a draft. New No Timer bookings remain closed. Press Escape to leave this notice.'}
          </p>
          <p className="sr-only" id="journal-empty-hint">Arrow keys move between empty-journal recovery links. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Empty journal next steps" aria-describedby="journal-empty-hint">
            <Link className="button" href={selected ? '/articles' : '/our-approach'}>
              {selected ? 'View all articles' : 'Explore our approach'}
            </Link>
            <Link className="button secondary" href="/guidance">Browse guidance topics</Link>
            <Link className="button secondary" href="/pandits">Explore Pandits</Link>
            <Link className="button secondary" href="/tools">Try a free tool</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
            <Link className="text-link" href="/editorial-policy">Editorial policy →</Link>
          </LinkKeyboardGroup>
        </EscapeBlurNotice>
      ) : (
        <div className="journal-grid">
          {articles.map((article, index) => (
            <ArticleCard key={article.id} article={article} featured={!selected && index === 0} />
          ))}
        </div>
      )}
    </main>
  );
}
