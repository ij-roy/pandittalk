'use client';

import { useEffect, useState } from 'react';

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

export function GoBackButton({ fallbackHref = '/' }: { fallbackHref?: string }) {
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    const sync = () => setHasHistory(canGoBackSafely());
    sync();
    window.addEventListener('pageshow', sync);
    return () => window.removeEventListener('pageshow', sync);
  }, []);

  return (
    <button
      type="button"
      className="button secondary"
      aria-label={hasHistory ? 'Go back to the previous Pandit Talk page' : fallbackHref === '/' ? 'Go to Pandit Talk home' : 'Continue on Pandit Talk'}
      onClick={() => {
        // history.length is almost always > 1; only go back when the referrer is same-origin.
        if (canGoBackSafely()) {
          window.history.back();
          return;
        }
        window.location.assign(fallbackHref);
      }}
      onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        (event.currentTarget as HTMLButtonElement).blur();
      }}
    >
      {hasHistory ? 'Previous page' : fallbackHref === '/' ? 'Go home' : 'Continue'}
    </button>
  );
}
