'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useApi } from '@/lib/api/client';
import { OfferNotice } from '@/components/site/OfferNotice';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { ExpertPortrait } from './ExpertDirectory';
import { expertFirstName, isGenericSeedBio, isPublicReview, presenceLabel, reviewAuthorLabel, trustworthyReviewStats, type Expert } from './types';
import { formatIstDate } from '@/lib/time/ist';

function ProfileLoading() {
  return (
    <div className="profile-loading stack" aria-busy="true">
      <p role="status" className="expert-meta">Loading this Pandit&apos;s introduction…</p>
      <p className="sr-only" id="expert-loading-hint">Skip to content still targets site-content. Arrow keys move between free tools and draft if loading takes longer than expected. OfferNotice still requires source.</p>
      <LinkKeyboardGroup className="actions" aria-label="While this Pandit profile loads" aria-describedby="expert-loading-hint">
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        <Link className="text-link" href="/pandits">Back to directory →</Link>
      </LinkKeyboardGroup>
      <div className="profile-top" aria-hidden="true">
        <span className="expert-avatar skeleton-block" style={{ width: 150, height: 175 }} />
        <div className="skeleton-copy" style={{ flex: 1 }}>
          <span className="skeleton-line shorter" />
          <span className="skeleton-line" />
          <span className="skeleton-line short" />
        </div>
      </div>
    </div>
  );
}

