'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useApi } from '@/lib/api/client';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { canResume, parseBooking, type Booking } from '@/features/bookings/types';
import { formatIstDateTime } from '@/lib/time/ist';

type Wallet = { coinBalance: number };
type Unread = { count: number };

export function HomeOverview() {
  const bookings = useApi<unknown[]>('/bookings');
  const wallet = useApi<Wallet>('/wallet');
  const unread = useApi<Unread>('/notifications/unread-count');
  const errorRef = useRef<HTMLDivElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);
  const sawEmpty = useRef(false);

  let next: Booking | undefined;
  let bookingCount = 0;
  if (Array.isArray(bookings.data)) {
    const parsed = bookings.data.flatMap((row) => {
      try { return [parseBooking(row)]; } catch { return []; }
    });
    bookingCount = parsed.length;
    const now = Date.now();
    next = parsed
      .filter(b => canResume(b) && Date.parse(b.startTime) + (b.durationMinutes || 60) * 60000 > now)
      .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))[0];
  }

  const unreadCount = unread.data && Number.isInteger(unread.data.count) ? unread.data.count : null;
  const balance = wallet.data && Number.isFinite(wallet.data.coinBalance) ? wallet.data.coinBalance : null;
  const emptyHome = !bookings.loading && !bookings.error && bookingCount === 0;
  const anyError = Boolean(bookings.error || wallet.error || unread.error);
  const loading = bookings.loading || wallet.loading || unread.loading;

  useEffect(() => {
    if (anyError) requestAnimationFrame(() => errorRef.current?.focus());
  }, [anyError]);

  useEffect(() => {
    if (!emptyHome || anyError) {
      if (!emptyHome) sawEmpty.current = false;
      return;
    }
    if (sawEmpty.current) return;
    sawEmpty.current = true;
    requestAnimationFrame(() => emptyRef.current?.focus());
  }, [emptyHome, anyError]);

  function retryAll() {
    bookings.reload();
    wallet.reload();
    unread.reload();
  }

  return (
    <section className="panel stack" aria-label="At a glance" aria-busy={loading || undefined}>
      <div className="actions" style={{ margin: 0, justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>At a glance</h2>
        <p className="sr-only" id="home-overview-refresh-hint">Arrow keys move between Refresh, free tools and draft. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" style={{ margin: 0 }} aria-label="Home overview toolbar" aria-describedby="home-overview-refresh-hint">
          <button
            type="button"
            className="button secondary"
            disabled={loading}
            aria-busy={loading || undefined}
            onClick={retryAll}
          >
            {loading ? 'Refreshing…' : 'Refresh overview'}
          </button>
          <Link className="text-link" href="/tools">Free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft</Link>
        </LinkKeyboardGroup>
      </div>
      {loading && !anyError && !emptyHome && (
        <>
          <p className="notice" role="status">Refreshing your overview…</p>
          <p className="sr-only" id="home-overview-loading-hint">Skip to content still targets site-content. Arrow keys move between free tools and draft if loading takes longer than expected.</p>
          <LinkKeyboardGroup className="actions" aria-label="While home overview loads" aria-describedby="home-overview-loading-hint">
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </>
      )}
      {emptyHome && (
        <div className="notice stack" role="status" tabIndex={-1} ref={emptyRef} onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).blur();
        }}>
          <p>
            Nothing personal to show yet. Explore Pandits to choose a scheduled session or Chat Now. Press Escape to leave this notice.
          </p>
          <p className="sr-only" id="home-empty-hint">Arrow keys move between empty-home recovery links. Escape blurs the focused link. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Empty home recovery" aria-describedby="home-empty-hint">
            <Link className="button secondary" href="/pandits">Explore Pandits</Link>
            <Link className="button secondary" href="/guidance/start">Prepare an optional note</Link>
            <Link className="button secondary" href="/tools">Try a free tool</Link>
            <Link className="text-link" href="/how-it-works">How it works →</Link>
          </LinkKeyboardGroup>
        </div>
      )}
      {anyError && (
        <div className="error" role="alert" tabIndex={-1} ref={errorRef} onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).blur();
        }}>
          <p>Some overview details could not be loaded. You can retry, or open each section below. Press Escape to leave this alert.</p>
          <p className="sr-only" id="home-error-hint">Arrow keys move between home overview error recovery links. Escape blurs the focused control. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Home overview error recovery" aria-describedby="home-error-hint">
            <button type="button" className="button secondary" onClick={retryAll} disabled={loading} aria-busy={loading || undefined}>{loading ? 'Retrying…' : 'Retry overview'}</button>
            <Link className="button secondary" href="/bookings">Bookings</Link>
            <Link className="button secondary" href="/wallet">Wallet</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/contact">Contact support →</Link>
          </LinkKeyboardGroup>
        </div>
      )}
      {!emptyHome || anyError ? (
      <ul className="topic-question-list">
        <li>
          {next ? (
            <>
              <span className="sr-only" id="home-glance-booking-hint">Arrow keys move between booking detail and Open session. Escape blurs. Skip remains site-content.</span>
              <LinkKeyboardGroup as="span" aria-label="Next open booking links" aria-describedby="home-glance-booking-hint">
                Next open booking:{' '}
                <Link href={`/bookings/${encodeURIComponent(next.id)}`}>
                  {formatIstDateTime(next.startTime)}
                  {(next.panditName || next.pandit?.name) ? ` · ${next.panditName || next.pandit?.name}` : ''}
                </Link>
                {' · '}{next.format}
                {' · '}
                <Link href={`/sessions/${encodeURIComponent(next.id)}/${next.format}`}>
                  Open existing {next.format} session
                </Link>
                <span> (no new charge)</span>
              </LinkKeyboardGroup>
            </>
          ) : bookings.loading ? 'Checking bookings…' : bookings.error ? (
            <>
              <span className="sr-only" id="home-glance-booking-retry-hint">Arrow keys move between Try again, Open bookings, free tools and draft. Escape blurs. Skip remains site-content.</span>
              <LinkKeyboardGroup as="span" aria-label="Bookings overview retry" aria-describedby="home-glance-booking-retry-hint">
                <span>Bookings unavailable. </span>
                <button type="button" className="text-link" onClick={bookings.reload} disabled={bookings.loading} aria-busy={bookings.loading || undefined}>{bookings.loading ? 'Trying again…' : 'Try again'}</button>
                <span> · </span>
                <Link href="/bookings">Open bookings</Link>
                {' · '}
                <Link href="/tools">Free tools</Link>
                {' · '}
                <Link href="/guidance/start">Prepare a draft</Link>
              </LinkKeyboardGroup>
            </>
          ) : (
            <>
              <span className="sr-only" id="home-glance-no-open-hint">Arrow keys move between draft, free tools and booking updates. Escape blurs. Skip remains site-content.</span>
              <LinkKeyboardGroup as="span" aria-label="No open bookings next steps" aria-describedby="home-glance-no-open-hint">
                <span>No open bookings right now.</span>
                {' · '}<Link href="/guidance/start">Prepare a draft</Link>
                {' · '}<Link href="/tools">Free tools</Link>
                {' · '}<Link href="/how-it-works#booking-availability-how">Booking updates</Link>
              </LinkKeyboardGroup>
            </>
          )}
        </li>
        <li>
          {balance !== null ? (
            <>
              <span className="sr-only" id="home-glance-wallet-hint">Arrow keys move between wallet, recharge pause, free tools and draft. Escape blurs. Skip remains site-content.</span>
              <LinkKeyboardGroup as="span" aria-label="Wallet overview links" aria-describedby="home-glance-wallet-hint">
                Wallet balance: <strong>{balance.toLocaleString('en-IN')} coins</strong>
                <span> (existing balance · not a recharge offer or new booking unlock)</span>
                {' · '}<Link href="/wallet/recharge">{balance === 0 ? 'Recharge updates' : 'Why recharge is paused'}</Link>
                {' · '}<Link href="/wallet">Open wallet</Link>
                {' · '}<Link href="/tools">Free tools</Link>
                {' · '}<Link href="/guidance/start">Prepare a draft</Link>
              </LinkKeyboardGroup>
            </>
          ) : wallet.loading ? 'Checking wallet…' : (
            <>
              <span className="sr-only" id="home-glance-wallet-retry-hint">Arrow keys move between Try again, Open wallet, free tools and draft. Escape blurs. Skip remains site-content.</span>
              <LinkKeyboardGroup as="span" aria-label="Wallet overview retry" aria-describedby="home-glance-wallet-retry-hint">
                <span>Wallet balance unavailable. </span>
                <button type="button" className="text-link" onClick={wallet.reload} disabled={wallet.loading} aria-busy={wallet.loading || undefined}>{wallet.loading ? 'Trying again…' : 'Try again'}</button>
                {' · '}
                <Link href="/wallet">Open wallet</Link>
                {' · '}
                <Link href="/tools">Free tools</Link>
                {' · '}
                <Link href="/guidance/start">Prepare a draft</Link>
              </LinkKeyboardGroup>
            </>
          )}
        </li>
        <li>
          {unreadCount !== null ? (
            <>
              <span className="sr-only" id="home-glance-updates-hint">Arrow keys move between notifications, free tools and draft. Escape blurs. Skip remains site-content.</span>
              <LinkKeyboardGroup as="span" aria-label="Notifications overview links" aria-describedby="home-glance-updates-hint">
                Updates: <strong>{unreadCount} unread</strong>
                {' '}<Link href="/notifications">Open notifications</Link>
                {' · '}
                <Link href="/tools">Free tools</Link>
                {' · '}
                <Link href="/guidance/start">Prepare a draft</Link>
              </LinkKeyboardGroup>
            </>
          ) : unread.loading ? 'Checking updates…' : (
            <>
              <span className="sr-only" id="home-glance-updates-retry-hint">Arrow keys move between Try again, Open notifications, free tools and draft. Escape blurs. Skip remains site-content.</span>
              <LinkKeyboardGroup as="span" aria-label="Notifications overview retry" aria-describedby="home-glance-updates-retry-hint">
                <span>Updates unavailable. </span>
                <button type="button" className="text-link" onClick={unread.reload} disabled={unread.loading} aria-busy={unread.loading || undefined}>{unread.loading ? 'Trying again…' : 'Try again'}</button>
                {' · '}
                <Link href="/notifications">Open notifications</Link>
                {' · '}
                <Link href="/tools">Free tools</Link>
                {' · '}
                <Link href="/guidance/start">Prepare a draft</Link>
              </LinkKeyboardGroup>
            </>
          )}
        </li>
        <li>
          <span className="sr-only" id="home-glance-reports-hint">Arrow keys move between reports, free tools and draft. Escape blurs. Skip remains site-content.</span>
          <LinkKeyboardGroup as="span" aria-label="Reports and tools overview links" aria-describedby="home-glance-reports-hint">
            Saved reports:{' '}
            <Link href="/reports">Open reports</Link>
            {' · '}
            <Link href="/tools">Free tools</Link>
            {' · '}
            <Link href="/guidance/start">Prepare a draft</Link>
          </LinkKeyboardGroup>
        </li>
      </ul>
      ) : null}
      {emptyHome && !anyError && (
        <p className="expert-meta" role="status">
          <span className="sr-only" id="home-empty-status-hint">Arrow keys move between wallet, notifications, free tools and draft. Escape blurs. Skip remains site-content.</span>
          <LinkKeyboardGroup as="span" aria-label="Empty home status links" aria-describedby="home-empty-status-hint">
            {balance !== null ? <>Wallet: <Link href="/wallet">{balance.toLocaleString('en-IN')} coins</Link> · </> : null}
            {unreadCount !== null ? <>Updates: <Link href="/notifications">{unreadCount} unread</Link></> : <Link href="/notifications">Open notifications</Link>}
            {' · '}<Link href="/tools">Free tools</Link>
            {' · '}<Link href="/guidance/start">Prepare a draft</Link>
          </LinkKeyboardGroup>
        </p>
      )}
    </section>
  );
}
