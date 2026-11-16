'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useApi } from '@/lib/api/client';
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
  const prevUnread = useRef<number | null>(null);
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

  return (
    <div className={styles.navWrap}>
      <p className="sr-only" aria-live="polite">
        {liveUnread}
      </p>
      <nav className={styles.navigation} aria-label="Your account" aria-busy={unread.loading || undefined}>
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
