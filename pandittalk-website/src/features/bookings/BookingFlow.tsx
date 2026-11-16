'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ApiError, api, useApi } from '@/lib/api/client';
import { formatIstDateTime, todayIstIso } from '@/lib/time/ist';
import type { Expert } from '@/features/experts/types';
import {
  bookingQuotePath,
  createChatNow,
  createScheduledBooking,
  expertSlotsPath,
  getChatNowQuote,
  getPanditStatus,
  joinChatQueue,
  leaveChatQueue,
  type BookingCatalog,
  type BookingDepth,
  type BookingQuote,
  type DisplaySlot,
  type PanditLiveStatus,
} from './bookingApi';
import type { Format } from './types';
import styles from './booking-flow.module.css';

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: 'numeric',
  minute: '2-digit',
});

function formatSlotTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Time unavailable' : timeFormatter.format(date);
}

function friendlyError(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'We could not load booking details. Please try again.';
}

export function BookingFlow({ expertId, mode = 'scheduled' }: { expertId?: string; mode?: 'scheduled' | 'chat-now' }) {
  const router = useRouter();
  const isChatNow = mode === 'chat-now';
  const expertQuery = useApi<Expert>(expertId ? `/experts/${encodeURIComponent(expertId)}` : null);
  const catalogQuery = useApi<BookingCatalog>('/booking-catalog');
  const walletQuery = useApi<{ coinBalance: number }>('/wallet');
  const [depth, setDepth] = useState<BookingDepth | ''>('');
  const [format, setFormat] = useState<Format | ''>('');
  const [area, setArea] = useState('');
  const [date, setDate] = useState(todayIstIso());
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [quote, setQuote] = useState<BookingQuote>();
  const [quoteError, setQuoteError] = useState('');
  const [slots, setSlots] = useState<DisplaySlot[]>();
  const [slotsError, setSlotsError] = useState('');
  const [step, setStep] = useState<'choose' | 'review'>('choose');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [presence, setPresence] = useState<PanditLiveStatus>();
  const [presenceLoading, setPresenceLoading] = useState(isChatNow);
  const [queued, setQueued] = useState(false);
  const [queueInfo, setQueueInfo] = useState<{ position: number; estimatedWaitMinutes: number; queueLength: number }>();
  const [queueBusy, setQueueBusy] = useState(false);

  const catalog = catalogQuery.data;
  const expert = expertQuery.data;
  const selectedDepth = useMemo(() => catalog?.scheduled.depths.find(item => item.key === depth), [catalog, depth]);
  const selectedFormat = useMemo(() => catalog?.scheduled.formats.find(item => item.key === format), [catalog, format]);
  const availableSlots = (slots || []).filter(slot => slot.status === 'available');
  const serviceError = catalogQuery.error || expertQuery.error;

  useEffect(() => {
    if (!catalog) return;
    if (!depth && catalog.scheduled.depths[0]) setDepth(catalog.scheduled.depths[0].key);
    if (!format) setFormat((isChatNow ? catalog.scheduled.formats.find(item => item.key === 'chat')?.key : catalog.scheduled.formats.find(item => item.key === 'audio')?.key) || catalog.scheduled.formats[0]?.key || '');
    if (!area && catalog.areas[0]) setArea(catalog.areas[0].key);
  }, [catalog, depth, format, area, isChatNow]);

  useEffect(() => {
    if ((!isChatNow && !depth) || !format) {
      setQuote(undefined);
      return;
    }
    let active = true;
    setQuote(undefined);
    setQuoteError('');
    (isChatNow ? getChatNowQuote() : api<BookingQuote>(bookingQuotePath(depth as BookingDepth, format)))
      .then(value => { if (active) setQuote(value); })
      .catch(error => { if (active) setQuoteError(friendlyError(error)); });
    return () => { active = false; };
  }, [depth, format, isChatNow]);

  useEffect(() => {
    if (isChatNow || !expertId || !date || !quote) {
      setSlots(undefined);
      return;
    }
    let active = true;
    setSlots(undefined);
    setSelectedSlot('');
    setSlotsError('');
    api<DisplaySlot[]>(expertSlotsPath(expertId, date, quote.durationMinutes))
      .then(value => { if (active) setSlots(Array.isArray(value) ? value : []); })
      .catch(error => { if (active) setSlotsError(friendlyError(error)); });
    return () => { active = false; };
  }, [expertId, date, quote, isChatNow]);

  useEffect(() => {
    if (!isChatNow || !expertId) return;
    let active = true;
    const readPresence = () => {
      setPresenceLoading(true);
      getPanditStatus(expertId)
        .then(value => { if (active) setPresence(value); })
        .catch(error => { if (active) setFormError(friendlyError(error)); })
        .finally(() => { if (active) setPresenceLoading(false); });
    };
    readPresence();
    const timer = window.setInterval(readPresence, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, [expertId, isChatNow]);

  function reviewBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    if (isChatNow) {
      if (!area || !quote) {
        setFormError('Choose a topic before reviewing your Chat Now session.');
        return;
      }
      if (presence?.state !== 'available') {
        setFormError('Chat Now is not available with this Pandit right now.');
        return;
      }
    } else if (!area || !depth || !format || !quote || !selectedSlot) {
      setFormError('Choose a topic, session, format and available time before reviewing.');
      return;
    }
    setStep('review');
    requestAnimationFrame(() => document.getElementById('booking-review-title')?.focus());
  }

  async function confirmBooking() {
    if (!expertId || !area || !quote || (!isChatNow && (!depth || !format || !selectedSlot))) return;
    setSubmitting(true);
    setFormError('');
    try {
      const created = isChatNow
        ? await createChatNow({ panditId: expertId, area, ...(notes.trim() ? { notes: notes.trim() } : {}) })
        : await createScheduledBooking({
          panditId: expertId,
          startTime: selectedSlot,
          area,
          depth: depth as BookingDepth,
          format: format as Format,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        });
      if (!created?.id) throw new Error('The booking service did not return a booking reference.');
      router.replace(`/bookings/${encodeURIComponent(created.id)}`);
    } catch (error) {
      setSubmitting(false);
      setFormError(friendlyError(error));
      requestAnimationFrame(() => document.getElementById('booking-form-error')?.focus());
    }
  }

  async function handleJoinQueue() {
    if (!expertId) return;
    setQueueBusy(true);
    setFormError('');
    try {
      setQueueInfo(await joinChatQueue(expertId));
      setQueued(true);
    } catch (error) {
      setFormError(friendlyError(error));
    } finally {
      setQueueBusy(false);
    }
  }

  async function handleLeaveQueue() {
    if (!expertId) return;
    setQueueBusy(true);
    try {
      await leaveChatQueue(expertId);
      setQueued(false);
      setQueueInfo(undefined);
    } catch (error) {
      setFormError(friendlyError(error));
    } finally {
      setQueueBusy(false);
    }
  }

  if (!expertId) {
    return <main id="main-content" className="page stack"><p className="eyebrow">Book a consultation</p><h1>Choose a Pandit first</h1><p className="lede">Open a profile to see its live schedule, session options and exact total.</p><Link className="button" href="/pandits">Explore Pandits</Link></main>;
  }

  if (serviceError) {
    return <main id="main-content" className="page stack"><p className="eyebrow">Book a consultation</p><h1>Booking details are unavailable</h1><p className="lede">{friendlyError(serviceError)}</p><div className="actions"><button className="button" type="button" onClick={() => { expertQuery.reload(); catalogQuery.reload(); walletQuery.reload(); }}>Try again</button><Link className="button secondary" href={`/pandits/${encodeURIComponent(expertId)}`}>Back to profile</Link></div></main>;
  }

  const titleName = expert?.name || 'your chosen Pandit';
  const balance = Number.isFinite(walletQuery.data?.coinBalance) ? walletQuery.data?.coinBalance : undefined;

  return (
    <main id="main-content" className={`page stack ${styles.page}`}>
      <Link className="text-link" href={expert ? `/pandits/${encodeURIComponent(expert.id)}` : '/pandits'}>← Back to {expert ? 'profile' : 'Pandits'}</Link>
      <div className={styles.header}>
        <div>
          <p className="eyebrow">{step === 'review' ? 'Review before paying' : isChatNow ? 'Instant conversation' : 'Choose a time that works'}</p>
          <h1>{step === 'review' ? 'Review your consultation' : isChatNow ? 'Start a Chat Now conversation' : 'Book a timed consultation'}</h1>
          <p className="lede">{expert ? `A private ${selectedFormat?.label?.toLowerCase() || 'consultation'} with ${titleName}.` : 'Loading the Pandit profile…'}</p>
        </div>
        {balance !== undefined && <p className={styles.balance} aria-label={`Wallet balance ${balance} coins`}><strong>{balance}</strong> coins available</p>}
      </div>

      {formError && <div id="booking-form-error" className="error" role="alert" tabIndex={-1}><strong>We could not continue.</strong> {formError}{/wallet|coin|balance|insufficient/i.test(formError) && <> <Link className="text-link" href="/wallet/recharge">Add coins to your wallet →</Link></>}</div>}

      {step === 'choose' ? isChatNow ? (
        <form className={`panel stack ${styles.form}`} onSubmit={reviewBooking}>
          <div className={styles.sectionIntro}><h2>Check availability</h2><p>Chat Now uses the app&apos;s live presence and queue. The server sets the 15-minute session timer.</p></div>
          <div className={styles.chatStatus} role="status" aria-live="polite">
            {presenceLoading && <p>Checking whether {titleName} is available…</p>}
            {!presenceLoading && presence?.state === 'available' && <><strong>Available now</strong><span>You can start after the booking service confirms the session.</span></>}
            {!presenceLoading && presence?.state === 'busy' && <><strong>Currently in another conversation</strong><span>{presence.queueLength} people are waiting. You can join the queue if a place is available.</span>{queued && queueInfo && <span>You are #{queueInfo.position} in line · estimated wait {queueInfo.estimatedWaitMinutes} minutes.</span>}</>}
            {!presenceLoading && presence?.state === 'offline' && <><strong>Not available right now</strong><span>Try a scheduled time instead.</span></>}
          </div>
          {presence?.state === 'busy' && !queued && presence.canJoinQueue && <button className="button secondary" type="button" onClick={() => void handleJoinQueue()} disabled={queueBusy}>{queueBusy ? 'Joining queue…' : 'Join the Chat Now queue'}</button>}
          {queued && <button className="text-link" type="button" onClick={() => void handleLeaveQueue()} disabled={queueBusy}>{queueBusy ? 'Updating queue…' : 'Leave the queue'}</button>}
          {quoteError && <p className="error" role="alert">{quoteError}</p>}
          {!quote && !quoteError && <p role="status">Checking the live Chat Now total…</p>}
          {quote && <div className={styles.quote} aria-live="polite"><div><span>Duration</span><strong>{quote.durationMinutes} minutes</strong></div><div><span>Total</span><strong>{quote.totalPrice} coins</strong></div><div><span>Format</span><strong>Chat</strong></div></div>}
          <label className="field">Question or context <span className="expert-meta">(optional)</span><textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={500} rows={4} placeholder="Share anything you would like the Pandit to know before the conversation." /></label>
          <div className="actions"><button className="button" type="submit" disabled={!quote || presenceLoading || presence?.state !== 'available' || !!quoteError}>Start Chat Now</button><Link className="button secondary" href={`/bookings/new?expertId=${encodeURIComponent(expertId)}&mode=scheduled`}>Choose a scheduled time</Link></div>
        </form>
      ) : (
        <form className={`panel stack ${styles.form}`} onSubmit={reviewBooking}>
          <div className={styles.sectionIntro}><h2>Set the scope</h2><p>The service provides the duration and total. Notes are optional and sent with this booking.</p></div>
          <div className={styles.grid}>
            <label className="field">Topic<select aria-label="Topic" value={area} onChange={event => setArea(event.target.value)} disabled={!catalog}>{catalog?.areas.map(item => <option value={item.key} key={item.key}>{item.label}</option>)}</select></label>
            <label className="field">Session depth<select aria-label="Session depth" value={depth} onChange={event => setDepth(event.target.value as BookingDepth)} disabled={!catalog}>{catalog?.scheduled.depths.map(item => <option value={item.key} key={item.key}>{item.label} · {item.durationMinutes} minutes</option>)}</select></label>
            <label className="field">Format<select aria-label="Format" value={format} onChange={event => setFormat(event.target.value as Format)} disabled={!catalog}>{catalog?.scheduled.formats.map(item => <option value={item.key} key={item.key}>{item.label}{item.surcharge ? ` · ${item.surcharge > 0 ? '+' : ''}${item.surcharge} coins` : ''}</option>)}</select></label>
            <label className="field">Date<input aria-label="Date" type="date" min={todayIstIso()} value={date} onChange={event => setDate(event.target.value)} /></label>
          </div>

          <fieldset className={styles.slots}>
            <legend>Available times <span className="expert-meta">(IST)</span></legend>
            {quoteError && <p className="error" role="alert">{quoteError}</p>}
            {!quote && !quoteError && <p role="status">Checking the live total…</p>}
            {quote && slots === undefined && !slotsError && <p role="status">Checking {titleName}&apos;s live availability…</p>}
            {slotsError && <p className="error" role="alert">{slotsError}</p>}
            {slots && availableSlots.length === 0 && <p role="status">No open times for this date. Try another day.</p>}
            {availableSlots.length > 0 && <div className={styles.slotGrid}>{availableSlots.map(slot => <button key={slot.startTime} className={selectedSlot === slot.startTime ? `button ${styles.slotSelected}` : 'button secondary'} type="button" aria-pressed={selectedSlot === slot.startTime} onClick={() => setSelectedSlot(slot.startTime)}>{formatSlotTime(slot.startTime)}<small>Available</small></button>)}</div>}
          </fieldset>

          <label className="field">Question or context <span className="expert-meta">(optional)</span><textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={500} rows={4} placeholder="Share anything you would like the Pandit to know before the conversation." aria-describedby="booking-notes-help" /></label>
          <p id="booking-notes-help" className="helper">Keep it brief. You can also explain the question at the start of the session.</p>
          {quote && <div className={styles.quote} aria-live="polite"><div><span>Duration</span><strong>{quote.durationMinutes} minutes</strong></div><div><span>Total</span><strong>{quote.totalPrice} coins</strong></div><div><span>Format</span><strong>{selectedFormat?.label || quote.format}</strong></div></div>}
          <div className="actions"><button className="button" type="submit" disabled={!quote || !selectedSlot || !!quoteError}>Review booking</button><Link className="text-link" href={`/pandits/${encodeURIComponent(expertId)}`}>Keep exploring</Link></div>
        </form>
      ) : (
        <section className={`panel stack ${styles.review}`} aria-labelledby="booking-review-title">
          <p className="eyebrow">One last check</p>
          <h2 id="booking-review-title" tabIndex={-1}>Your booking with {titleName}</h2>
          <dl className={styles.summary}>
            {isChatNow ? <div><dt>When</dt><dd>Start now</dd></div> : <div><dt>When</dt><dd>{formatIstDateTime(selectedSlot)}</dd></div>}
            <div><dt>Topic</dt><dd>{catalog?.areas.find(item => item.key === area)?.label || area}</dd></div>
            <div><dt>Session</dt><dd>{isChatNow ? 'Chat Now' : `${selectedDepth?.label || depth} · `}{quote?.durationMinutes} minutes · {isChatNow ? 'Chat' : selectedFormat?.label || format}</dd></div>
            <div><dt>Total</dt><dd><strong>{quote?.totalPrice} coins</strong></dd></div>
          </dl>
          {notes.trim() && <div className={styles.notes}><span>Optional note</span><p>{notes.trim()}</p></div>}
          <p className="helper">Your wallet is charged only when the booking service confirms this slot. The server keeps the timer and session terms for the booking.</p>
          <div className="actions"><button className="button" type="button" onClick={() => void confirmBooking()} disabled={submitting}>{submitting ? 'Confirming…' : isChatNow ? `Start Chat Now · ${quote?.totalPrice} coins` : `Confirm booking · ${quote?.totalPrice} coins`}</button><button className="button secondary" type="button" onClick={() => setStep('choose')} disabled={submitting}>Change details</button></div>
        </section>
      )}
    </main>
  );
}