export function ExpertDetail({ id }: { id: string }) {
  const { data: expert, error, loading, reload } = useApi<Expert>('/experts/' + encodeURIComponent(id));
  const unavailable = !loading && (error || !expert);
  const [stickyHidden, setStickyHidden] = useState(false);
  const sawReviewsEmpty = useRef(false);

  useEffect(() => {
    if (!unavailable) return;
    requestAnimationFrame(() => document.getElementById('expert-unavailable-title')?.focus());
  }, [unavailable]);

  useEffect(() => {
    if (!expert || unavailable) {
      sawReviewsEmpty.current = false;
      return;
    }
    const { total } = trustworthyReviewStats(expert);
    const publicReviews = (expert.reviews || []).filter(isPublicReview);
    if (total !== 0 && publicReviews.length !== 0) {
      sawReviewsEmpty.current = false;
      return;
    }
    if (sawReviewsEmpty.current) return;
    sawReviewsEmpty.current = true;
    requestAnimationFrame(() => document.getElementById('expert-reviews-empty')?.focus());
  }, [expert, unavailable]);

  useEffect(() => {
    try {
      setStickyHidden(sessionStorage.getItem(`pt-sticky-hide:${id}`) === '1');
    } catch {
      setStickyHidden(false);
    }
  }, [id]);

  if (loading) return <ProfileLoading />;

  if (error || !expert) {
    const missing = !error && !expert;
    const notFound = Boolean(error && /404|not found|unavailable/i.test(error.message));
    const loadFailed = Boolean(error && !(missing || notFound));
    return (
      <div className="panel stack" role={loadFailed ? 'alert' : 'status'} tabIndex={-1} onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        (event.currentTarget as HTMLElement).blur();
      }}>
        <h1 id="expert-unavailable-title" tabIndex={-1}>{missing || notFound ? 'This Pandit could not be found.' : 'This profile is temporarily unavailable.'}</h1>
        <p>{missing || notFound
          ? 'The link may be old, or the profile is no longer listed. Exploring profiles does not create a booking or charge. Press Escape to leave this notice.'
          : 'We could not load this introduction. Check your connection and try again. Press Escape to leave this alert.'}</p>
        <p className="sr-only" id="expert-missing-hint">Arrow keys move between missing-Pandit recovery actions. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
        <LinkKeyboardGroup className="actions" aria-label="Missing Pandit recovery" aria-describedby="expert-missing-hint">
          {loadFailed && <button className="button secondary" type="button" onClick={reload} disabled={loading} aria-busy={loading || undefined}>{loading ? 'Retrying…' : 'Retry'}</button>}
          <Link className="button" href="/pandits">Explore Pandits</Link>
          <Link className="button secondary" href="/guidance">Find guidance by topic</Link>
          <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
          <Link className="text-link" href="/contact">Contact support →</Link>
        </LinkKeyboardGroup>
        {(missing || notFound) && (
          <div style={{ marginTop: 12 }}>
            <p className="expert-meta">Want a note when No Timer booking opens?</p>
            <NotifyOpenForm source="website_pandit_missing" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pandit-profile">
      <div className="profile-top">
        <ExpertPortrait expert={expert} />
        <div>
          <p className="eyebrow">Pandit profile · bookings paused</p>
          <h1 id="profile-heading" tabIndex={-1}>{expert.name}</h1>
          <p className="lede">{expert.specialty}</p>
          <p>{expert.languages.join(' · ') || 'Languages not listed'}{expert.experience > 0 ? ` · ${expert.experience} ${expert.experience === 1 ? 'year' : 'years'} of practice` : ''}</p>
          <p>
            <span className={`presence${expert.isOnline ? ' is-online' : ''}`}>{presenceLabel(expert.isOnline)}</span>
            {' · '}App presence does not open a booking on this website.
          </p>
        </div>
      </div>

      <section className="section split-section">
        <div>
          <h2>In their own words</h2>
          {isGenericSeedBio(expert.bio) ? (
            <>
              <p>A fuller personal introduction is still being prepared for this profile.</p>
              <p className="expert-meta">Specialty and languages above are listed; the written bio will appear once the practitioner publishes one.</p>
            </>
          ) : (
            <p>{expert.bio}</p>
          )}
          <p className="sr-only" id="expert-bio-journal-hint">Arrow keys move between journal and trust links. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup as="p" className="expert-meta" aria-label="Pandit bio related links" aria-describedby="expert-bio-journal-hint" style={{ margin: 0 }}>
            <Link className="text-link" href="/articles">Browse the Pandit Talk journal →</Link>
            {' · '}
            <Link className="text-link" href="/trust#how-to-check">How we check claims →</Link>
            {' · '}
            <Link className="text-link" href="/editorial-policy">Editorial policy →</Link>
          </LinkKeyboardGroup>
        </div>
        <aside className="panel">
          <h3>Prepare a future draft with {expertFirstName(expert.name)}</h3>
          <p>Save preferred format and notes for later. New No Timer bookings are not open yet — exploring a profile does not create a charge or notify the Pandit.</p>
          <OfferNotice compact source="website_pandit_profile" />
          <p className="expert-meta">No session price is shown while new bookings are paused. Existing bookings keep their agreed terms.</p>
          <p className="sr-only" id="expert-draft-hint">Arrow keys move between draft, chat-format draft, tools, bookings and pricing. Escape blurs. OfferNotice still requires source.</p>
          <LinkKeyboardGroup className="actions" aria-label="Pandit profile draft shortcuts" aria-describedby="expert-draft-hint">
            <Link className="button profile-primary-cta" href={'/guidance/start?expertId=' + encodeURIComponent(expert.id)}>Prepare a draft</Link>
            <Link className="text-link profile-draft-restore" href={`/guidance/start?expertId=${encodeURIComponent(expert.id)}&format=chat`}>Save chat as preferred format (not live) →</Link>
            <Link className="text-link" href="/tools">Try free tools</Link>
            <Link className="text-link" href="/login?returnTo=%2Fbookings&reason=auth">Sign in to view bookings</Link>
            <Link className="text-link" href="/pricing">Understand pricing</Link>
          </LinkKeyboardGroup>
        </aside>
      </section>

      {!stickyHidden && (
      <div
        className="profile-sticky-cta"
        role="region"
        aria-label="Prepare a draft while new bookings are paused"
        aria-describedby="sticky-booking-pause"
        onKeyDown={event => {
          if (event.key !== 'Escape') return;
          // Escape inside the waitlist field should clear/dismiss the form, not hide the whole bar.
          const target = event.target;
          if (target instanceof HTMLElement && target.closest('.notify-open-form')) return;
          event.preventDefault();
          setStickyHidden(true);
          try { sessionStorage.setItem(`pt-sticky-hide:${id}`, '1'); } catch { /* ignore */ }
          requestAnimationFrame(() => {
            const restore = document.querySelector<HTMLElement>('.profile-draft-restore')
              || document.getElementById('profile-heading');
            restore?.focus();
          });
        }}
      >
        <p className="expert-meta" id="sticky-booking-pause">New bookings paused · draft only. Notify emails are for booking open, not draft delivery.</p>
        <LinkKeyboardGroup className="actions" style={{ margin: '8px 0' }} aria-label="Pandit sticky draft actions" aria-describedby="sticky-booking-pause">
          <Link className="button" href={'/guidance/start?expertId=' + encodeURIComponent(expert.id)}>Prepare a draft</Link>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/how-it-works#booking-availability-how">Get a note when booking opens →</Link>
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setStickyHidden(true);
              try { sessionStorage.setItem(`pt-sticky-hide:${id}`, '1'); } catch { /* ignore */ }
              requestAnimationFrame(() => {
                const restore = document.querySelector<HTMLElement>('.profile-draft-restore')
                  || document.getElementById('profile-heading');
                restore?.focus();
              });
            }}
          >
            Hide this bar for now
          </button>
        </LinkKeyboardGroup>
        <NotifyOpenForm source="website_pandit_sticky" submitLabel="Notify me" helpText="Private list for booking-open updates only — not draft delivery. See our" />
      </div>
      )}

      <section className="section">
        <h2>From past conversations</h2>
        {(() => {
          const { rating, total } = trustworthyReviewStats(expert);
          const publicReviews = (expert.reviews || []).filter(isPublicReview);
          if (total === 0 || publicReviews.length === 0) {
            return (
              <div
                className="panel stack"
                role="status"
                id="expert-reviews-empty"
                tabIndex={-1}
                aria-live="polite"
                onKeyDown={event => {
                  if (event.key !== 'Escape') return;
                  event.preventDefault();
                  (event.currentTarget as HTMLElement).blur();
                }}
              >
                <p>No reviews published yet. Exploring a profile does not create a booking or charge. New No Timer bookings are not open yet — preparing a draft does not notify this Pandit.</p>
                <p className="sr-only" id="expert-reviews-empty-hint">Arrow keys move between Prepare a draft, free tools, trust how-to-check and booking updates. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
                <LinkKeyboardGroup className="actions" aria-label="Pandit reviews empty next steps" aria-describedby="expert-reviews-empty-hint">
                  <Link className="button secondary" href={'/guidance/start?expertId=' + encodeURIComponent(expert.id)}>Prepare a draft with {expertFirstName(expert.name)}</Link>
                  <Link className="button secondary" href="/tools">Try a free tool</Link>
                  <Link className="text-link" href="/trust#how-to-check">How we check claims →</Link>
                  <Link className="text-link" href="/how-it-works#booking-availability-how">Get booking updates →</Link>
                </LinkKeyboardGroup>
              </div>
            );
          }
          return (
            <>
              <p>{rating}/5 from {total} published {total === 1 ? 'review' : 'reviews'} (eligibility-filtered)</p>
              <p className="sr-only" id="expert-reviews-list-hint">Arrow keys move between review articles. Home and End jump to the first or last. Escape blurs the focused review. Skip remains site-content.</p>
              <div
                className="stack"
                role="list"
                aria-label="Published reviews"
                aria-describedby="expert-reviews-list-hint"
                onKeyDown={event => {
                  if (!(event.target instanceof HTMLElement)) return;
                  const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('article.review'));
                  const article = event.target.closest('article.review') as HTMLElement | null;
                  const index = article ? items.indexOf(article) : -1;
                  if (index < 0) return;
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    article?.blur();
                    return;
                  }
                  let next = index;
                  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % items.length;
                  else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
                  else if (event.key === 'Home') next = 0;
                  else if (event.key === 'End') next = items.length - 1;
                  else return;
                  event.preventDefault();
                  items[next]?.focus();
                }}
              >
                {publicReviews.map(review => (
                  <article className="review" role="listitem" tabIndex={0} key={review.id}>
                    <p>
                      {review.rating}/5 · {reviewAuthorLabel(review.user_first_name)} ·{' '}
                      {formatIstDate(review.created_at)}
                    </p>
                    {review.comment && <blockquote>{review.comment}</blockquote>}
                  </article>
                ))}
              </div>
              <p className="sr-only" id="expert-reviews-next-hint">Arrow keys move between draft, tools, trust and booking updates after reviews. Escape blurs. Skip remains site-content. OfferNotice still requires source.</p>
              <LinkKeyboardGroup className="actions" aria-label="After reading Pandit reviews" aria-describedby="expert-reviews-next-hint">
                <Link className="button secondary" href={'/guidance/start?expertId=' + encodeURIComponent(expert.id)}>Prepare a draft</Link>
                <Link className="button secondary" href="/tools">Try free tools</Link>
                <Link className="text-link" href="/trust#how-to-check">How we check claims →</Link>
                <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
              </LinkKeyboardGroup>
            </>
          );
        })()}
        <p className="expert-meta">Individual experiences are not promises of future outcomes. Seed, test and ineligible reviews are hidden. Published ratings are not a guarantee of your result.</p>
      </section>
    </div>
  );
}
