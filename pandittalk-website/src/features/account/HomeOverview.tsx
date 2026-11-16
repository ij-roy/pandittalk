'use client';

import Link from 'next/link';
import { useApi } from '@/lib/api/client';
import { LoadingState } from '@/components/site/Skeleton';
import { canResume, parseBooking, type Booking } from '@/features/bookings/types';
import { formatIstDateTime } from '@/lib/time/ist';

type Wallet = { coinBalance: number };
type Unread = { count: number };

function RefreshIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M20 11a8.1 8.1 0 0 0-14.8-3.7L4 9" />
      <path d="M4 4v5h5" />
      <path d="M4 13a8.1 8.1 0 0 0 14.8 3.7L20 15" />
      <path d="M20 20v-5h-5" />
    </svg>
  );
}

function SummaryCard({ label, value, description, href }: { label: string; value: string; description: string; href: string }) {
  return (
    <Link className="panel" data-home-summary href={href}>
      <span className="eyebrow home-summary-label">{label}</span>
      <strong className="home-summary-value">{value}</strong>
      <span className="home-summary-description">{description}</span>
      <span className="text-link">Open {label.toLowerCase()}</span>
    </Link>
  );
}

function EmptyPrimary() {
  return (
    <div className="home-primary-copy">
      <span className="eyebrow">Your next step</span>
      <h2>Find your next conversation</h2>
      <p>Choose a Pandit and see the available options, including Chat Now and scheduled sessions, before you decide.</p>
      <div className="actions home-primary-actions">
        <Link className="button" href="/pandits">Explore Pandits <span aria-hidden="true">→</span></Link>
        <Link className="text-link" href="/how-it-works">See how booking works <span aria-hidden="true">→</span></Link>
      </div>
    </div>
  );
}

function NextBookingPrimary({ booking }: { booking: Booking }) {
  const name = booking.panditName || booking.pandit?.name || 'your Pandit';
  const sessionHref = `/sessions/${encodeURIComponent(booking.id)}/${booking.format}`;

  return (
    <div className="home-primary-copy">
      <span className="eyebrow">Your next conversation</span>
      <h2>{name}</h2>
      <p>{formatIstDateTime(booking.startTime)} · {booking.format} · {booking.durationMinutes} minutes</p>
      <div className="home-booking-details">
        <span>Confirmed booking</span>
        <strong>{booking.totalPrice.toLocaleString('en-IN')} coins</strong>
      </div>
      <div className="actions home-primary-actions">
        <Link className="button" href={`/bookings/${encodeURIComponent(booking.id)}`}>Open booking <span aria-hidden="true">→</span></Link>
        <Link className="text-link" href={sessionHref}>Open existing {booking.format} session <span aria-hidden="true">→</span></Link>
      </div>
    </div>
  );
}

function PastBookingsPrimary({ count }: { count: number }) {
  return (
    <div className="home-primary-copy">
      <span className="eyebrow">Your Pandit Talk space</span>
      <h2>Your bookings are here</h2>
      <p>You have {count} saved {count === 1 ? 'booking' : 'bookings'}. Explore the directory when you are ready for another conversation.</p>
      <div className="actions home-primary-actions">
        <Link className="button" href="/pandits">Explore Pandits <span aria-hidden="true">→</span></Link>
        <Link className="text-link" href="/bookings">View bookings <span aria-hidden="true">→</span></Link>
      </div>
    </div>
  );
}

