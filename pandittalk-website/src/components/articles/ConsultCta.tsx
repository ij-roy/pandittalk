'use client';

import Link from 'next/link';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { OfferNotice } from '@/components/site/OfferNotice';
import { recordArticleEvent } from '@/lib/articles/events';
import { PLAY_STORE_URL } from '@/lib/articles/site';
import { expertFirstName } from '@/features/experts/types';

export function ConsultCta({
  slug,
  authorName,
  authorHref,
  authorId,
}: {
  slug: string;
  authorName: string;
  authorHref?: string | null;
  authorId?: string | null;
}) {
  const profileHref = authorId ? `/pandits/${encodeURIComponent(authorId)}` : '/pandits';
  const prepareHref = authorId
    ? `/guidance/start?expertId=${encodeURIComponent(authorId)}`
    : '/guidance/start';
  const shortName = expertFirstName(authorName);
  const track = () => recordArticleEvent(slug, 'cta_click');

  return (
    <aside className="journal-consult" aria-labelledby="journal-consult-title">
      <p className="eyebrow">A personal conversation · bookings paused</p>
      <h2 id="journal-consult-title">Prepare a private draft</h2>
      <p>
        {authorName} writes on Pandit Talk. Explore their profile or prepare a private draft. New No Timer bookings are not open yet — preparing a draft does not create a charge or notify the Pandit.
      </p>
      <p className="sr-only" id="journal-consult-keys">Arrow keys move between prepare actions. Escape blurs.</p>
      <LinkKeyboardGroup className="journal-consult__actions" aria-label="Prepare a private draft" aria-describedby="journal-consult-keys">
        <Link className="button" href={profileHref} onClick={track}>
          {authorId ? `View ${shortName}'s profile` : 'Explore Pandits'}
        </Link>
        <Link className="button secondary" href={prepareHref} onClick={track}>
          Prepare a draft
        </Link>
        <details
          className="journal-consult__more"
          onKeyDown={event => {
            if (event.key !== 'Escape') return;
            const root = event.currentTarget;
            if (!root.open) return;
            event.preventDefault();
            root.open = false;
            root.querySelector('summary')?.focus();
          }}
        >
          <summary>More ways to continue<span className="sr-only"> (expand or collapse; Escape closes)</span></summary>
          <div className="stack">
            <p className="sr-only" id="journal-consult-more-hint">Arrow keys move between more-ways links including free tools and booking updates. Escape closes this disclosure from the summary.</p>
            <LinkKeyboardGroup className="journal-consult__more-links" aria-label="More ways to continue" aria-describedby="journal-consult-more-hint">
              {authorHref ? (
                <Link className="text-link" href={authorHref} onClick={track}>
                  Journal author page →
                </Link>
              ) : null}
              <Link className="text-link" href="/tools" onClick={track}>
                Try free tools →
              </Link>
              <Link className="text-link" href="/how-it-works#booking-availability-how" onClick={track}>
                Get booking updates →
              </Link>
              <a className="text-link" href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" onClick={track}>
                Android app on Google Play →<span className="sr-only"> (opens in a new tab; timed in-app packages may still apply — not website No Timer)</span>
              </a>
              <Link className="text-link" href="/download" onClick={track}>
                App download details →
              </Link>
            </LinkKeyboardGroup>
            <p className="expert-meta">The Android app may still offer timed Chat Now or Book Session while website No Timer booking stays closed.</p>
          </div>
        </details>
      </LinkKeyboardGroup>
      <OfferNotice compact source="website_article_consult" />
    </aside>
  );
}
