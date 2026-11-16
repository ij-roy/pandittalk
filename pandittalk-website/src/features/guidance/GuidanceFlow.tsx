'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useApi } from '@/lib/api/client';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { LoadingState } from '@/components/site/Skeleton';
import { areas, emptyDraft, readDraft, saveGuidanceDraft, clearGuidanceDraft } from './state';
import { newBookingBlock } from '@/features/bookings/types';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { availabilityCopy } from '@/content/availability';

type Expert = { id: string; name?: string; firstName?: string; lastName?: string };
const expertName = (expert?: Expert) => expert?.name || [expert?.firstName, expert?.lastName].filter(Boolean).join(' ') || 'Pandit profile';
const labels = ['Your area', 'Your question', 'What to expect', 'Format', 'Your Pandit', 'Review draft'];
const formats = { chat: 'Chat', audio: 'Audio call', video: 'Video call' } as const;

export default function GuidanceFlow() {
  const [draft, setDraft] = useState(emptyDraft);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [deepLinkNote, setDeepLinkNote] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const clearRef = useRef<HTMLDivElement | null>(null);
  const expertErrorRef = useRef<HTMLDivElement>(null);
  const experts = useApi<Expert[] | { experts: Expert[] }>('/experts');
  const list = Array.isArray(experts.data) ? experts.data : experts.data?.experts || [];
  const selectedExpert = list.find(expert => expert.id === draft.panditId);

  useEffect(() => {
    const restored = readDraft();
    const params = new URLSearchParams(location.search);
    const expertId = params.get('expertId');
    const area = params.get('area');
    const format = params.get('format');
    let next = restored;
    if (expertId && /^[\w-]{1,100}$/.test(expertId)) next = { ...next, panditId: expertId };
    if (area && areas.includes(area as typeof areas[number])) next = { ...next, area };
    if (format && (format === 'chat' || format === 'audio' || format === 'video')) next = { ...next, format };
    setDraft(next);
    // Deep links land on the first incomplete step so area/format/pandit arrive in context.
    let initialStep = 0;
    if (next.area) initialStep = 1;
    if (next.format && !next.area) initialStep = 0; // format kept; choose area first
    if (next.area && next.format) initialStep = next.panditId ? 5 : 4;
    if (params.get('step') === 'review' || params.get('review') === '1') {
      if (next.area && next.format) initialStep = 5;
    }
    setStep(initialStep);
    const notes: string[] = [];
    if (area && next.area) notes.push(`Area set to ${next.area}`);
    if (format && next.format) notes.push(`Preferred format set to ${formats[next.format]} — preference only, not a live session`);
    if (format && !next.area && next.format) notes.push('Choose an area next — your preferred format stays selected');
    if (expertId && next.panditId) notes.push('A Pandit was pre-selected from the link — drafts do not notify them');
    if (notes.length) setDeepLinkNote(`${notes.join('. ')}. You can change any choice while this draft is saved. ${availabilityCopy.publicStatus}`);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!storageError) return;
    requestAnimationFrame(() => document.getElementById('guidance-storage-status')?.focus());
  }, [storageError]);

  useEffect(() => {
    if (!deepLinkNote) return;
    requestAnimationFrame(() => document.getElementById('guidance-deeplink-note')?.focus());
  }, [deepLinkNote]);

  useEffect(() => {
    if (step !== 4 || !experts.error) return;
    requestAnimationFrame(() => expertErrorRef.current?.focus());
  }, [step, experts.error]);

  useEffect(() => {
    if (!ready) return;
    setStorageError(saveGuidanceDraft(draft) ? '' : 'This browser cannot preserve your draft. Keep this page open.');
  }, [draft, ready]);

  useEffect(() => {
    if (!confirmClear) return;
    const node = clearRef.current;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(node?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []).filter(el => !el.hasAttribute('disabled'));
    const items = focusables();
    (items.find(el => !el.className.includes('danger')) || items[0])?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setConfirmClear(false); return; }
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
  }, [confirmClear]);

  function canEnter(index: number) {
    if (index <= 0) return true;
    if (!draft.area) return false;
    if (index >= 4 && !draft.format) return false;
    return true;
  }

  function goToStep(nextStep: number) {
    if (nextStep > step && !canEnter(nextStep)) return;
    setStep(nextStep);
    requestAnimationFrame(() => heading.current?.focus());
  }

  return <main id="main-content" className="page stack guidance-flow">
    <div inert={confirmClear ? true : undefined}>
    <p className="eyebrow">A little preparation. A more useful conversation.</p>
    <h1>What is on your mind?</h1>
    <p className="lede">You can take your time putting it into words. This private draft stays in your browser, does not make a booking, and never charges coins.</p>
    <aside className="notice" role="status" aria-label="Booking availability">
      <p><strong>{availabilityCopy.publicStatus}</strong> {availabilityCopy.publicDetail} Preparing a draft does not create a booking or charge.</p>
      <div className="notify-inline stack">
        <NotifyOpenForm source="website_guidance_start" />
        <p className="sr-only" id="guidance-start-actions-hint">Arrow keys move between Explore Pandits, free tools, stay on draft and booking updates. Escape blurs the focused control. NotifyOpenForm still requires source. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="While preparing a guidance draft" aria-describedby="guidance-start-actions-hint">
          <Link className="button secondary" href="/pandits">Explore Pandits</Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="button secondary" href="/guidance/start">Stay on this draft</Link>
          <Link className="text-link" href="/how-it-works#booking-availability-how">How booking will work →</Link>
        </LinkKeyboardGroup>
      </div>
    </aside>

    <div className="guidance-progress" aria-hidden="true">
      <div className="guidance-progress-bar" style={{ width: `${((step + 1) / labels.length) * 100}%` }} />
    </div>
    <p className="expert-meta guidance-progress-label" role="status">Step {step + 1} of {labels.length}: {labels[step]}</p>

    <p className="sr-only" id="guidance-steps-hint">Arrow keys move between reachable guidance steps. Home and End jump to the first or last enabled step. Escape blurs the focused step. Skip remains site-content.</p>
    <LinkKeyboardGroup className="actions guidance-steps" role="navigation" aria-label="Guidance steps" aria-describedby="guidance-steps-hint">
      {labels.map((label, index) => (
        <button
          type="button"
          className={step === index ? 'button' : 'button secondary'}
          key={label}
          aria-label={`${index + 1}. ${label}`}
          aria-current={step === index ? 'step' : undefined}
          disabled={!ready || index > step + 1 || (index > step && !canEnter(index))}
          onClick={() => goToStep(index)}
        >
          <span className="guidance-step-index" aria-hidden="true">{index + 1}</span>
          <span className="guidance-step-label" aria-hidden="true">{label}</span>
        </button>
      ))}
    </LinkKeyboardGroup>

    {storageError && (
      <div className="notice stack" role="status" tabIndex={-1} id="guidance-storage-status" onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        (event.currentTarget as HTMLElement).blur();
      }}>
        <p>
          <strong>This browser cannot preserve your draft.</strong> Keep this page open while you finish — refreshing or closing the tab may lose what you typed. Copy any notes you need into another app if you must leave. Preparing a draft still does not create a booking or charge coins. Press Escape to leave this notice (it will return if saving fails again).
        </p>
        <p className="sr-only" id="guidance-storage-hint">Arrow keys move between free tools, Pandits, support and booking updates while draft storage is unavailable. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
        <LinkKeyboardGroup className="actions" aria-label="Draft storage recovery" aria-describedby="guidance-storage-hint">
          <Link className="button secondary" href="/tools">Try free tools instead</Link>
          <Link className="button secondary" href="/pandits">Explore Pandits</Link>
          <Link className="text-link" href="/contact">Contact support →</Link>
          <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
        </LinkKeyboardGroup>
      </div>
    )}
    {deepLinkNote && <p className="notice" role="status" tabIndex={-1} id="guidance-deeplink-note" onKeyDown={event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setDeepLinkNote('');
      requestAnimationFrame(() => heading.current?.focus());
    }}>{deepLinkNote} Press Escape to dismiss and continue.</p>}
    <section className="panel stack" aria-labelledby="guidance-step-title" aria-busy={!ready}>
      <p className="eyebrow">Step {step + 1} of {labels.length}</p>
      <h2 id="guidance-step-title" ref={heading} tabIndex={-1}>{labels[step]}</h2>
      {!ready ? <p role="status">Restoring your draft…</p> : <>
        {step === 0 && <label className="field">Where would you like guidance?<select value={draft.area} required aria-describedby="guidance-area-help" onChange={event => setDraft({ ...draft, area: event.target.value })} onKeyDown={event => {
          if (event.key !== 'Escape' || !draft.area) return;
          event.preventDefault();
          setDraft({ ...draft, area: '' });
        }}><option value="" disabled>Choose an area</option>{areas.map(area => <option key={area} value={area}>{area.charAt(0).toUpperCase() + area.slice(1)}</option>)}</select><small id="guidance-area-help">{draft.area ? 'Press Escape to clear the area.' : 'Choose the topic area that fits best.'}</small></label>}
        {step === 1 && <>
          <label className="field">Your question or context (optional)<textarea maxLength={200} rows={5} value={draft.notes} placeholder="For example, I am considering a change at work…" enterKeyHint="next" aria-describedby="guidance-notes-count guidance-notes-privacy" onChange={event => setDraft({ ...draft, notes: event.target.value })} onKeyDown={event => {
            if (event.key !== 'Escape' || !draft.notes) return;
            event.preventDefault();
            setDraft({ ...draft, notes: '' });
          }} /></label>
          <small id="guidance-notes-count" aria-live="polite">{draft.notes.length}/200 characters{draft.notes ? ' · Escape clears notes' : ''}</small>
          <p id="guidance-notes-privacy" className="expert-meta">Draft notes stay in this browser. Preparing a draft does not share them with a Pandit. Review any text brought from a tool before continuing.</p>
        </>}
        {step === 2 && <>
          <h3>What to expect</h3>
          <p>{availabilityCopy.noTimerExplanation}</p>
          <p className="notice" role="status">{newBookingBlock}</p>
          <p>Your draft has no selected paid scope or hidden premium upgrade.</p>
        </>}
        {step === 3 && <fieldset className="stack" onKeyDown={event => {
          if (event.key !== 'Escape' || !draft.format) return;
          if (!(event.target instanceof HTMLInputElement) || event.target.type !== 'radio') return;
          event.preventDefault();
          setDraft({ ...draft, format: '' });
        }}>
          <legend>Preferred format for later (not a booking)</legend>
          {(Object.keys(formats) as (keyof typeof formats)[]).map(format => <label className="check" key={format}><input type="radio" name="format" value={format} checked={draft.format === format} onChange={() => setDraft({ ...draft, format })} /><span>{formats[format]}</span></label>)}
          <p className="expert-meta">Preference only — choosing a format does not start a consultation. Audio needs a microphone; video also needs a camera. Prices are not available yet.{draft.format ? ' Press Escape on a selected option to clear.' : ''}</p>
        </fieldset>}
        {step === 4 && <>
          {experts.loading && <>
            <LoadingState label="Loading Pandits…" variant="rows" />
            <p className="sr-only" id="guidance-experts-loading-hint">Skip remains site-content. Arrow keys move between free tools and draft if loading takes longer than expected. NotifyOpenForm still requires source.</p>
            <LinkKeyboardGroup className="actions" aria-label="While Pandits load" aria-describedby="guidance-experts-loading-hint">
              <Link className="button secondary" href="/tools">Try free tools</Link>
              <Link className="text-link" href="/guidance/start">Stay on draft →</Link>
            </LinkKeyboardGroup>
          </>}
          {experts.error && <div className="error" role="alert" tabIndex={-1} ref={expertErrorRef} onKeyDown={event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            (event.currentTarget as HTMLElement).blur();
          }}><p>We could not load the Pandit directory. Your draft is still here. Press Escape to leave this alert.</p><p className="sr-only" id="guidance-expert-load-hint">Arrow keys move between directory load recovery links. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p><LinkKeyboardGroup className="actions" aria-label="Guidance Pandit load recovery" aria-describedby="guidance-expert-load-hint"><button type="button" className="button secondary" onClick={experts.reload} disabled={experts.loading} aria-busy={experts.loading || undefined}>{experts.loading ? 'Trying again…' : 'Try again'}</button><Link className="button secondary" href="/pandits">Open directory</Link><Link className="button secondary" href="/tools">Try free tools</Link><Link className="button secondary" href="/guidance/start">Stay on draft</Link><Link className="text-link" href="/contact">Contact support →</Link></LinkKeyboardGroup></div>}
          <label className="field">Optional Pandit preference (not a booking)<select value={draft.panditId} disabled={experts.loading || !!experts.error} onChange={event => setDraft({ ...draft, panditId: event.target.value })} onKeyDown={event => {
            if (event.key !== 'Escape' || !draft.panditId) return;
            event.preventDefault();
            setDraft({ ...draft, panditId: '' });
          }}>
            <option value="">Optional — choose a Pandit later (does not notify or book)</option>
            {draft.panditId && !selectedExpert && <option value={draft.panditId}>Previously selected Pandit · profile unavailable</option>}
            {list.map(expert => <option key={expert.id} value={expert.id}>{expertName(expert)}</option>)}
          </select></label>
          {!experts.loading && !experts.error && list.length === 0 && (
            <div role="status" tabIndex={-1} id="guidance-experts-empty" onKeyDown={event => {
              if (event.key !== 'Escape') return;
              event.preventDefault();
              (event.currentTarget as HTMLElement).blur();
            }}>
              <p>No Pandits are listed right now. You can still save the rest of your draft. Press Escape to leave this notice.</p>
              <p className="sr-only" id="guidance-experts-empty-hint">Arrow keys move between empty-directory recovery links. Escape blurs. Skip remains site-content.</p>
              <LinkKeyboardGroup className="actions" aria-label="Guidance empty Pandit list" aria-describedby="guidance-experts-empty-hint">
                <Link className="button secondary" href="/pandits">Open directory</Link>
                <Link className="button secondary" href="/tools">Try free tools</Link>
                <Link className="button secondary" href="/guidance/start">Stay on draft</Link>
                <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
              </LinkKeyboardGroup>
            </div>
          )}
          <p className="sr-only" id="guidance-explore-hint">Arrow keys move between explore links. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Explore Pandits while drafting" aria-describedby="guidance-explore-hint" as="p">
            <Link className="text-link" href="/pandits">Explore biographies and experience →</Link>
            {' · '}
            <Link className="text-link" href="/tools">Try free tools →</Link>
          </LinkKeyboardGroup>
        </>}
        {step === 5 && <>
          <dl>
            <dt>Area</dt><dd>{draft.area ? draft.area.charAt(0).toUpperCase() + draft.area.slice(1) : 'Not selected'}</dd>
            <dt>Format</dt><dd>{draft.format ? formats[draft.format] : 'Not selected'}</dd>
            <dt>Pandit</dt><dd>{selectedExpert ? expertName(selectedExpert) : draft.panditId ? experts.loading ? 'Loading selected profile…' : 'Selected profile is currently unavailable' : 'Not selected'}</dd>
            <dt>Your notes</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{draft.notes || 'No notes added'}</dd>
            <dt>Charge</dt><dd>None — this optional draft never spends coins or reserves a time</dd>
          </dl>
          <label className="field">Preferred date (optional)<input type="date" value={draft.date} min={new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())} aria-describedby="guidance-date-help" onChange={event => setDraft({ ...draft, date: event.target.value })} onKeyDown={event => {
            if (event.key !== 'Escape' || !draft.date) return;
            event.preventDefault();
            setDraft({ ...draft, date: '' });
          }} /></label>
          <p id="guidance-date-help" className="expert-meta">Your date is a preference in Indian Standard Time. It does not reserve a time or confirm availability.{draft.date ? ' Press Escape to clear.' : ''}</p>
          <p className="notice" role="status" id="booking-block">{newBookingBlock}</p>
          <p className="expert-meta">Your draft is saved in this browser. To book, open a Pandit profile and choose a scheduled time or Chat Now.</p>
          <p className="sr-only" id="guidance-review-hint">Arrow keys move between guidance review next steps. Escape blurs the focused link. Skip remains site-content. NotifyOpenForm still requires source.</p>
          <LinkKeyboardGroup className="actions" aria-label="Guidance review next steps" aria-describedby="guidance-review-hint">
            <Link className="button secondary" href="/pandits">Browse Pandit profiles</Link>
            <Link className="button secondary" href="/login?returnTo=%2Fbookings&reason=auth">Sign in only if you already have a booking</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Stay on this draft</Link>
            <Link className="text-link" href="/how-it-works#booking-availability-how">How booking will work →</Link>
          </LinkKeyboardGroup>
          {!draft.panditId && (
            <>
              <p className="sr-only" id="guidance-review-pandit-hint">Arrow keys move between choose-Pandit actions. Escape blurs. Skip remains site-content.</p>
              <LinkKeyboardGroup as="p" className="expert-meta" role="status" aria-label="Choose a Pandit from review" aria-describedby="guidance-review-pandit-hint">
                No Pandit selected yet. You can <button type="button" className="text-link" onClick={() => goToStep(4)}>go back and choose one</button>, keep exploring the <Link href="/pandits">directory</Link>, <Link href="/tools">try free tools</Link>, or <Link href="/guidance/start">stay on this draft</Link>.
              </LinkKeyboardGroup>
            </>
          )}
        </>}
      </>}
    </section>
    <p className="sr-only" id="guidance-nav-actions-hint">Arrow keys move between Back, Continue and Start fresh. Escape blurs the focused control. Skip remains site-content.</p>
    <LinkKeyboardGroup className="actions" aria-label="Guidance draft navigation" aria-describedby="guidance-nav-actions-hint">
      <button type="button" className="button secondary" disabled={!ready || step === 0 || confirmClear} onClick={() => goToStep(step - 1)}>Back</button>
      {step < labels.length - 1 && (
        <>
          {ready && ((step === 0 && !draft.area) || (step === 3 && !draft.format)) && (
            <p className="expert-meta" id="guidance-continue-hint" role="status" tabIndex={-1}>
              {step === 0 && !draft.area ? 'Choose an area above before continuing.' : 'Choose a conversation format above before continuing.'}
            </p>
          )}
          <button
            type="button"
            className="button"
            aria-disabled={!ready || !canEnter(step + 1) || confirmClear || undefined}
            aria-describedby={ready && ((step === 0 && !draft.area) || (step === 3 && !draft.format)) ? 'guidance-continue-hint' : undefined}
            onClick={() => {
              if (!ready || confirmClear) return;
              if (!canEnter(step + 1)) {
                requestAnimationFrame(() => document.getElementById('guidance-continue-hint')?.focus());
                return;
              }
              goToStep(step + 1);
            }}
          >
            {!ready
              ? 'Continue'
              : step === 0 && !draft.area
                ? 'Choose an area to continue'
                : step === 3 && !draft.format
                  ? 'Choose a format to continue'
                  : 'Continue'}
          </button>
        </>
      )}
      <button type="button" className="button secondary" disabled={!ready || confirmClear} aria-label="Clear draft and start over" onClick={() => setConfirmClear(true)}>Start fresh</button>
    </LinkKeyboardGroup>
    </div>
    {confirmClear && (
      <div className="notice" role="alertdialog" aria-modal="true" aria-labelledby="clear-draft-title" ref={clearRef}>
        <p id="clear-draft-title"><strong>Clear this draft and start fresh?</strong></p>
        <p>Your notes and selections will be removed from this browser. Press Escape to keep the draft.</p>
        <p className="sr-only" id="guidance-clear-confirm-hint">Arrow keys move between Keep draft, Clear draft, free tools and Pandits. Escape keeps the draft. Skip remains site-content. NotifyOpenForm still requires source.</p>
        <LinkKeyboardGroup className="actions" aria-label="Clear guidance draft confirmation" aria-describedby="guidance-clear-confirm-hint">
          <button type="button" className="button secondary" onClick={() => setConfirmClear(false)}>Keep draft</button>
          <button
            type="button"
            className="button"
            onClick={() => {
              clearGuidanceDraft();
              setDraft({ ...emptyDraft });
              setConfirmClear(false);
              goToStep(0);
              setStorageError('Draft cleared. You can begin again.');
              requestAnimationFrame(() => document.getElementById('guidance-storage-status')?.focus());
            }}
          >
            Clear draft
          </button>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/pandits">Explore Pandits →</Link>
        </LinkKeyboardGroup>
      </div>
    )}
  </main>;
}
