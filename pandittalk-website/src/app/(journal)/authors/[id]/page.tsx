import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { EscapeBlurNotice } from '@/components/site/EscapeBlurNotice';
import { FocusMainHeading } from '@/components/site/FocusMainHeading';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { SoftResourceNotFound } from '@/components/site/SoftResourceNotFound';
import { fetchAuthor } from '@/lib/articles/api';
import { PLAY_STORE_URL } from '@/lib/articles/site';

export const revalidate = 60;

async function expertExists(id: string) {
  try {
    const response = await fetch(`${process.env.BACKEND_URL || process.env.API_BASE || 'https://api.pandittalk.com'}/experts/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchAuthor(id);
  if (!data) {
    return {
      title: 'Author not found',
      description: 'This journal author profile is not available on Pandit Talk.',
      robots: { index: false, follow: true },
      alternates: { canonical: '/articles' },
    };
  }
  return {
    title: data.author.name,
    description: data.author.headline || `Articles by ${data.author.name} on Pandit Talk.`,
    alternates: { canonical: `/authors/${id}` },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchAuthor(id);
  if (!data) {
    return (
      <SoftResourceNotFound
        eyebrow="Journal author"
        title="This author could not be found."
        description="The profile may have been removed or the link is outdated. Opening an author page does not create a booking or charge. Browse the journal, explore Pandits, or prepare a private draft."
        primaryHref="/articles"
        primaryLabel="Browse the journal"
        links={[
          { href: '/pandits', label: 'Explore Pandits' },
          { href: '/tools', label: 'Try free tools' },
          { href: '/guidance/start', label: 'Prepare a draft' },
          { href: '/editorial-policy', label: 'Editorial policy' },
        ]}
        notifySource="website_author_missing"
      />
    );
  }
  const hasExpert = await expertExists(id);

  return (
    <main id="main-content" className="page journal-page">
      <Link href="/articles" className="journal-back"><span aria-hidden="true">←</span> Back to the journal</Link>
      <header className="journal-author">
        {data.author.imageUrl ? (
          <img
            src={data.author.imageUrl}
            alt={data.author.name}
            className="journal-author__avatar"
            width={96}
            height={96}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="journal-author__avatar" aria-hidden="true">{data.author.name.trim().charAt(0)}</div>
        )}
        <div>
          <p className="eyebrow">
            {data.author.specialty || 'Author'}
          </p>
          <h1>{data.author.name}</h1>
          {data.author.headline ? <p className="lede">{data.author.headline}</p> : null}
          <p className="sr-only" id="author-profile-hint">Arrow keys move between author next steps. Escape blurs. OfferNotice still requires source. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Author profile next steps" aria-describedby="author-profile-hint">
            {hasExpert ? (
              <>
                <Link className="button" href={`/pandits/${encodeURIComponent(id)}`}>
                  View Pandit profile
                </Link>
                <Link className="button secondary" href={`/guidance/start?expertId=${encodeURIComponent(id)}`}>
                  Prepare a draft
                </Link>
                <Link className="button secondary" href="/tools">Try free tools</Link>
              </>
            ) : (
              <>
                <Link className="button" href="/pandits">Explore Pandits</Link>
                <Link className="button secondary" href="/articles">More journal articles</Link>
                <Link className="button secondary" href="/tools">Try free tools</Link>
              </>
            )}
            <a className="text-link" href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
              Android app on Google Play →<span className="sr-only"> (opens in a new tab; timed in-app packages may still apply)</span>
            </a>
            <Link className="text-link" href="/download">iPhone App Store waitlist →</Link>
          </LinkKeyboardGroup>
          <p className="expert-meta">Preparing an optional note does not create a charge. Explore the Pandit profile to see scheduled availability or Chat Now before you decide.</p>
        </div>
      </header>
      <h2 className="journal-section-title">Published articles</h2>
      {data.articles.length === 0 ? (
        <EscapeBlurNotice className="journal-empty stack" aria-label="Author has no published articles" aria-live="polite">
          <FocusMainHeading id="author-empty-title" />
          <h3 id="author-empty-title" tabIndex={-1}>No published articles yet</h3>
          <p>
            This Pandit has not published journal articles here yet. You can still explore their consultation profile,
            prepare an optional note, or browse other journal pieces. Preparing a note does not notify the Pandit or create a charge. Press Escape to leave this notice.
          </p>
          <p className="sr-only" id="author-empty-hint">Arrow keys move between journal, profile or Pandits, optional note when shown, free tools and editorial policy. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Author empty articles next steps" aria-describedby="author-empty-hint">
            <Link className="button secondary" href="/articles">Explore the journal</Link>
            {hasExpert
              ? <Link className="button secondary" href={`/pandits/${encodeURIComponent(id)}`}>View consultation profile</Link>
              : <Link className="button secondary" href="/pandits">Explore Pandits</Link>}
            {hasExpert && (
              <Link className="button secondary" href={`/guidance/start?expertId=${encodeURIComponent(id)}`}>
                Prepare a draft
              </Link>
            )}
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="text-link" href="/editorial-policy">Editorial policy →</Link>
            <Link className="text-link" href="/pandits">Explore Pandits →</Link>
          </LinkKeyboardGroup>
        </EscapeBlurNotice>
      ) : (
        <div className="journal-grid">
          {data.articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </main>
  );
}
