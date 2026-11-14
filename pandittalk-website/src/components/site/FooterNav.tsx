'use client';

import Link from 'next/link';

export function FooterNav({
  label,
  links,
}: {
  label: string;
  links: readonly (readonly [string, string])[];
}) {
  const hintId = `footer-nav-hint-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <nav
      aria-label={label}
      aria-describedby={hintId}
      onKeyDown={event => {
        if (!(event.target instanceof HTMLAnchorElement)) return;
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>('a[href]'));
        const index = items.indexOf(event.target);
        if (index < 0) return;
        let next = index;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % items.length;
        else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = items.length - 1;
        else if (event.key === 'Escape') {
          event.preventDefault();
          event.target.blur();
          return;
        }
        else return;
        event.preventDefault();
        items[next]?.focus();
      }}
    >
      <p className="sr-only" id={hintId}>Arrow keys move between {label} links. Home and End jump to the first or last. Escape blurs the focused link. Skip to content still targets site-content.</p>
      <h3>{label}</h3>
      {links.map(([href, text]) => (
        <Link key={`${href}-${text}`} href={href}>{text}</Link>
      ))}
    </nav>
  );
}
