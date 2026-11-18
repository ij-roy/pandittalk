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
        'Read astrology, vastu, numerology, tarot and spiritual guidance from Pandit Talk writers. The journal is not a live consultation; choose a Pandit separately when you are ready to talk.',
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
    description: `Read ${label.toLowerCase()} articles from Pandit Talk writers — thoughtful perspective, named authors. Not a live consultation; choose a timed session or Chat Now from a Pandit profile.`,
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
      {selected ? <FocusMainHeading id="journal-page-title" /> : null}
      <header className="journal-hero">
        <p className="eyebrow">The Pandit Talk Journal</p>
        <h1 id="journal-page-title">
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
          <h2 id="journal-empty-title" tabIndex={-1}>
            {selected ? 'No articles in this category yet.' : 'No published articles yet.'}
          </h2>
          <p>
            {selected
              ? `There are no articles in ${CATEGORY_LABELS[selected] || 'this category'} right now. Browse another topic or try a free reflection tool.`
              : 'There are no published pieces right now. Browse practical guidance or try a free reflection tool instead.'}
          </p>
          <p className="sr-only" id="journal-empty-hint">Arrow keys move between these suggestions. Escape leaves this notice.</p>
          <LinkKeyboardGroup className="actions" aria-label="Empty journal next steps" aria-describedby="journal-empty-hint">
            <Link className="button" href="/guidance">Browse guidance topics</Link>
            <Link className="button secondary" href="/tools">Try a free tool</Link>
            <Link className="text-link" href="/pandits">Explore Pandits →</Link>
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
