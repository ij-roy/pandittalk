'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, useApi } from '@/lib/api/client';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { LoadingState } from '@/components/site/Skeleton';
import { notificationActionLabel, notificationDestination, notificationLabels } from './schema';
import { formatIstDateTime } from '@/lib/time/ist';
import styles from '../account/customer.module.css';

type Notice = {
  id: string;
  type: string;
  title: string;
  body: string;
  bookingId: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function Notifications() {
  const { data, error, loading, reload } = useApi<Notice[]>('/notifications');
  const count = useApi<{ count: number }>('/notifications/unread-count');
  const [busyId, setBusyId] = useState<string | 'all' | null>(null);
  const [failure, setFailure] = useState('');
  const [status, setStatus] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const invalidRef = useRef<HTMLParagraphElement>(null);
  const unreadEmptyRef = useRef<HTMLParagraphElement>(null);
  const emptyRef = useRef<HTMLElement>(null);
  const sawEmpty = useRef(false);
  const unread = Array.isArray(data) ? data.filter(n => !n.isRead).length : 0;
  const visible = Array.isArray(data) ? (unreadOnly ? data.filter(n => !n.isRead) : data) : [];
  const invalidPayload = Boolean(data && !Array.isArray(data));
  const unreadFilterEmpty = Boolean(Array.isArray(data) && unreadOnly && visible.length === 0 && data.length > 0);
  const listEmpty = Boolean(Array.isArray(data) && data.length === 0);

  useEffect(() => {
    if (error || failure) requestAnimationFrame(() => alertRef.current?.focus());
    else if (invalidPayload) requestAnimationFrame(() => invalidRef.current?.focus());
    else if (unreadFilterEmpty) requestAnimationFrame(() => unreadEmptyRef.current?.focus());
  }, [error, failure, invalidPayload, unreadFilterEmpty]);

  useEffect(() => {
    if (!listEmpty) {
      sawEmpty.current = false;
      return;
    }
    if (sawEmpty.current) return;
    sawEmpty.current = true;
    requestAnimationFrame(() => emptyRef.current?.focus());
  }, [listEmpty]);

  useEffect(() => {
    if (!unreadOnly) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setUnreadOnly(false);
      setStatus('Showing all notifications again.');
      requestAnimationFrame(() => statusRef.current?.focus());
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [unreadOnly]);

  async function mark(id?: string) {
    setBusyId(id ?? 'all');
    setFailure('');
    setStatus('');
    try {
      await api(id ? '/notifications/' + encodeURIComponent(id) + '/read' : '/notifications/read-all', {
        method: 'PATCH',
        body: '{}',
      });
      reload();
      count.reload();
      setStatus(id ? 'Notification marked as read.' : 'All notifications marked as read.');
      requestAnimationFrame(() => statusRef.current?.focus());
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'Could not mark notifications read.');
      requestAnimationFrame(() => alertRef.current?.focus());
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main id="main-content" className="page stack notifications-page" aria-busy={loading || busyId !== null ? true : undefined}>
      <div>
        <p className="eyebrow">Keep up with your conversations</p>
        <h1>Notifications</h1>
        <p className="lede">Booking reminders, session updates and messages, together. Opening this list does not create a booking or charge.</p>
      </div>
      <aside className="notice" role="status">
        <p>
          <strong>Notifications are about your account and conversations.</strong> New booking choices start from a Pandit profile.{' '}
          <span className="sr-only" id="notifications-pause-hint">Arrow keys move between Pandits, optional notes and free tools. Escape blurs. Skip remains site-content.</span>
          <LinkKeyboardGroup as="span" aria-label="Notifications next steps" aria-describedby="notifications-pause-hint">
            <Link href="/pandits">Explore Pandits</Link>
            {' · '}
            <Link href="/guidance/start">Prepare an optional note</Link>
            {' · '}
            <Link href="/tools">Try free tools</Link>
          </LinkKeyboardGroup>
          .
        </p>
      </aside>
      <div className={styles.toolbar}>
        <p className={styles.badge} aria-live="polite">
          {loading && !data
            ? 'Checking unread…'
            : `${Math.max(count.data && Number.isInteger(count.data.count) ? count.data.count : 0, unread)} unread`}
        </p>
        <p className="sr-only" id="notifications-toolbar-hint">Arrow keys move between Mark all, Refresh, Unread only, free tools and draft. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" style={{ margin: 0 }} aria-label="Notification list controls" aria-describedby="notifications-toolbar-hint">
          <button
            type="button"
            className="button secondary"
            disabled={busyId !== null || loading || unread === 0}
            aria-busy={busyId === 'all' || undefined}
            onClick={() => void mark()}
          >
            {busyId === 'all' ? 'Updating…' : 'Mark all as read'}
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={busyId !== null || loading}
            aria-busy={loading || undefined}
            onClick={() => { reload(); count.reload(); }}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          {Array.isArray(data) && data.length > 0 && (
            <button
              type="button"
              className="button secondary"
              aria-pressed={unreadOnly}
              disabled={busyId !== null}
              onClick={() => {
                setUnreadOnly(value => {
                  const next = !value;
                  setStatus(next ? 'Showing unread notifications only. Press Escape to show all.' : 'Showing all notifications again.');
                  requestAnimationFrame(() => statusRef.current?.focus());
                  return next;
                });
              }}
            >
              {unreadOnly ? 'Show all' : 'Unread only'}
            </button>
          )}
          <Link className="text-link" href="/tools">Free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft</Link>
        </LinkKeyboardGroup>
      </div>
      {loading && (
        <>
          <LoadingState label="Loading your notifications…" variant="rows" />
          <p className="sr-only" id="notifications-loading-hint">Skip to content still targets site-content. Arrow keys move between free tools and draft if loading takes longer than expected.</p>
          <LinkKeyboardGroup className="actions" aria-label="While notifications load" aria-describedby="notifications-loading-hint">
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </>
      )}
      {(error || failure) && (
        <div className="error" role="alert" tabIndex={-1} ref={alertRef} onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).blur();
        }}>
          <p>{failure || error?.message} Press Escape to leave this alert.</p>
          <p className="sr-only" id="notifications-error-hint">Arrow keys move between notification error recovery links. Escape blurs the focused control. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Notification error recovery" aria-describedby="notifications-error-hint">
            {error && (
              <button type="button" className="button secondary" onClick={reload} disabled={loading} aria-busy={loading || undefined}>
                {loading ? 'Trying again…' : 'Try again'}
              </button>
            )}
            <Link className="button secondary" href="/account/notifications">
              Notification preferences
            </Link>
            <Link className="button secondary" href="/guidance/start">
              Prepare a draft
            </Link>
            <Link className="button secondary" href="/tools">
              Try free tools
            </Link>
            <Link className="text-link" href="/contact">
              Contact support →
            </Link>
          </LinkKeyboardGroup>
        </div>
      )}
      {status && !failure && (
        <p
          className="notice"
          role="status"
          tabIndex={-1}
          ref={statusRef}
          aria-live="polite"
          onKeyDown={event => {
            if (event.key !== 'Escape' || !status) return;
            event.preventDefault();
            setStatus('');
            if (unreadOnly) setUnreadOnly(false);
          }}
        >
          {status} Press Escape to dismiss{unreadOnly ? ' (also shows all notifications)' : ''}.
        </p>
      )}
      {data && !Array.isArray(data) && (
        <div className="error" role="alert" tabIndex={-1} ref={invalidRef} onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).blur();
        }}>
          <p>Your notifications could not be read. Please try again later. Press Escape to leave this alert.</p>
          <p className="sr-only" id="notifications-invalid-hint">Arrow keys move between invalid-notifications recovery links. Escape blurs the focused control. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Invalid notifications recovery" aria-describedby="notifications-invalid-hint">
            <button type="button" className="button secondary" onClick={reload} disabled={loading} aria-busy={loading || undefined}>{loading ? 'Trying again…' : 'Try again'}</button>
            <Link className="button secondary" href="/account/notifications">Notification preferences</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/contact">Contact support →</Link>
          </LinkKeyboardGroup>
        </div>
      )}
      {Array.isArray(data) && data.length === 0 && (
        <section className={`panel stack ${styles.empty}`} role="status" tabIndex={-1} ref={emptyRef} onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).blur();
        }}>
          <h2>No notifications yet</h2>
          <p>
            Booking reminders, session updates and important account messages will appear here. Opening this page never charges coins. Press Escape to leave this notice.
          </p>
          <p className="sr-only" id="notifications-empty-hint">Arrow keys move between draft, free tools, booking updates, bookings, preferences and help. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Empty notifications recovery" aria-describedby="notifications-empty-hint">
            <Link className="button" href="/pandits">
              Explore Pandits
            </Link>
            <Link className="button secondary" href="/tools">
              Try free tools
            </Link>
            <Link className="button secondary" href="/guidance/start">
              Prepare an optional note
            </Link>
            <Link className="button secondary" href="/bookings">
              View your bookings
            </Link>
            <Link className="text-link" href="/account/notifications">
              Notification preferences →
            </Link>
            <Link className="text-link" href="/help">
              Help centre →
            </Link>
          </LinkKeyboardGroup>
        </section>
      )}
      {Array.isArray(data) && data.length > 0 && unread === 0 && !unreadOnly && (
        <p className="notice" role="status" tabIndex={-1} onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).blur();
        }}>
          You are all caught up — no unread notifications. Press Escape to leave this notice.{' '}
          <span className="sr-only" id="notifications-caught-up-hint">Arrow keys move between free tools and draft. Escape blurs. Skip remains site-content.</span>
          <LinkKeyboardGroup as="span" aria-label="Caught-up notification next steps" aria-describedby="notifications-caught-up-hint">
            <Link href="/tools">Try free tools</Link>
            {' · '}
            <Link href="/guidance/start">Prepare a draft</Link>
            {' · '}
            <Link href="/bookings">View bookings</Link>
          </LinkKeyboardGroup>
        </p>
      )}
      {unreadFilterEmpty && (
        <p className="notice" role="status" tabIndex={-1} ref={unreadEmptyRef} onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          setUnreadOnly(false);
          setStatus('Showing all notifications again.');
          requestAnimationFrame(() => statusRef.current?.focus());
        }}>
          No unread notifications.{' '}
          <span className="sr-only" id="notifications-unread-empty-hint">Arrow keys move between Show all, free tools and draft. Escape shows all. Skip remains site-content.</span>
          <LinkKeyboardGroup as="span" aria-label="Unread filter empty recovery" aria-describedby="notifications-unread-empty-hint">
            <button type="button" className="text-link" onClick={() => setUnreadOnly(false)}>Show all</button>
            {' · '}
            <Link href="/tools">Free tools</Link>
            {' · '}
            <Link href="/guidance/start">Prepare a draft</Link>
          </LinkKeyboardGroup>
          {' '}Press Escape to show all.
        </p>
      )}
      {visible.length > 0 && (
        <div
          className="stack"
          role="list"
          aria-label="Your notifications"
          aria-describedby="notifications-list-hint"
          onKeyDown={event => {
            if (!(event.target instanceof HTMLElement)) return;
            if (!(event.target instanceof HTMLAnchorElement) && !(event.target instanceof HTMLButtonElement)) return;
            const items = Array.from(
              event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)'),
            );
            const index = items.indexOf(event.target);
            if (index < 0) return;
            if (event.key === 'Escape') { event.preventDefault(); event.target.blur(); return; }
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
      {visible.map(n => {
          const href = notificationDestination(n.bookingId);
          return (
            <article
              className={`panel stack ${!n.isRead ? styles.unread : ''}`}
              role="listitem"
              key={n.id}
              aria-labelledby={`notice-title-${n.id}`}
            >
              <div className={styles.cardHeader}>
                <p className="eyebrow">{notificationLabels[n.type] ?? 'Account update'}</p>
                <span className={styles.badge}>{n.isRead ? 'Read' : 'Unread'}</span>
              </div>
              <h2 id={`notice-title-${n.id}`}>{n.title}</h2>
              <p>{n.body}</p>
              <small>
                <time dateTime={n.createdAt}>{formatIstDateTime(n.createdAt)}</time>
              </small>
              <p className="sr-only" id={`notice-actions-${n.id}-hint`}>Arrow keys move between Open, Mark as read, preferences, free tools and draft for this notification. Escape blurs. Skip remains site-content.</p>
              <LinkKeyboardGroup className="actions" aria-label={`Actions for ${n.title}`} aria-describedby={`notice-actions-${n.id}-hint`}>
                {href && (
                  <Link
                    className="button secondary"
                    href={href}
                    onClick={() => {
                      if (!n.isRead) void mark(n.id);
                    }}
                  >
                    {notificationActionLabel(n.type)}
                  </Link>
                )}
                {!n.isRead && (
                  <button type="button" className="button secondary" disabled={busyId !== null} aria-busy={busyId === n.id || undefined} onClick={() => void mark(n.id)}>
                    {busyId === n.id ? 'Updating…' : 'Mark as read'}
                  </button>
                )}
                <Link className="text-link" href="/account/notifications">Notification preferences →</Link>
                <Link className="text-link" href="/tools">Try free tools →</Link>
                <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
              </LinkKeyboardGroup>
            </article>
          );
        })}
        </div>
      )}
      {visible.length > 0 && (
        <p className="sr-only" id="notifications-list-hint">Arrow keys move between notification action links and Mark as read buttons across cards. Home and End jump to the first or last. Escape blurs the focused control.</p>
      )}
      <p className="sr-only" id="notifications-prefs-hint">Arrow keys move between preference shortcuts, free tools and draft. Escape blurs the focused link. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions" aria-label="Notification preferences shortcut" aria-describedby="notifications-prefs-hint">
        <Link className="text-link" href="/account/notifications">
          Manage notification preferences →
        </Link>
        <Link className="text-link" href="/pandits">
          Choose a Pandit →
        </Link>
        <Link className="text-link" href="/tools">
          Try free tools →
        </Link>
        <Link className="text-link" href="/guidance/start">
          Prepare a draft →
        </Link>
      </LinkKeyboardGroup>
    </main>
  );
}
