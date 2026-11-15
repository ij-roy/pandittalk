'use client';

/* global-error replaces the root layout — plain <a> full navigations are safer than next/link when the app shell failed. */
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useState } from 'react';
import { supportEmail } from '@/content/siteIdentity';

function canGoBackSafely() {
  try {
    const ref = document.referrer;
    if (!ref) return false;
    const url = new URL(ref);
    return url.origin === location.origin && url.href !== location.href;
  } catch {
    return false;
  }
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [hasHistory, setHasHistory] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    setHasHistory(canGoBackSafely());
    const focusTitle = () => requestAnimationFrame(() => document.getElementById('global-error-title')?.focus());
    focusTitle();
    const sync = () => {
      setHasHistory(canGoBackSafely());
      focusTitle();
    };
    window.addEventListener('pageshow', sync);
    return () => window.removeEventListener('pageshow', sync);
  }, []);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fffaf1', color: '#292e28' }}>
        <style>{`a:focus-visible,button:focus-visible,h1:focus-visible{outline:3px solid #865713;outline-offset:4px}`}</style>
        <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
          <p style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 12, margin: 0 }}>Something went wrong</p>
          <h1 id="global-error-title" tabIndex={-1} style={{ fontSize: '1.75rem', lineHeight: 1.25, margin: '8px 0 12px' }} onKeyDown={event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            (event.currentTarget as HTMLElement).blur();
          }}>Pandit Talk could not load this page.</h1>
          <p style={{ margin: '0 0 24px', lineHeight: 1.5 }}>Please try again. If you were editing a draft or form, check the page after reload before starting over. New No Timer bookings are not open yet — this error does not create or cancel a booking.</p>
          {error.digest ? <p style={{ margin: '0 0 16px', fontSize: 13, opacity: 0.75 }}>Reference: {error.digest}</p> : null}
          <p style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }} id="global-error-recovery-hint">
            Arrow keys move between Try again, Previous page, home, contact, email, help, free tools, draft, Pandits and booking updates. Escape blurs. Skip remains site-content when the shell reloads.
          </p>
          <div
            role="group"
            aria-label="Crash recovery actions"
            aria-describedby="global-error-recovery-hint"
            style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
            onKeyDown={event => {
              const target = event.target;
              if (!(target instanceof HTMLElement)) return;
              if (!(target instanceof HTMLAnchorElement) && !(target instanceof HTMLButtonElement)) return;
              const items = Array.from(
                event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)'),
              );
              const index = items.indexOf(target);
              if (index < 0) return;
              if (event.key === 'Escape') {
                event.preventDefault();
                target.blur();
                return;
              }
              let next = index;
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % items.length;
              else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
              else if (event.key === 'Home') next = 0;
              else if (event.key === 'End') next = items.length - 1;
              else return;
              event.preventDefault();
              items[next]?.focus();
            }}
          >
            <button
              type="button"
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
              style={{ minHeight: 44, padding: '10px 18px', borderRadius: 8, border: 'none', background: '#e7b63f', color: '#292e28', fontWeight: 600, cursor: resetting ? 'wait' : 'pointer', opacity: resetting ? 0.85 : 1 }}
            >
              {resetting ? 'Retrying…' : 'Try again'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (canGoBackSafely()) {
                  window.history.back();
                  return;
                }
                window.location.assign('/');
              }}
              style={{ minHeight: 44, padding: '10px 18px', borderRadius: 8, border: '1px solid #43543d', background: 'transparent', color: '#43543d', fontWeight: 600, cursor: 'pointer' }}
            >
              {hasHistory ? 'Previous page' : 'Go home'}
            </button>
            <a
              href="/"
              style={{ minHeight: 44, padding: '10px 18px', borderRadius: 8, border: '1px solid #43543d', color: '#43543d', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontWeight: 600 }}
            >
              Go to home
            </a>
            <a
              href="/contact"
              style={{ minHeight: 44, padding: '10px 18px', display: 'inline-flex', alignItems: 'center', color: '#292e28' }}
            >
              Contact form
            </a>
            <a
              href={error.digest
                ? `mailto:${supportEmail}?subject=${encodeURIComponent(`Website error ${error.digest}`)}&body=${encodeURIComponent(`Error digest: ${error.digest}\n\nPlease describe what you were doing:\n`)}`
                : `mailto:${supportEmail}?subject=${encodeURIComponent('Website error')}&body=${encodeURIComponent('Please describe what you were doing:\n')}`}
              style={{ position: 'relative', minHeight: 44, padding: '10px 18px', display: 'inline-flex', alignItems: 'center', color: '#292e28' }}
            >
              Email support{error.digest ? ' with reference' : ''}
              <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
                {' '}(opens your email app)
              </span>
            </a>
            <a href="/help" style={{ minHeight: 44, padding: '10px 18px', display: 'inline-flex', alignItems: 'center', color: '#292e28' }}>
              Help centre
            </a>
            <a href="/tools" style={{ minHeight: 44, padding: '10px 18px', display: 'inline-flex', alignItems: 'center', color: '#292e28' }}>
              Free tools
            </a>
            <a href="/guidance/start" style={{ minHeight: 44, padding: '10px 18px', display: 'inline-flex', alignItems: 'center', color: '#292e28' }}>
              Prepare a draft
            </a>
            <a href="/pandits" style={{ minHeight: 44, padding: '10px 18px', display: 'inline-flex', alignItems: 'center', color: '#292e28' }}>
              Explore Pandits
            </a>
            <a href="/how-it-works#booking-availability-how" style={{ minHeight: 44, padding: '10px 18px', display: 'inline-flex', alignItems: 'center', color: '#292e28' }}>
              Booking updates
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
