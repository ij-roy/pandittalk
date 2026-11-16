'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ApiError, api, useApi } from '@/lib/api/client';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { LoadingState } from '@/components/site/Skeleton';
import { Booking, parseBooking, canResume, calendarText, bookingStatusLabel, bookingStatusTone } from './types';
import { formatIstDateTime, todayIstIso } from '@/lib/time/ist';
import { DisplaySlot, getAllSlots, rescheduleBooking } from './bookingApi';
import styles from '../account/customer.module.css';

const statusBadgeClass = {
  pending: styles.badge_pending,
  ready: styles.badge_ready,
  live: styles.badge_live,
  done: styles.badge_done,
  cancelled: styles.badge_cancelled,
} as const;

export function BookingList() {
  const q = useApi<unknown[]>('/bookings');
  const [filter, setFilter] = useState('all');
  const errorRef = useRef<HTMLDivElement | null>(null);
  const emptyRef = useRef<HTMLDivElement | null>(null);
  const sawTrueEmpty = useRef(false);
  let rows: Booking[] = []; let invalid = '';
  try { if (q.data) { if (!Array.isArray(q.data)) throw Error('Your booking history could not be read. Please try again.'); rows = q.data.map(parseBooking); } }
  catch (e) { invalid = (e as Error).message; }
  const visible = rows.filter(b => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return canResume(b) && Date.parse(b.startTime) + b.durationMinutes * 60000 > Date.now();
    return b.status === filter;
  });
  useEffect(() => {
    if (q.error || invalid) requestAnimationFrame(() => errorRef.current?.focus());
  }, [q.error, invalid]);
  useEffect(() => {
    if (q.loading || q.error || invalid || visible.length > 0) {
      if (rows.length > 0) sawTrueEmpty.current = false;
      return;
    }
    // Filtered empty: re-focus when the filter yields no rows. True empty: focus once.
    if (rows.length === 0) {
      if (sawTrueEmpty.current) return;
      sawTrueEmpty.current = true;
    }
    requestAnimationFrame(() => emptyRef.current?.focus());
  }, [q.loading, q.error, invalid, visible.length, filter, rows.length]);
  useEffect(() => {
    if (filter === 'all') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
      event.preventDefault();
      setFilter('all');
      requestAnimationFrame(() => document.getElementById('bookings-count')?.focus());
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [filter]);
  return <main id="main-content" className="page stack" aria-busy={q.loading || undefined}>
    <div><p className="eyebrow">Your conversations</p><h1>Bookings</h1><p className="lede">Open an existing consultation or revisit a past one. To book again, choose a Pandit and select a scheduled time or Chat Now.</p></div>
    <aside className="notice" role="status">
      <p>
        <strong>Booked sessions keep their original terms.</strong> Duration, total and status below come from the booking service.{' '}
        <span className="sr-only" id="bookings-pause-hint">Arrow keys move between booking, Pandit and free-tool links. Escape blurs the focused link. Skip remains site-content.</span>
        <LinkKeyboardGroup as="span" aria-label="Bookings list next steps" aria-describedby="bookings-pause-hint">
          <Link href="/pandits">Book another consultation</Link>
          {' · '}
          <Link href="/tools">Try free tools</Link>
        </LinkKeyboardGroup>
      </p>
    </aside>
    <p className="sr-only" id="bookings-toolbar-hint">Arrow keys move between Refresh, draft and free tools after the filter. Escape on the page shows all bookings when a filter is active. Skip remains site-content.</p>
    <div className={styles.toolbar} aria-describedby="bookings-toolbar-hint">
      <label className="field">Show bookings<select value={filter} onChange={e => setFilter(e.target.value)} onKeyDown={e => {
        if (e.key !== 'Escape' || filter === 'all') return;
        e.preventDefault();
        setFilter('all');
      }} aria-describedby="bookings-count bookings-filter-hint"><option value="all">All bookings</option><option value="upcoming">Upcoming and active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
      <LinkKeyboardGroup className="actions" style={{ margin: 0 }} aria-label="Bookings list refresh" aria-describedby="bookings-toolbar-hint">
        <button type="button" className="button secondary" onClick={q.reload} disabled={q.loading} aria-busy={q.loading || undefined}>{q.loading ? 'Refreshing…' : 'Refresh history'}</button>
        <Link className="text-link" href="/pandits">Book another consultation</Link>
        <Link className="text-link" href="/tools">Free tools</Link>
      </LinkKeyboardGroup>
    </div>
    <p id="bookings-filter-hint" className="sr-only">{filter === 'all' ? 'Showing all bookings.' : 'Filtered view. Press Escape on the filter or page to show all bookings.'}</p>
    {q.loading && <>
      <LoadingState label="Loading your bookings…" variant="cards" />
      <p className="sr-only" id="bookings-loading-hint">Skip to content still targets site-content. Arrow keys move between free tools and draft if loading takes longer than expected.</p>
      <LinkKeyboardGroup className="actions" aria-label="While bookings load" aria-describedby="bookings-loading-hint">
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
      </LinkKeyboardGroup>
    </>}
    {(q.error || invalid) && <div className="error" role="alert" tabIndex={-1} ref={errorRef} onKeyDown={event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      (event.currentTarget as HTMLElement).blur();
    }}><p>{q.error?.message || invalid} Press Escape to leave this alert.</p><p className="sr-only" id="bookings-list-recovery-hint">Arrow keys move between bookings list recovery links. Escape blurs the focused control. Skip remains site-content.</p><LinkKeyboardGroup className="actions" aria-label="Bookings list recovery" aria-describedby="bookings-list-recovery-hint"><button type="button" className="button secondary" onClick={q.reload} disabled={q.loading} aria-busy={q.loading || undefined}>{q.loading ? 'Trying again…' : 'Try again'}</button><Link className="button secondary" href="/guidance/start">Prepare a draft</Link><Link className="button secondary" href="/tools">Try free tools</Link><Link className="text-link" href="/contact">Contact support →</Link></LinkKeyboardGroup></div>}
    {!q.loading && !q.error && !invalid && <>
      <p id="bookings-count" className={styles.helper} role="status" aria-live="polite" tabIndex={-1}>{visible.length} {visible.length === 1 ? 'booking' : 'bookings'}{filter !== 'all' ? ' in this view · Escape shows all' : ''}</p>
      {visible.length ? <><div className="grid" role="list" aria-label="Your bookings" aria-describedby="bookings-grid-hint" onKeyDown={event => {
        if (!(event.target instanceof HTMLAnchorElement)) return;
        const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>('a[href]'));
        const index = links.indexOf(event.target);
        if (index < 0) return;
        if (event.key === 'Escape') { event.preventDefault(); event.target.blur(); return; }
        let next = index;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % links.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + links.length) % links.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = links.length - 1;
        else return;
        event.preventDefault();
        links[next]?.focus();
      }}>{visible.map(b => <Link className="panel stack" role="listitem" key={b.id} href={`/bookings/${encodeURIComponent(b.id)}`}>
        <div className={styles.cardHeader}><h2>{b.panditName || b.pandit?.name || 'Consultation'}</h2><span className={`${styles.badge} ${statusBadgeClass[bookingStatusTone(b.status)]}`}>{bookingStatusLabel(b.status)}</span></div>
        <div><p>{b.area.replaceAll('_', ' ')} · {b.format}</p><p><time dateTime={b.startTime}>{formatIstDateTime(b.startTime)}</time></p><small>{b.durationMinutes} minutes · {b.coinsDeducted} coins</small></div><span className="text-link">View booking →</span>
      </Link>)}</div><p className="sr-only" id="bookings-grid-hint">Arrow keys move between bookings. Home and End jump to the first or last. Escape blurs the focused booking. Skip remains site-content.</p></> : <div className={`panel stack ${styles.empty}`} role="status" tabIndex={-1} ref={emptyRef} onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        if (filter !== 'all') {
          setFilter('all');
          return;
        }
        (event.currentTarget as HTMLElement).blur();
      }}>
        <h2>{rows.length ? 'No bookings in this view' : 'No conversations yet'}</h2>
        <p>{rows.length ? 'Try another filter to find an upcoming or past consultation. Press Escape to show all bookings.' : 'Your confirmed scheduled sessions and Chat Now conversations will appear here. Explore a Pandit profile to make a new booking. Press Escape to leave this notice.'}</p>
          <p className="sr-only" id="bookings-empty-hint">Arrow keys move between empty-state actions. Escape shows all bookings or leaves this notice. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Empty bookings next steps" aria-describedby="bookings-empty-hint">
            {rows.length > 0
              ? <>
                <button type="button" className="button secondary" onClick={() => setFilter('all')}>Show all bookings</button>
                <Link href="/guidance/start" className="button secondary">Prepare a draft</Link>
                <Link href="/tools" className="button secondary">Try free tools</Link>
                <Link href="/pandits" className="text-link">Explore Pandits →</Link>
              </>
              : <>
              <Link href="/pandits" className="button">Explore Pandits</Link>
              <Link href="/tools" className="button secondary">Try free tools</Link>
              <Link href="/guidance/start" className="text-link">Prepare an optional note →</Link>
            </>}
          </LinkKeyboardGroup>
      </div>}
    </>}
    {rows.length > 0 && (
      <>
        <p className="sr-only" id="bookings-more-draft-hint">Arrow keys move between prepare another draft, free tools and booking updates. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="After browsing bookings" aria-describedby="bookings-more-draft-hint">
          <Link href="/guidance/start" className="button">Prepare another draft question</Link>
          <Link href="/tools" className="button secondary">Try free tools</Link>
          <Link href="/pandits" className="text-link">Book another consultation →</Link>
        </LinkKeyboardGroup>
      </>
    )}
  </main>;
}

