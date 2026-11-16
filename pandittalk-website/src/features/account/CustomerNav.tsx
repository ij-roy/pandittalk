'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { useApi } from '@/lib/api/client';
import { availabilityCopy } from '@/content/availability';
import styles from './customer.module.css';

const links = [
  ['/home', 'Overview'],
  ['/bookings', 'Bookings'],
  ['/wallet', 'Wallet'],
  ['/reports', 'Reports'],
  ['/notifications', 'Updates'],
  ['/account', 'Account'],
] as const;

export default function CustomerNav() {
  const pathname = usePathname();
  const unread = useApi<{ count: number }>('/notifications/unread-count');
  const unreadCount = unread.data && Number.isInteger(unread.data.count) ? unread.data.count : 0;
  const navRef = useRef<HTMLElement>(null);
  const prevUnread = useRef<number | null>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [liveUnread, setLiveUnread] = useState('');

  useEffect(() => {
    if (unread.loading) return;
    if (prevUnread.current === null) {
      prevUnread.current = unreadCount;
      return;
    }
    if (prevUnread.current === unreadCount) return;
    prevUnread.current = unreadCount;
    setLiveUnread(
      unreadCount > 0
        ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'} in your account.`
        : 'No unread updates.',
    );
  }, [unreadCount, unread.loading]);

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

  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    active.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [pathname]);

  useEffect(() => {
    const node = navRef.current;
    if (!node) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const current = node.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
        if (current && document.activeElement !== current) {
          event.preventDefault();
          current.focus();
          const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          current.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
        } else if (document.activeElement instanceof HTMLElement && node.contains(document.activeElement)) {
          event.preventDefault();
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return;
      const items = Array.from(node.querySelectorAll<HTMLAnchorElement>('a[href]'));
      if (items.length === 0) return;
      const index = items.indexOf(document.activeElement as HTMLAnchorElement);
      if (index < 0) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % items.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
      else if (event.key === 'Home') next = 0;
      else next = items.length - 1;
      items[next]?.focus();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      items[next]?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    };
    node.addEventListener('keydown', onKey);
    return () => node.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={styles.navWrap}>
      <p className="sr-only" aria-live="polite">
        {liveUnread}
      </p>
      <p className={styles.pauseNote} role="status">
        <strong>{availabilityCopy.publicStatus}</strong> Existing bookings and account records stay available.{' '}
        <span className="sr-only" id="customer-nav-pause-hint">Arrow keys move between booking updates, draft and free tools. Escape blurs. Skip remains site-content.</span>
        <LinkKeyboardGroup as="span" aria-label="Customer nav pause links" aria-describedby="customer-nav-pause-hint">
          <Link href="/pandits">Explore Pandits</Link>
          {' · '}
          <Link href="/guidance/start">Prepare a draft</Link>
          {' · '}
          <Link href="/tools">Free tools</Link>
        </LinkKeyboardGroup>
      </p>
      <p className={canScroll ? styles.navHint : 'sr-only'} id="customer-nav-scroll-hint">
        {canScroll ? 'Swipe for more sections. ' : ''}Use left and right arrow keys to move between sections. Escape returns to the current section, or blurs when you are already there. Skip to content still targets site-content.
      </p>
      <nav ref={navRef} className={styles.navigation} aria-label="Your account" aria-describedby="customer-nav-scroll-hint" aria-busy={unread.loading || undefined}>
      {links.map(([href, label]) => {
        const active = pathname === href || pathname.startsWith(`${href}/`) ||
          (href === '/bookings' && pathname.startsWith('/sessions/')) ||
          (href === '/account' && pathname === '/profile-setup');
        const isUpdates = href === '/notifications';
        const text = isUpdates && unreadCount > 0 ? `${label} (${unreadCount})` : label;
        const ariaLabel = isUpdates && unreadCount > 0 ? `Updates, ${unreadCount} unread` : undefined;
        return (
          <Link
            href={href}
            key={href}
            aria-current={active ? 'page' : undefined}
            aria-label={ariaLabel}
          >
            {text}
          </Link>
        );
      })}
      </nav>
    </div>
  );
}
