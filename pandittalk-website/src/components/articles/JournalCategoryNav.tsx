'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, CATEGORY_LABELS, type ArticleCategory } from '@/lib/articles/api';

export function JournalCategoryNav({ selected }: { selected?: ArticleCategory }) {
  const navRef = useRef<HTMLElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    active.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [selected]);

  useEffect(() => {
    const node = navRef.current;
    if (!node) return;
    const update = () => setCanScroll(node.scrollWidth > node.clientWidth + 4);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <>
      <p className="sr-only" id="journal-category-hint">
        Use the arrow keys to move between categories. Home and End move to the first and last category.
        Escape leaves the list or returns to All when a category is selected.
      </p>
      {canScroll ? <p className="journal-category-scroll-hint" aria-hidden="true">Swipe to explore more categories.</p> : null}
      <nav
        ref={navRef}
        className="journal-filters"
        aria-label="Article categories"
        aria-describedby="journal-category-hint"
        onKeyDown={event => {
          if (!(event.target instanceof HTMLElement)) return;
          const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>('a[href]'));
          const index = links.indexOf(event.target as HTMLAnchorElement);
          if (index < 0) return;
          if (event.key === 'Escape') {
            event.preventDefault();
            if (selected) {
              links[0]?.click();
              return;
            }
            event.target.blur();
            return;
          }
          let next = index;
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % links.length;
          else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + links.length) % links.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = links.length - 1;
          else return;
          event.preventDefault();
          links[next]?.focus();
          const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          links[next]?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
        }}
      >
        <Link
          href="/articles"
          className={chipClass(!selected)}
          aria-current={!selected ? 'page' : undefined}
        >
          All
        </Link>
        {CATEGORIES.map((id) => (
          <Link
            key={id}
            href={`/articles?category=${id}`}
            className={chipClass(selected === id)}
            aria-current={selected === id ? 'page' : undefined}
          >
            {CATEGORY_LABELS[id]}
          </Link>
        ))}
      </nav>
    </>
  );
}

function chipClass(active: boolean): string {
  return active
    ? 'journal-filter journal-filter--active'
    : 'journal-filter';
}
