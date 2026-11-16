'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ApiError, useApi } from '@/lib/api/client';
import { parseBooking, canResume, type Format } from '@/features/bookings/types';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import ChatRoom from './ChatRoom';
import MediaRoom from './MediaRoom';

export default function SessionPage({ id, format }: { id: string; format: Format }) {
  const q = useApi<unknown>(`/bookings/${encodeURIComponent(id)}`);
  let booking; let error = '';
  try { if (q.data) booking = parseBooking(q.data); } catch (e) { error = (e as Error).message; }
  const missing = !q.loading && q.error instanceof ApiError && q.error.status === 404;
  const wrongFormat = Boolean(booking && booking.format !== format);
  const notResumable = Boolean(booking && booking.format === format && !canResume(booking));
  const shouldFocusStatus = missing || wrongFormat || notResumable || Boolean((q.error || error) && !missing);

  useEffect(() => {
    if (!shouldFocusStatus) return;
    const focusStatus = () => requestAnimationFrame(() => {
      const target = document.getElementById('session-status-focus');
      if (!target) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      target.focus({ preventScroll: true });
    });
    focusStatus();
    window.addEventListener('pageshow', focusStatus);
    return () => window.removeEventListener('pageshow', focusStatus);
  }, [shouldFocusStatus, missing, wrongFormat, notResumable, q.error, error]);

  return (
    <main id="main-content" className="page stack" aria-busy={q.loading || undefined}>
      <Link className="text-link session-back" href={missing ? '/bookings' : `/bookings/${encodeURIComponent(id)}`}>
        {missing ? '← Your bookings' : '← Booking details'}
      </Link>
      <div>
        <p className="eyebrow">A space for your conversation</p>
        <h1>{format[0].toUpperCase() + format.slice(1)} consultation</h1>
        {booking && <p className="lede">With {booking.panditName || booking.pandit?.name || 'your Pandit'} · {booking.durationMinutes}-minute session. The server countdown starts when the conversation begins.</p>}
      </div>

      {q.loading && <>
        <p className="notice" role="status">Loading your booking…</p>
        <p className="sr-only" id="session-loading-hint">Skip to content still targets site-content. Arrow keys move between free tools and draft if loading takes longer than expected.</p>
        <LinkKeyboardGroup className="actions" aria-label="While this session loads" aria-describedby="session-loading-hint">
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          <Link className="text-link" href="/bookings">Your bookings →</Link>
        </LinkKeyboardGroup>
        <div className="panel stack" aria-hidden="true"><span className="skeleton-line" /><span className="skeleton-line short" /><span className="skeleton-line shorter" /></div>
      </>}
      {missing && (
        <section className="panel stack" role="status" onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          (document.getElementById('session-status-focus') as HTMLElement | null)?.blur();
        }}>
          <h2 id="session-status-focus" tabIndex={-1}>This session could not be found</h2>
          <p>The booking may have been removed, the link may be old, or it is not linked to your signed-in account. Opening a session does not create a new booking or charge coins. Press Escape to leave this heading.</p>
          <p className="sr-only" id="session-missing-hint">Arrow keys move between recovery links. Escape blurs the focused control. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions" aria-label="Missing session recovery" aria-describedby="session-missing-hint">
        <Link className="button" href="/bookings">Your bookings</Link>
        <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="button secondary" href="/help/joining-audio-video">Join help</Link>
        <Link className="text-link" href="/contact">Contact support →</Link>
      </LinkKeyboardGroup>
        </section>
      )}
      {(q.error || error) && !missing && (
        <div className="error" role="alert" tabIndex={-1} id="session-status-focus" onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).blur();
        }}>
          <p>{q.error?.message || error} Press Escape to leave this alert.</p>
          <p className="sr-only" id="session-load-hint">Arrow keys move between recovery actions. Escape blurs this alert. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Session load recovery" aria-describedby="session-load-hint">
            <button type="button" className="button secondary" onClick={q.reload} disabled={q.loading} aria-busy={q.loading || undefined}>{q.loading ? 'Trying again…' : 'Try again'}</button>
            <Link className="button secondary" href="/bookings">Back to bookings</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="text-link" href="/help/joining-audio-video">Join help →</Link>
          </LinkKeyboardGroup>
        </div>
      )}

      {booking && <>
        <p className="notice" role="status">This is an existing booking. It keeps its original {booking.durationMinutes}-minute terms; the session room shows the server countdown once the conversation begins.</p>
        {booking.format !== format ? (
          <section className="panel stack" role="status" onKeyDown={event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            (document.getElementById('session-status-focus') as HTMLElement | null)?.blur();
          }}>
            <h2 id="session-status-focus" tabIndex={-1}>Your {booking.format} room is ready</h2>
            <p>This booking is for a {booking.format} consultation, not {format}. Opening the wrong format does not create a new charge. Press Escape to leave this heading.</p>
            <p className="sr-only" id="session-format-hint">Arrow keys move between room and booking links. Escape blurs the focused control. Skip remains site-content.</p>
            <LinkKeyboardGroup className="actions" aria-label="Wrong session format recovery" aria-describedby="session-format-hint">
              <Link className="button" href={`/sessions/${encodeURIComponent(id)}/${booking.format}`}>Open {booking.format} room</Link>
              <Link className="button secondary" href={`/bookings/${encodeURIComponent(id)}`}>View booking</Link>
              <Link className="button secondary" href="/tools">Try free tools</Link>
              <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
              <Link className="text-link" href="/help/joining-audio-video">Join help →</Link>
            </LinkKeyboardGroup>
          </section>
        ) : !canResume(booking) ? (
          <section className="panel stack" role="status" onKeyDown={event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            (document.getElementById('session-status-focus') as HTMLElement | null)?.blur();
          }}>
            <h2 id="session-status-focus" tabIndex={-1}>This consultation is {booking.status.replaceAll('_', ' ')}</h2>
            <p>You can return to your booking to see its final details{booking.status === 'completed' ? ' and leave a review' : ''}. Opening this room again does not create a new booking or charge coins. Press Escape to leave this heading.</p>
            <p className="sr-only" id="session-closed-hint">Arrow keys move between booking and help links. Escape blurs the focused control. Skip remains site-content.</p>
            <LinkKeyboardGroup className="actions" aria-label="Session not resumable next steps" aria-describedby="session-closed-hint">
              <Link className="button" href={`/bookings/${encodeURIComponent(id)}${booking.status === 'completed' ? '/review' : ''}`}>
                {booking.status === 'completed' ? 'Review your consultation' : 'View booking'}
              </Link>
              <Link className="button secondary" href="/help/joining-audio-video">Join help</Link>
              <Link className="button secondary" href="/tools">Try free tools</Link>
              <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
              {booking.status === 'completed' && <Link className="text-link" href="/wallet">Check wallet →</Link>}
              <Link className="text-link" href="/how-it-works#booking-availability-how">New booking updates →</Link>
            </LinkKeyboardGroup>
          </section>
        ) : format === 'chat' ? <ChatRoom id={id} /> : <MediaRoom id={id} format={format} />}
        <p className="sr-only" id="session-help-hint">Arrow keys move between session help links. Escape blurs the focused link. Skip remains site-content.</p>
        <LinkKeyboardGroup className="expert-meta session-help-links" aria-label="Session help links" aria-describedby="session-help-hint" as="p">
          Session help:{' '}
          {format === 'chat'
            ? <Link href="/help/chat-reconnect">Chat reconnect</Link>
            : <Link href="/help/joining-audio-video">Joining audio or video</Link>}
          {' · '}
          <Link href="/help/booking-cancellation">Cancellation</Link>
          {' · '}
          <Link href="/tools">Free tools</Link>
          {' · '}
          <Link href="/guidance/start">Prepare a draft</Link>
          {' · '}
          <Link href="/contact">Contact support</Link>
        </LinkKeyboardGroup>
      </>}
    </main>
  );
}
