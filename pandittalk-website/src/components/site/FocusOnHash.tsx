'use client';

import { useEffect } from 'react';

/** Scrolls and focuses a target when the URL hash matches (e.g. deep-linked waitlist blocks). */
export function FocusOnHash({ hash, targetId }: { hash: string; targetId: string }) {
  useEffect(() => {
    const normalized = hash.startsWith('#') ? hash : `#${hash}`;
    let attempts = 0;
    let timer = 0;
    function focusTarget() {
      if (location.hash !== normalized) return;
      const target = document.getElementById(targetId);
      if (!target) {
        if (attempts < 8) {
          attempts += 1;
          timer = window.setTimeout(focusTarget, 50 * attempts);
        }
        return;
      }
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    focusTarget();
    window.addEventListener('hashchange', focusTarget);
    // bfcache restores can keep the hash without firing hashchange — re-focus then.
    window.addEventListener('pageshow', focusTarget);
    return () => {
      window.removeEventListener('hashchange', focusTarget);
      window.removeEventListener('pageshow', focusTarget);
      window.clearTimeout(timer);
    };
  }, [hash, targetId]);
  return null;
}
