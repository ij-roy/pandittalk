'use client';

import { useEffect } from 'react';

/** Moves keyboard focus to the primary heading once after mount (error / empty states). */
export function FocusMainHeading({ id }: { id: string }) {
  useEffect(() => {
    let timer = 0;
    function focusHeading() {
      const target = document.getElementById(id);
      if (!target) return;
      const active = document.activeElement;
      if (
        active
        && active !== document.body
        && active !== document.documentElement
        && active !== target
        && active instanceof HTMLElement
        && active.closest('a, button, input, select, textarea, summary, [tabindex]')
      ) {
        return;
      }
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      target.focus({ preventScroll: true });
    }
    timer = window.setTimeout(() => requestAnimationFrame(focusHeading), 0);
    window.addEventListener('pageshow', focusHeading);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pageshow', focusHeading);
    };
  }, [id]);
  return null;
}
