'use client';

export function BackToTop() {
  return (
    <a
      className="text-link"
      href="#site-content"
      aria-label="Back to top of page content"
      onClick={event => {
        const target = document.getElementById('site-content');
        if (!target) return;
        event.preventDefault();
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        target.focus({ preventScroll: true });
        history.replaceState(null, '', '#site-content');
      }}
      onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        (event.currentTarget as HTMLElement).blur();
      }}
    >
      Back to top
    </a>
  );
}
