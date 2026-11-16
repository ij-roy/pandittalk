'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api, useApi } from '@/lib/api/client';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { LoadingState } from '@/components/site/Skeleton';
import { parseBooking, type Booking } from '../bookings/types';
import { formatIstDate, formatIstDateTime } from '@/lib/time/ist';
import styles from './customer.module.css';

type Context = { id: string; text: string; version: number; updatedAt: string };
type PendingConfirm =
  | { type: 'delete'; id: string }
  | { type: 'share'; id: string; booking: Booking };

export default function StoryContext() {
  const q = useApi<Context[]>('/users/contexts');
  const bookings = useApi<unknown[]>('/bookings');
  const editor = useRef<HTMLTextAreaElement>(null);
  const confirmRef = useRef<HTMLDivElement | null>(null);
  const loadErrorRef = useRef<HTMLDivElement>(null);
  const bookingErrorRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(''); const [editing, setEditing] = useState<string>();
  const [message, setMessage] = useState(''); const [failed, setFailed] = useState(false); const [busy, setBusy] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  let bookingOptions: Booking[] = []; let bookingError = '';
  try { if (bookings.data) { if (!Array.isArray(bookings.data)) throw new Error('Your bookings could not be read.'); bookingOptions = bookings.data.map(parseBooking).filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status)); } }
  catch (e) { bookingError = e instanceof Error ? e.message : 'Your bookings could not be read.'; }
  const shareBookingsFailed = Boolean(bookings.error || bookingError);

  useEffect(() => {
    if (!pending) return;
    const node = confirmRef.current;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(node?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []).filter(el => !el.hasAttribute('disabled'));
    const items = focusables();
    (items.find(el => !el.className.includes('danger')) || items[0])?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setPending(null); return; }
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
  }, [pending]);

  useEffect(() => {
    if (!q.error) return;
    requestAnimationFrame(() => loadErrorRef.current?.focus());
  }, [q.error]);

  useEffect(() => {
    if (!shareBookingsFailed) return;
    requestAnimationFrame(() => bookingErrorRef.current?.focus());
  }, [shareBookingsFailed, bookings.error, bookingError]);

  useEffect(() => {
    if (q.loading || q.error || !q.data || q.data.length > 0) return;
    requestAnimationFrame(() => document.getElementById('story-empty')?.focus());
  }, [q.loading, q.error, q.data]);

  function reset() { setEditing(undefined); setDraft(''); editor.current?.focus(); }
  async function save() {
    const text = draft.trim();
    if (busy) return;
    if (text.length < 10) {
      setFailed(true);
      setMessage('Add at least a short note (10+ characters) before saving.');
      requestAnimationFrame(() => {
        const node = document.getElementById('story-message');
        node?.focus();
        node?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
      return;
    }
    setBusy(true); setMessage(''); setFailed(false);
    try {
      await api(editing ? `/users/contexts/${encodeURIComponent(editing)}` : '/users/contexts', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify({ text }) });
      reset(); q.reload(); setMessage('Saved privately to your account.');
      requestAnimationFrame(() => {
        const node = document.getElementById('story-message');
        node?.focus();
        node?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
    } catch (e) {
      setFailed(true);
      setMessage(e instanceof Error ? e.message : 'Could not save your story.');
      requestAnimationFrame(() => {
        const node = document.getElementById('story-message');
        node?.focus();
        node?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
    }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (busy) return;
    setBusy(true); setMessage(''); setFailed(false); setPending(null);
    try {
      await api(`/users/contexts/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (editing === id) reset();
      q.reload();
      setMessage('Your private story was deleted.');
      requestAnimationFrame(() => {
        const node = document.getElementById('story-message');
        node?.focus();
        node?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
    }
    catch (e) {
      setFailed(true);
      setMessage(e instanceof Error ? e.message : 'Could not delete your story.');
      requestAnimationFrame(() => {
        const node = document.getElementById('story-message');
        node?.focus();
        node?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
    }
    finally { setBusy(false); }
  }
  async function share(id: string, booking: Booking) {
    if (busy) return;
    setBusy(true); setMessage(''); setFailed(false); setPending(null);
    try {
      await api(`/users/contexts/${encodeURIComponent(id)}/share`, { method: 'POST', body: JSON.stringify({ bookingId: booking.id, panditId: booking.panditId }) });
      setMessage(`This version was shared with ${booking.panditName || booking.pandit?.name || 'your Pandit'} for the selected booking.`);
      requestAnimationFrame(() => {
        const node = document.getElementById('story-message');
        node?.focus();
        node?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
    }
    catch (e) {
      setFailed(true);
      setMessage(e instanceof Error ? e.message : 'Could not share your story.');
      requestAnimationFrame(() => {
        const node = document.getElementById('story-message');
        node?.focus();
        node?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
    }
    finally { setBusy(false); }
  }
  function requestShare(id: string) {
    const booking = bookingOptions.find(b => b.id === selectedBookings[id]);
    if (!booking || busy) return;
    setPending({ type: 'share', id, booking });
  }

  return <main id="main-content" className="page stack">
    <Link className="text-link" href="/account">← Your account</Link>
    <div><p className="eyebrow">Your story belongs to you</p><h1>A little context.<br />A better conversation.</h1><p className="lede">Save what matters privately. You decide when to share it with a Pandit for a specific existing booking — saving never creates a booking or charge.</p></div>
    <aside className="notice" role="status">
       <p><strong>Your story stays private until you choose to share it.</strong> Sharing requires an existing booking with a Pandit — saving or preparing a note does not notify anyone.</p>
       <p className="sr-only" id="story-pause-hint">Arrow keys move between story next-step links. Escape blurs the focused link. Skip remains site-content.</p>
       <LinkKeyboardGroup className="actions" aria-label="Story next steps" aria-describedby="story-pause-hint">
         <Link className="text-link" href="/guidance/start">Prepare an optional note →</Link>
        <Link className="text-link" href="/tools">Try free tools →</Link>
        <Link className="text-link" href="/bookings">View bookings →</Link>
         <Link className="text-link" href="/pandits">Choose a Pandit →</Link>
      </LinkKeyboardGroup>
    </aside>
    <form className="panel stack" aria-busy={busy} inert={pending ? true : undefined} onSubmit={e => { e.preventDefault(); void save(); }}>
      <label className="field">{editing ? 'Edit your private story' : 'Your private story'}<textarea ref={editor} rows={6} maxLength={2000} required minLength={10} value={draft} disabled={busy || !!pending} enterKeyHint="done" aria-invalid={failed ? true : undefined} aria-describedby={message ? 'story-length story-message' : 'story-length'} onChange={e => setDraft(e.target.value)} onKeyDown={e => {
        if (e.key !== 'Escape' || !draft || pending) return;
        e.preventDefault();
        setDraft('');
        if (failed) { setFailed(false); setMessage(''); }
      }} placeholder="What brings you here? What would make this conversation useful?" /></label>
      <p className={styles.helper} id="story-length" aria-live="polite">{draft.length.toLocaleString('en-IN')} / 2,000 characters · Private until you choose to share{draft && !pending ? ' · Escape clears the draft' : ''}</p>
      <p className="sr-only" id="story-form-actions-hint">Arrow keys move between Save, Clear, free tools and guidance draft. Escape blurs the focused control. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions" aria-label="Private story form actions" aria-describedby="story-form-actions-hint"><button type="submit" className="button" disabled={busy || !draft.trim() || !!pending} aria-busy={busy || undefined}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Save private story'}</button>{(editing || draft) && <button className="button secondary" type="button" disabled={busy || !!pending} onClick={reset}>{editing ? 'Cancel editing' : 'Clear draft'}</button>}<Link className="text-link" href="/tools">Try free tools →</Link><Link className="text-link" href="/guidance/start">Prepare a draft →</Link></LinkKeyboardGroup>
    </form>
    {message && <p id="story-message" className={failed ? 'error' : 'notice'} role={failed ? 'alert' : 'status'} tabIndex={-1} aria-live={failed ? 'assertive' : 'polite'} onKeyDown={e => {
      if (e.key !== 'Escape' || !message) return;
      e.preventDefault();
      setMessage('');
      setFailed(false);
      requestAnimationFrame(() => editor.current?.focus());
    }}>{message} Press Escape to dismiss and return to the editor.</p>}
    {pending && <div className="notice" role="alertdialog" aria-modal="true" aria-labelledby="story-confirm-title" ref={confirmRef}>
      {pending.type === 'delete' ? <>
        <p id="story-confirm-title"><strong>Delete this private story?</strong></p>
        <p>This cannot be undone. Press Escape to keep it.</p>
        <p className="sr-only" id="story-delete-hint">Arrow keys move between Keep, Confirm delete, free tools and draft. Escape blurs the focused control. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Confirm delete private story" aria-describedby="story-delete-hint">
          <button className="button secondary" type="button" disabled={busy} onClick={() => setPending(null)}>Keep story</button>
          <button className={`button secondary ${styles.danger}`} type="button" disabled={busy} aria-busy={busy || undefined} onClick={() => void remove(pending.id)}>{busy ? 'Deleting…' : 'Confirm delete'}</button>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </> : <>
        <p id="story-confirm-title"><strong>Share with {pending.booking.panditName || pending.booking.pandit?.name || 'your Pandit'}?</strong></p>
        <p>Only that Pandit will receive this version for your {formatIstDate(pending.booking.startTime)} · {pending.booking.format} booking. Press Escape to cancel.</p>
        <p className="sr-only" id="story-share-hint">Arrow keys move between Keep private, Confirm share, free tools and draft. Escape blurs the focused control. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Confirm share private story" aria-describedby="story-share-hint">
          <button className="button secondary" type="button" disabled={busy} onClick={() => setPending(null)}>Keep private</button>
          <button className="button" type="button" disabled={busy} aria-busy={busy || undefined} onClick={() => void share(pending.id, pending.booking)}>{busy ? 'Sharing…' : 'Confirm share'}</button>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </>}
    </div>}
    {q.loading && (
      <>
        <LoadingState label="Loading your private stories…" variant="cards" />
        <p className="sr-only" id="story-loading-hint">Skip to content still targets site-content. Arrow keys move between free tools and draft if loading takes longer than expected.</p>
        <LinkKeyboardGroup className="actions" aria-label="While private stories load" aria-describedby="story-loading-hint">
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </>
    )}
    {q.error && <div className="error" role="alert" tabIndex={-1} ref={loadErrorRef} onKeyDown={e => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }}><p>{q.error.message} Press Escape to leave this alert.</p><p className="sr-only" id="story-load-hint">Arrow keys move between story load recovery links. Escape blurs the focused control. Skip remains site-content.</p><LinkKeyboardGroup className="actions" aria-label="Story load recovery" aria-describedby="story-load-hint"><button type="button" className="button secondary" onClick={q.reload} disabled={q.loading} aria-busy={q.loading || undefined}>{q.loading ? 'Trying again…' : 'Try again'}</button><Link className="button secondary" href="/tools">Try free tools</Link><Link className="button secondary" href="/guidance/start">Prepare a draft</Link><Link className="text-link" href="/contact">Contact support →</Link></LinkKeyboardGroup></div>}
    {q.data?.length === 0 && <section className={`panel stack ${styles.empty}`} role="status" id="story-empty" tabIndex={-1} onKeyDown={e => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }}>
      <h2>A space for what matters</h2>
      <p>Your saved stories will appear here. Start with a few words whenever you are ready. Nothing is shared until you choose an existing booking. Press Escape to leave this notice.</p>
      <p className="sr-only" id="story-empty-hint">Arrow keys move between Write first note, story how-to, optional note, free tools and Pandits. Escape blurs the focused control. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions" aria-label="Empty story next steps" aria-describedby="story-empty-hint">
        <button className="button secondary" type="button" onClick={() => editor.current?.focus()}>Write your first note</button>
        <Link className="text-link" href="/how-it-works#your-story">How your story stays with you →</Link>
        <Link className="text-link" href="/guidance/start">Prepare an optional note →</Link>
        <Link className="text-link" href="/tools">Try free tools →</Link>
        <Link className="text-link" href="/pandits">Choose a Pandit →</Link>
      </LinkKeyboardGroup>
    </section>}
    <div inert={pending ? true : undefined}>
    {q.data?.map((item, index) => <article className="panel stack" key={item.id}>
      <div className={styles.cardHeader}><h2>{(() => { const text = item.text.trim(); if (!text) return `Saved story ${index + 1}`; if (text.length <= 48) return text; const cut = text.slice(0, 48); const space = cut.lastIndexOf(' '); return `${(space > 20 ? cut.slice(0, space) : cut).trim()}…`; })()}</h2><span className={styles.badge}>Private copy · v{item.version}</span></div>
      <p style={{ whiteSpace: 'pre-wrap' }}>{item.text}</p><small>Updated <time dateTime={item.updatedAt}>{formatIstDateTime(item.updatedAt)}</time></small>
      <p className="sr-only" id={`story-actions-${item.id}-hint`}>Arrow keys move between Edit, Delete, free tools and guidance draft. Escape blurs the focused control. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions" aria-label={`Saved story actions ${index + 1}`} aria-describedby={`story-actions-${item.id}-hint`}><button type="button" className="button secondary" disabled={busy} onClick={() => { setEditing(item.id); setDraft(item.text); editor.current?.focus(); }}>Edit story</button><button type="button" className={`button secondary ${styles.danger}`} disabled={busy} onClick={() => setPending({ type: 'delete', id: item.id })}>Delete</button><Link className="text-link" href="/tools">Try free tools →</Link><Link className="text-link" href="/guidance/start">Prepare a draft →</Link></LinkKeyboardGroup>
      <details
        onKeyDown={event => {
          if (event.key !== 'Escape') return;
          const root = event.currentTarget;
          if (!root.open) return;
          event.preventDefault();
          root.open = false;
          root.querySelector('summary')?.focus();
        }}
      >
        <summary>Share with your Pandit<span className="sr-only"> (expand or collapse; Escape closes)</span></summary>
        <div className="stack">
        <p className={styles.helper}>Choose an existing booking. Only its Pandit will receive this version of your story. Sharing does not create a new booking or charge coins.</p>
        {bookings.loading ? <LoadingState label="Loading your bookings…" variant="rows" /> : shareBookingsFailed ? <div className="error" role="alert" tabIndex={-1} ref={index === 0 ? bookingErrorRef : undefined} onKeyDown={e => {
          if (e.key !== 'Escape') return;
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }}><p>{bookings.error?.message || bookingError} Press Escape to leave this alert.</p><p className="sr-only" id={`story-share-booking-${item.id}-hint`}>Arrow keys move between Retry bookings, View bookings, free tools and Prepare an optional note. Escape blurs. Skip remains site-content.</p><LinkKeyboardGroup className="actions" aria-label="Story share booking recovery" aria-describedby={`story-share-booking-${item.id}-hint`}><button type="button" className="button secondary" onClick={bookings.reload} disabled={bookings.loading} aria-busy={bookings.loading || undefined}>{bookings.loading ? 'Retrying…' : 'Retry bookings'}</button><Link className="button secondary" href="/bookings">View bookings</Link><Link className="button secondary" href="/tools">Try free tools</Link><Link className="text-link" href="/guidance/start">Prepare an optional note →</Link></LinkKeyboardGroup><p className="expert-meta" style={{ marginTop: 8 }}>Sharing needs an existing booking.</p></div> : bookingOptions.length ? <><label className="field" htmlFor={`share-booking-${item.id}`}>Booking<select id={`share-booking-${item.id}`} value={selectedBookings[item.id] || ''} disabled={busy} onChange={e => setSelectedBookings(old => ({ ...old, [item.id]: e.target.value }))} onKeyDown={e => {
          if (e.key !== 'Escape' || !selectedBookings[item.id]) return;
          e.preventDefault();
          setSelectedBookings(old => ({ ...old, [item.id]: '' }));
        }}><option value="">Choose a consultation</option>{bookingOptions.map(b => <option key={b.id} value={b.id}>{b.panditName || b.pandit?.name || 'Pandit consultation'} · {formatIstDate(b.startTime)} · {b.format}</option>)}</select></label><button type="button" className="button" disabled={busy || !selectedBookings[item.id]} aria-busy={busy || undefined} onClick={() => requestShare(item.id)}>Share this version</button></> : <><p className="sr-only" id={`story-share-empty-${item.id}-hint`}>Arrow keys move between bookings, optional notes and free tools while sharing needs a booking. Escape blurs. Skip remains site-content.</p><LinkKeyboardGroup as="p" aria-label="Story share needs a booking" aria-describedby={`story-share-empty-${item.id}-hint`}>You need a booking before sharing. <Link href="/bookings">View your bookings</Link> or <Link href="/guidance/start">prepare an optional note</Link> · <Link href="/tools">try free tools</Link>.</LinkKeyboardGroup></>}
      </div></details>
    </article>)}
    </div>
    <p className="notice" role="status">Saving keeps your story private. Sharing sends one version to the Pandit for your chosen booking. Later edits do not change a version you already shared.</p>
  </main>;
}