export function BookingDetail({ id, reviewOnly = false }: { id: string; reviewOnly?: boolean }) {
  const q = useApi<unknown>(`/bookings/${encodeURIComponent(id)}`);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [status, setStatus] = useState(''); const [confirmCancel, setConfirmCancel] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false); const [rescheduleDate, setRescheduleDate] = useState(todayIstIso());
  const [rescheduleSlots, setRescheduleSlots] = useState<DisplaySlot[]>([]); const [rescheduleLoading, setRescheduleLoading] = useState(false); const [selectedSlot, setSelectedSlot] = useState('');
  const [rating, setRating] = useState(0); const [comment, setComment] = useState('');
  const cancelRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const ratingRef = useRef<HTMLSelectElement | null>(null);
  const reviewHeadingRef = useRef<HTMLHeadingElement | null>(null);
  let b: Booking | undefined; let invalid = '';
  try { if (q.data) b = parseBooking(q.data); } catch (e) { invalid = (e as Error).message; }
  useEffect(() => {
    if (!reviewOnly || q.loading || !b) return;
    requestAnimationFrame(() => reviewHeadingRef.current?.focus());
  }, [reviewOnly, q.loading, b?.id, b?.status, b?.review?.id]);
  useEffect(() => {
    if (reviewOnly || q.loading || !b || canResume(b)) return;
    requestAnimationFrame(() => document.getElementById('booking-session-closed')?.focus());
  }, [reviewOnly, q.loading, b?.id, b?.status]);
  useEffect(() => {
    if (q.loading || !(q.error instanceof ApiError && q.error.status === 404)) return;
    requestAnimationFrame(() => document.getElementById('booking-missing-title')?.focus());
  }, [q.loading, q.error]);
  useEffect(() => {
    if (!confirmCancel) return;
    const node = cancelRef.current;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(node?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []).filter(el => !el.hasAttribute('disabled'));
    const items = focusables();
    (items.find(el => !el.className.includes('danger')) || items[0])?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setConfirmCancel(false); return; }
      if (event.key !== 'Tab' || !node) return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [confirmCancel]);
  useEffect(() => {
    if (status) requestAnimationFrame(() => statusRef.current?.focus());
  }, [status]);
  useEffect(() => {
    if (!rescheduleOpen || !b || b.status !== 'confirmed') return;
    let cancelled = false;
    setRescheduleLoading(true); setSelectedSlot(''); setError('');
    getAllSlots(b.panditId, rescheduleDate, b.durationMinutes)
      .then(slots => { if (!cancelled) setRescheduleSlots(slots.filter(slot => slot.status === 'available')); })
      .catch(reason => { if (!cancelled) { setRescheduleSlots([]); setError((reason as Error).message); } })
      .finally(() => { if (!cancelled) setRescheduleLoading(false); });
    return () => { cancelled = true; };
  }, [rescheduleOpen, rescheduleDate, b?.panditId, b?.durationMinutes, b?.status]);
  async function mutate(review: boolean) {
    if (review && (!rating || rating < 1 || rating > 5)) {
      setError('Choose a rating from 1 to 5.');
      requestAnimationFrame(() => ratingRef.current?.focus());
      return;
    }
    setBusy(true); setError(''); setStatus('');
    try {
      await api(`/bookings/${encodeURIComponent(id)}/${review ? 'review' : 'status'}`, { method: review ? 'POST' : 'PATCH', body: JSON.stringify(review ? { rating, comment: comment.trim() || undefined } : { status: 'cancelled' }) });
      setStatus(review
        ? 'Your review was submitted. It is not public yet — published reviews appear only after eligibility checks.'
        : 'Cancellation confirmed. The charged coins are returned to your wallet under the booking service terms — refresh the booking and wallet to verify.');
      setConfirmCancel(false); q.reload();
      requestAnimationFrame(() => statusRef.current?.focus());
    } catch (e) {
      setError((e as Error).message + ' Refresh the booking before retrying if the outcome is uncertain.');
      requestAnimationFrame(() => errorRef.current?.focus());
    }
    finally { setBusy(false); }
  }
  function download() {
    if (!b) return;
    const url = URL.createObjectURL(new Blob([calendarText(b)], { type: 'text/calendar' }));
    const a = document.createElement('a'); a.href = url; a.download = 'pandittalk-booking.ics'; a.click(); URL.revokeObjectURL(url);
    setStatus('Calendar file downloaded. Open it in your calendar app to add this booking — times are shown in IST on the booking page.');
    requestAnimationFrame(() => statusRef.current?.focus());
  }
  async function changeTime() {
    if (!selectedSlot) { setError('Choose an available time before rescheduling.'); return; }
    setBusy(true); setError(''); setStatus('');
    try {
      await rescheduleBooking(id, selectedSlot);
      setRescheduleOpen(false); setStatus('Your booking time was changed. The original duration and total remain unchanged. Refreshing the booking details now.');
      q.reload();
    } catch (e) {
      setError(`${(e as Error).message} Refresh the available times before trying again.`);
    } finally { setBusy(false); }
  }
  return <main id="main-content" className="page stack" aria-busy={q.loading || busy || undefined}>
    <Link className="text-link" href="/bookings">← Your bookings</Link>
    <div>
      <p className="eyebrow">{reviewOnly ? 'After your conversation' : 'Consultation details'}</p>
      <h1 ref={reviewHeadingRef} tabIndex={reviewOnly ? -1 : undefined}>{reviewOnly ? 'Review your consultation' : 'Your booking'}</h1>
      {!reviewOnly && <p className="lede">Session access, calendar, cancellation and review for this consultation.</p>}
      {reviewOnly && <p className="lede">Honest feedback helps other seekers. Submitting a review does not publish it immediately — reviews appear publicly only after eligibility checks.</p>}
    </div>
    {q.loading && <>
      <LoadingState label="Loading your booking…" variant="detail" />
      <p className="sr-only" id="booking-detail-loading-hint">Skip to content still targets site-content. Arrow keys move between free tools, draft and bookings if loading takes longer than expected.</p>
      <LinkKeyboardGroup className="actions" aria-label="While this booking loads" aria-describedby="booking-detail-loading-hint">
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        <Link className="text-link" href="/bookings">Your bookings →</Link>
      </LinkKeyboardGroup>
    </>}
    {(q.error || invalid || error) && !(q.error instanceof ApiError && q.error.status === 404) && (
      <div id="booking-action-error" role="alert" className="error" tabIndex={-1} ref={errorRef} onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        (event.currentTarget as HTMLElement).blur();
      }}>
        <p>{q.error?.message || invalid || error} Press Escape to leave this alert.</p>
        <p className="sr-only" id="booking-error-hint">Arrow keys move between booking error recovery links. Escape blurs the focused control. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Booking error recovery" aria-describedby="booking-error-hint">
          <button type="button" className="button secondary" disabled={q.loading || busy} aria-busy={q.loading || undefined} onClick={q.reload}>{q.loading ? 'Refreshing…' : 'Refresh booking'}</button>
          <Link className="button secondary" href="/bookings">Your bookings</Link>
          <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/contact">Contact support →</Link>
        </LinkKeyboardGroup>
      </div>
    )}
    {status && (
      <div className="notice stack" role="status" tabIndex={-1} ref={statusRef} aria-live="polite" onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        setStatus('');
      }}>
        <p>{status} Press Escape to dismiss.</p>
        {/review/i.test(status) && (
          <>
            <p className="sr-only" id="booking-review-status-hint">Arrow keys move between booking, trust, tools and draft after review submit. Escape blurs. Skip remains site-content.</p>
            <LinkKeyboardGroup className="actions" aria-label="After review submission" aria-describedby="booking-review-status-hint">
              <Link className="button secondary" href={`/bookings/${encodeURIComponent(id)}`}>Back to booking</Link>
              <Link className="button secondary" href="/trust#how-to-check">How reviews are checked</Link>
              <Link className="button secondary" href="/tools">Try free tools</Link>
              <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
            </LinkKeyboardGroup>
          </>
        )}
        {/cancel/i.test(status) && (
          <>
            <p className="sr-only" id="booking-cancel-status-hint">Arrow keys move between wallet, refresh, tools, draft and support after cancellation. Escape blurs. Skip remains site-content.</p>
            <LinkKeyboardGroup className="actions" aria-label="After booking cancellation" aria-describedby="booking-cancel-status-hint">
              <Link className="button" href="/wallet">Check wallet</Link>
              <button type="button" className="button secondary" disabled={q.loading || busy} aria-busy={q.loading || undefined} onClick={q.reload}>{q.loading ? 'Refreshing…' : 'Refresh booking'}</button>
              <Link className="button secondary" href="/tools">Try free tools</Link>
              <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
              <Link className="text-link" href="/contact">Contact support →</Link>
            </LinkKeyboardGroup>
          </>
        )}
        {/review/i.test(status) && (
          <>
            <p className="sr-only" id="booking-review-more-hint">Arrow keys move between bookings, free tools, draft, Pandits and booking updates after a review. Escape blurs. Skip remains site-content.</p>
            <LinkKeyboardGroup className="actions" aria-label="After submitting a review" aria-describedby="booking-review-more-hint">
              <Link className="button secondary" href="/bookings">Your bookings</Link>
              <Link className="button secondary" href="/tools">Try free tools</Link>
              <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
              <Link className="text-link" href="/pandits">Explore Pandits →</Link>
              <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
            </LinkKeyboardGroup>
          </>
        )}
      </div>
    )}
    {!q.loading && q.error instanceof ApiError && q.error.status === 404 && <section className={`panel stack ${styles.empty}`} role="status" onKeyDown={event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      (document.getElementById('booking-missing-title') as HTMLElement | null)?.blur();
    }}>
      <h2 id="booking-missing-title" tabIndex={-1}>Booking not found</h2>
      <p>This booking is unavailable, was removed, or is not linked to your account. Opening this link does not create a new booking or charge. Press Escape to leave this heading.</p>
      <p className="sr-only" id="booking-missing-hint">Arrow keys move between missing-booking recovery links. Escape blurs the focused control. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions" aria-label="Missing booking recovery" aria-describedby="booking-missing-hint">
        <Link className="button" href="/bookings">Your bookings</Link>
        <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="button secondary" href="/help/booking-cancellation">Cancellation help</Link>
        <Link className="text-link" href="/contact">Contact support →</Link>
      </LinkKeyboardGroup>
    </section>}
    {b && <>
      <section className="panel stack" inert={confirmCancel ? true : undefined}>
        <div className={styles.cardHeader}><h2>{b.pandit?.name || b.panditName || 'Pandit consultation'}</h2><span className={`${styles.badge} ${statusBadgeClass[bookingStatusTone(b.status)]}`}>{bookingStatusLabel(b.status)}</span></div>
        <p>{b.area.replaceAll('_', ' ')} · {b.format}</p>
        <div className={styles.formGrid}><div><p className="eyebrow">Date and time (IST)</p><p><time dateTime={b.startTime}>{formatIstDateTime(b.startTime)}</time></p></div><div><p className="eyebrow">Booking total</p><p>{b.totalPrice} coins<br /><small>{b.coinsDeducted} coins deducted</small></p></div></div>
        <p className="notice">Included duration from your original booking: {b.durationMinutes} minutes. The server countdown starts when the session begins; your original booking terms apply.</p>
        {b.notes && <div><h3>Your shared notes</h3><p style={{ whiteSpace: 'pre-wrap' }}>{b.notes}</p></div>}
        <p className="sr-only" id="booking-session-hint">Arrow keys move between Open session, Add to calendar, change time, Join help, free tools and draft. Escape blurs the focused control. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Booking session actions" aria-describedby="booking-session-hint">
          {canResume(b) && <Link className="button" href={`/sessions/${encodeURIComponent(b.id)}/${b.format}`}>Open {b.format} session</Link>}
          <button className="button secondary" type="button" onClick={download}>Add to calendar</button>
          {b.status === 'confirmed' && <button className="button secondary" type="button" onClick={() => setRescheduleOpen(open => !open)} disabled={busy}>{rescheduleOpen ? 'Close change time' : 'Change time'}</button>}
          {canResume(b) && <Link className="text-link" href="/help/joining-audio-video">Join help →</Link>}
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
        {rescheduleOpen && b.status === 'confirmed' && <div className="notice stack" role="region" aria-labelledby="reschedule-title">
          <div><h3 id="reschedule-title">Choose a new time</h3><p>Available times come from the booking service. Your {b.durationMinutes}-minute session and charged total stay the same; the service will reject changes that are too close to the start.</p></div>
          <label className="field">Date (IST)<input type="date" value={rescheduleDate} min={todayIstIso()} onChange={event => setRescheduleDate(event.target.value)} /></label>
          {rescheduleLoading && <p role="status">Loading available times…</p>}
          {!rescheduleLoading && !rescheduleSlots.length && <p role="status">No available times for this date. Try another date.</p>}
          {!rescheduleLoading && rescheduleSlots.length > 0 && <div className="actions" role="group" aria-label="Available replacement times">{rescheduleSlots.map(slot => <button key={slot.startTime} type="button" className={`button ${selectedSlot === slot.startTime ? '' : 'secondary'}`} aria-pressed={selectedSlot === slot.startTime} onClick={() => setSelectedSlot(slot.startTime)}>{formatIstDateTime(slot.startTime)}</button>)}</div>}
          <p className={styles.helper}>Rescheduling does not create a second booking or charge more coins. If you need to cancel instead, use Cancel booking below.</p>
          <button type="button" className="button" disabled={busy || rescheduleLoading || !selectedSlot} onClick={() => void changeTime()}>{busy ? 'Changing time…' : 'Confirm new time'}</button>
        </div>}
        {!canResume(b) && (
          <div className="notice stack" role="status" id="booking-session-closed" tabIndex={-1} onKeyDown={event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            (event.currentTarget as HTMLElement).blur();
          }}>
            <p>
              This consultation is {bookingStatusLabel(b.status).toLowerCase()}, so the live {b.format} room is not available from here.
              Opening this page does not create a new booking or charge coins. Press Escape to leave this notice.
            </p>
        <p className="sr-only" id="booking-session-closed-hint">Arrow keys move between review when shown, bookings, free tools, optional notes and support. Escape blurs. Skip remains site-content.</p>
            <LinkKeyboardGroup className="actions" aria-label="Session not available recovery" aria-describedby="booking-session-closed-hint">
              {b.status === 'completed' && !b.review && (
                <Link className="button" href={`/bookings/${encodeURIComponent(b.id)}/review`}>Leave a review</Link>
              )}
              {b.status === 'completed' && b.review && (
                <p className="expert-meta">You already left feedback for this consultation. Published ratings appear only after eligibility checks — submitting again is not available.</p>
              )}
              <Link className="button secondary" href="/bookings">Your bookings</Link>
              <Link className="button secondary" href="/tools">Try free tools</Link>
              <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
              <Link className="text-link" href="/pandits">Book another consultation →</Link>
              <Link className="text-link" href="/contact">Contact support →</Link>
            </LinkKeyboardGroup>
          </div>
        )}
        {['pending', 'confirmed'].includes(b.status) && !confirmCancel && (
          <button type="button" className={`button secondary ${styles.danger}`} disabled={busy} aria-busy={busy || undefined} onClick={() => setConfirmCancel(true)}>Cancel booking</button>
        )}
      </section>
      {confirmCancel && ['pending', 'confirmed'].includes(b.status) && (
        <div className="notice" role="alertdialog" aria-modal="true" aria-labelledby="cancel-booking-title" ref={cancelRef}>
          <p id="cancel-booking-title"><strong>Cancel this consultation?</strong></p>
          <p>Confirmed bookings are cancelled through the booking service and the charged coins are returned to your wallet. Refresh the booking and wallet after confirming. Press Escape to keep the booking.</p>
          <p className="sr-only" id="booking-cancel-confirm-hint">Arrow keys move between Keep booking, Confirm cancellation, free tools and draft. Escape keeps the booking. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Cancel booking confirmation" aria-describedby="booking-cancel-confirm-hint">
            <button type="button" className="button secondary" disabled={busy} onClick={() => setConfirmCancel(false)}>Keep booking</button>
            <button type="button" className={`button secondary ${styles.danger}`} disabled={busy} aria-busy={busy || undefined} onClick={() => void mutate(false)}>{busy ? 'Cancelling…' : 'Confirm cancellation'}</button>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </div>
      )}
      {b.review ? (
        <section className="panel">
          <h2>Your review</h2>
          <p><strong>{b.review.rating} out of 5</strong></p>
          {b.review.comment && <p>{b.review.comment}</p>}
        </section>
      ) : b.status === 'completed' ? (
        <form
          className="panel stack"
          aria-busy={busy}
          onSubmit={e => {
            e.preventDefault();
            void mutate(true);
          }}
        >
          <h2>How was your conversation?</h2>
          <label className="field">
            Rating
            <select ref={ratingRef} value={rating || ''} required disabled={busy} aria-invalid={error && !rating ? true : undefined} aria-describedby={error && !rating ? 'booking-action-error review-rating-help' : 'review-rating-help'} onChange={e => { setRating(Number(e.target.value)); if (error) setError(''); }} onKeyDown={e => {
              if (e.key !== 'Escape' || !rating) return;
              e.preventDefault();
              setRating(0);
            }}>
              <option value="" disabled>Choose a rating</option>
              {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} out of 5</option>)}
            </select>
          </label>
          <p id="review-rating-help" className={styles.helper}>{rating ? 'Press Escape to clear the rating.' : 'Choose how the conversation went overall.'}</p>
          <label className="field">
            Comment (optional)
            <textarea
              rows={4}
              maxLength={500}
              value={comment}
              disabled={busy}
              enterKeyHint="done"
              aria-describedby="review-help review-count"
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => {
                if (e.key !== 'Escape' || !comment) return;
                e.preventDefault();
                setComment('');
              }}
              placeholder="What was helpful? What could be better?"
            />
          </label>
          <small id="review-count" aria-live="polite">{comment.length}/500 characters{comment ? ' · Escape clears the comment' : ''}</small>
          <p id="review-help" className={styles.helper}>Share honest feedback, including criticism. Avoid personal contact details or sensitive information about others. Submitting a review does not create a new booking or charge. Your review will not appear on a public profile until it passes eligibility checks.</p>
          <p className="sr-only" id="booking-review-submit-hint">Arrow keys move between Submit review, booking, free tools and draft. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Submit review and next steps" aria-describedby="booking-review-submit-hint">
            <button type="submit" className="button" disabled={busy} aria-busy={busy || undefined}>{busy ? 'Submitting…' : 'Submit review'}</button>
            <Link className="button secondary" href={`/bookings/${encodeURIComponent(id)}`}>Back to booking</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </form>
      ) : reviewOnly ? (
        <div className="notice stack" role="status">
          <p>You can leave a review after this consultation is marked completed. Opening this page does not create a new booking or charge.</p>
          <p className="sr-only" id="booking-review-wait-hint">Arrow keys move between booking, tools, draft and refunds help. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Review not ready yet" aria-describedby="booking-review-wait-hint">
            <Link className="button secondary" href={`/bookings/${encodeURIComponent(id)}`}>Back to booking</Link>
            <Link className="button secondary" href="/bookings">Your bookings</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/help/refunds-and-complaints">Refunds and complaints →</Link>
          </LinkKeyboardGroup>
        </div>
      ) : null}
    </>}
    <p className="sr-only" id="booking-shortcuts-hint">Arrow keys move between refresh, wallet, tools, draft and support. Escape blurs. Skip remains site-content.</p>
    <LinkKeyboardGroup className="actions" aria-label="Booking page shortcuts" aria-describedby="booking-shortcuts-hint">
      <button type="button" className="button secondary" disabled={q.loading || busy} aria-busy={q.loading || undefined} onClick={q.reload}>{q.loading ? 'Refreshing…' : 'Refresh booking'}</button>
      <Link className="text-link" href="/wallet">Check wallet and refunds →</Link>
      <Link className="text-link" href="/tools">Try free tools →</Link>
      <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
      <Link className="text-link" href="/contact">Contact support →</Link>
    </LinkKeyboardGroup>
  </main>;
}
