'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GoBackButton } from '@/components/site/GoBackButton';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { supportEmail } from '@/content/siteIdentity';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    const focusTitle = () => requestAnimationFrame(() => document.getElementById('error-title')?.focus());
    focusTitle();
    window.addEventListener('pageshow', focusTitle);
    return () => window.removeEventListener('pageshow', focusTitle);
  }, []);

  const contactHref = error.digest
    ? `mailto:${supportEmail}?subject=${encodeURIComponent(`Website error ${error.digest}`)}&body=${encodeURIComponent(`Error digest: ${error.digest}\n\nPlease describe what you were doing:\n`)}`
    : '/contact';

  return (
    <main id="main-content" className="page stack" style={{ maxWidth: 720 }}>
      <p className="eyebrow">Something went wrong</p>
      <h1 id="error-title" tabIndex={-1} onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        (event.currentTarget as HTMLElement).blur();
      }}>This page could not be shown.</h1>
      <p className="lede">Please try again. If you were editing a draft or form, your browser may still hold what you typed — check the page after reload before starting over. New No Timer bookings are not open yet — this error does not create or cancel a booking.</p>
      <p className="sr-only" id="error-recovery-hint">Arrow keys move between recovery actions including free tools and draft. Escape blurs the focused control. Skip to content still targets site-content.</p>
      <LinkKeyboardGroup className="actions" aria-label="Route error recovery" aria-describedby="error-recovery-hint">
        <button
          type="button"
          className="button"
          disabled={resetting}
          aria-busy={resetting || undefined}
          onClick={() => {
            setResetting(true);
            try {
              reset();
            } finally {
              setResetting(false);
            }
          }}
        >
          {resetting ? 'Retrying…' : 'Try again'}
        </button>
        <GoBackButton />
        <Link className="button secondary" href="/">Go to home</Link>
        <Link className="button secondary" href="/pandits">Explore Pandits</Link>
        <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="button secondary" href="/help">Help centre</Link>
        <Link className="button secondary" href="/how-it-works#booking-availability-how">Booking updates</Link>
        <Link className="button secondary" href="/contact">Contact support</Link>
        {error.digest ? (
          <a className="button secondary" href={contactHref}>
            Email support with reference
            <span className="sr-only"> (opens your email app)</span>
          </a>
        ) : null}
      </LinkKeyboardGroup>
      {error.digest ? <p className="expert-meta">Reference: {error.digest}</p> : null}
    </main>
  );
}