export function HomeOverview() {
  const bookings = useApi<unknown[]>('/bookings');
  const wallet = useApi<Wallet>('/wallet');
  const unread = useApi<Unread>('/notifications/unread-count');
  const reports = useApi<unknown[]>('/reports');

  let parsedBookings: Booking[] = [];
  if (Array.isArray(bookings.data)) {
    parsedBookings = bookings.data.flatMap(row => {
      try { return [parseBooking(row)]; } catch { return []; }
    });
  }

  const now = Date.now();
  const next = parsedBookings
    .filter(booking => canResume(booking) && Date.parse(booking.startTime) + booking.durationMinutes * 60000 > now)
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))[0];
  const unreadCount = unread.data && Number.isInteger(unread.data.count) ? unread.data.count : null;
  const balance = wallet.data && Number.isFinite(wallet.data.coinBalance) ? wallet.data.coinBalance : null;
  const reportCount = Array.isArray(reports.data) ? reports.data.length : null;
  const loading = bookings.loading || wallet.loading || unread.loading || reports.loading;
  const anyError = Boolean(bookings.error || wallet.error || unread.error || reports.error);
  const bookingError = bookings.error?.message;
  const hasPastBookings = parsedBookings.length > 0 && !next;

  function retryAll() {
    bookings.reload();
    wallet.reload();
    unread.reload();
    reports.reload();
  }

  return (
    <section className="home-dashboard" aria-label="Your home overview" aria-busy={loading || undefined}>
      <div className="home-dashboard-header">
        <div>
          <span className="eyebrow">At a glance</span>
          <p>What needs your attention now.</p>
        </div>
        <button className="home-refresh-button" type="button" onClick={retryAll} disabled={loading} aria-label="Refresh home overview" aria-busy={loading || undefined}>
          <RefreshIcon />
          <span className="sr-only">{loading ? 'Refreshing home overview' : 'Refresh home overview'}</span>
        </button>
      </div>

      {loading && !anyError ? (
        <div className="panel home-primary" data-home-primary>
          <LoadingState label="Loading your home overview…" variant="detail" />
        </div>
      ) : (
        <div className="panel home-primary" data-home-primary>
          {bookingError ? (
            <div className="home-error" role="alert">
              <span className="eyebrow">Bookings need a moment</span>
              <h2>We could not load your next step.</h2>
              <p>{bookingError}</p>
              <button className="button secondary" type="button" onClick={retryAll} disabled={loading}>Retry overview</button>
            </div>
          ) : next ? (
            <NextBookingPrimary booking={next} />
          ) : hasPastBookings ? (
            <PastBookingsPrimary count={parsedBookings.length} />
          ) : (
            <EmptyPrimary />
          )}
          <aside className="home-primary-aside" aria-label="Booking formats">
            <span className="eyebrow">Choose what fits today</span>
            <div className="home-primary-options">
              <div className="home-primary-option">
                <strong>Chat Now</strong>
                <span>Talk when a Pandit is available.</span>
              </div>
              <div className="home-primary-option">
                <strong>Schedule a session</strong>
                <span>Pick a time that works for you.</span>
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className="home-summary" aria-label="Your account summary">
        <SummaryCard label="Wallet" value={balance === null ? '—' : `${balance.toLocaleString('en-IN')} coins`} description="Available for a confirmed booking." href="/wallet" />
        <SummaryCard label="Updates" value={unreadCount === null ? '—' : `${unreadCount} unread`} description="Booking and session notices." href="/notifications" />
        <SummaryCard label="Reports" value={reportCount === null ? '—' : `${reportCount} saved`} description="Paid readings you have kept." href="/reports" />
      </div>

      {anyError && !bookingError && (
        <div className="home-partial-status" role="status">
          Some account details are unavailable. <button className="text-link" type="button" onClick={retryAll}>Retry overview</button>
        </div>
      )}

      <section className="home-secondary" aria-labelledby="home-secondary-heading">
        <div>
          <span className="eyebrow">When you are ready</span>
          <h2 id="home-secondary-heading">A few useful places to continue</h2>
        </div>
        <div className="home-secondary-links">
          <Link href="/tools"><strong>Free tools</strong><span>Explore readings on your own.</span><span className="text-link">Open free tools →</span></Link>
          <Link href="/account/story"><strong>Your story</strong><span>Keep private context for future conversations.</span><span className="text-link">Manage your story →</span></Link>
          <Link href="/guidance/start"><strong>Optional note</strong><span>Write a browser-only note; it does not book or charge.</span><span className="text-link">Prepare a note →</span></Link>
        </div>
      </section>
    </section>
  );
}
