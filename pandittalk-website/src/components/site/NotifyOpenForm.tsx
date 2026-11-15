'use client';

import { FormEvent, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { supportEmail } from '@/content/siteIdentity';
import { availabilityCopy } from '@/content/availability';

/** Production waitlist endpoint — used when NEXT_PUBLIC_NOTIFY_SHEET_URL is unset so prod builds still accept signups. */
const DEFAULT_NOTIFY_SHEET_URL =
  'https://script.google.com/macros/s/AKfycbwDCdsm2ZUpkFRwhNJx6uMvyywLjHH2xfOw54Y8IjsZRHqr1RSM0hSW6TbUv9oitALGsw/exec';

const NOTIFY_SHEET_URL =
  process.env.NEXT_PUBLIC_NOTIFY_SHEET_URL?.trim() || DEFAULT_NOTIFY_SHEET_URL;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function emailFieldLabel(source: string) {
  if (source.includes('ios')) return 'Email for App Store launch updates';
  if (source.includes('recharge') || source.includes('wallet')) return 'Email for recharge updates';
  if (source.includes('paid_tool') || source.includes('tools_index_paid')) return 'Email for paid-report updates';
  if (source.includes('pricing')) return 'Email for pricing and booking updates';
  if (source.includes('for_pandits') || source.includes('for-pandits')) return 'Email for practitioner updates';
  return availabilityCopy.waitlistLabel;
}

function successCopy(source: string, duplicate = false) {
  if (source.includes('ios')) {
    return duplicate
      ? 'You’re already on the iOS App Store list. We’ll write when the app is available — not for booking updates.'
      : 'You’re on the iOS App Store list. We’ll write when the Pandit Talk iOS app is available — not for booking updates.';
  }
  if (source.includes('recharge') || source.includes('wallet')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when wallet recharge opens.'
      : 'You’re on the list. We’ll write when wallet recharge opens.';
  }
  if (source.includes('pricing')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when pricing and booking open.'
      : 'You’re on the list. We’ll write when pricing and No Timer booking open.';
  }
  if (source.includes('cookie') || source.includes('account_privacy') || source.includes('privacy')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when No Timer opens — separate from privacy or cookie questions.'
      : 'You’re on the list. We’ll write when No Timer opens — separate from privacy or cookie replies.';
  }
  if (source.includes('delete_account')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when No Timer opens — this does not restore a deleted account.'
      : 'You’re on the list. We’ll write when No Timer opens — this does not restore a deleted account.';
  }
  if (source.includes('disclaimer') || source.includes('trust')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when No Timer opens.'
      : 'You’re on the list. We’ll write when No Timer conversations open.';
  }
  if (source.includes('paid_tool') || source.includes('tools_index_paid')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when paid reports open.'
      : 'You’re on the list. We’ll write when paid reports open again.';
  }
  if (source.includes('after_reading') || source.includes('free_reading')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when No Timer opens.'
      : 'You’re on the list. We’ll write when No Timer conversations open.';
  }
  if (source.includes('contact')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when No Timer opens — this is separate from support email replies.'
      : 'You’re on the list. We’ll write when No Timer opens — this is separate from support email replies.';
  }
  if (source.includes('refund')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when No Timer opens — this is separate from refund replies.'
      : 'You’re on the list. We’ll write when No Timer opens — this is separate from refund support.';
  }
  if (source.includes('grievance')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when No Timer opens — this is separate from your grievance email.'
      : 'You’re on the list. We’ll write when No Timer opens — this is separate from grievance replies.';
  }
  if (source.includes('help')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when No Timer opens — separate from this help topic.'
      : 'You’re on the list. We’ll write when No Timer opens — separate from this help topic.';
  }
  if (source.includes('editorial') || source.includes('about') || source.includes('our_approach') || source.includes('how_it_works') || source.includes('tools_index')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when No Timer conversations open.'
      : 'You’re on the list. We’ll write when No Timer conversations open — browsing this page stays free.';
  }
  if (source.includes('for_pandits') || source.includes('for-pandits')) {
    return duplicate
      ? 'You’re already on the practitioner updates list. We’ll write about onboarding notes — not customer booking-open mail, and not your application decision.'
      : 'You’re on the practitioner updates list. We’ll write about onboarding notes — application decisions and customer booking-open mail stay separate.';
  }
  if (source.includes('journal') || source.includes('article')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when No Timer opens — reading the journal stays free.'
      : 'You’re on the list. We’ll write when No Timer conversations open — reading the journal stays free.';
  }
  if (source.includes('cookie') || source.includes('privacy') || source.includes('terms') || source.includes('delete_account') || source.includes('account_privacy')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when No Timer opens — separate from legal or privacy replies.'
      : 'You’re on the list. We’ll write when No Timer conversations open — separate from legal or privacy replies.';
  }
  if (source.includes('customer_home') || source.includes('accessibility') || source.includes('404')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when No Timer opens.'
      : 'You’re on the list. We’ll write when No Timer conversations open.';
  }
  if (source.includes('guidance')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when No Timer opens — your draft stays in this browser until then.'
      : 'You’re on the list. We’ll write when No Timer opens — your guidance draft stays saved in this browser.';
  }
  if (source.includes('directory') || source.includes('pandit')) {
    return duplicate
      ? 'You’re already on the list. We’ll write when No Timer booking with Pandits opens — signing up never charges or creates a booking.'
      : 'You’re on the list. We’ll write when No Timer booking with Pandits opens — signing up never charges or creates a booking.';
  }
  return duplicate
    ? 'You’re already on the list. We’ll write when No Timer opens — signing up never charges coins or creates a booking.'
    : 'You’re on the list. We’ll write when No Timer conversations open — signing up never charges coins or creates a booking.';
}

export function NotifyOpenForm({
  source,
  submitLabel,
  helpText,
  fieldLabel,
}: {
  /** Placement id for waitlist attribution — required so sources stay consistent. */
  source: string;
  submitLabel?: string;
  helpText?: string;
  fieldLabel?: string;
}) {
  const fieldId = useId();
  const helpId = useId();
  const errorId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' | '' }>({ text: '', type: '' });
  const placement = source.trim();

  if (!placement) {
    return (
      <p className="error" role="alert" aria-label="Notify form configuration error">
        Notify signup is misconfigured on this page (missing source). Please use the{' '}
        <Link href="/contact">contact page</Link> instead.
      </p>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (done) return;
    const form = event.currentTarget as HTMLFormElement;
    const trap = String(new FormData(form).get('company') || '').trim();
    if (trap) {
      setDone(true);
      setMsg({ text: successCopy(placement), type: 'ok' });
      return;
    }
    const value = email.trim().toLowerCase();
    if (!value) {
      setMsg({ text: 'Enter your email address.', type: 'err' });
      requestAnimationFrame(() => emailRef.current?.focus());
      return;
    }
    if (!isValidEmail(value)) {
      setMsg({ text: 'That email doesn’t look right. Check for a missing @ or domain.', type: 'err' });
      requestAnimationFrame(() => emailRef.current?.focus());
      return;
    }

    setBusy(true);
    setMsg({ text: '', type: '' });

    if (!NOTIFY_SHEET_URL) {
      setBusy(false);
      setMsg({
        text: `Notify signup is not configured on this environment. Email ${supportEmail} and we’ll add you manually.`,
        type: 'err',
      });
      requestAnimationFrame(() => emailRef.current?.focus());
      return;
    }

    try {
      const response = await fetch(NOTIFY_SHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ email: value, source: placement }),
      });
      const data = (await response.json()) as { ok?: boolean; duplicate?: boolean; error?: string };
      if (!data.ok) throw new Error(data.error || 'save failed');

      setDone(true);
      setMsg({ text: successCopy(placement, Boolean(data.duplicate)), type: 'ok' });
      if (!data.duplicate) setEmail('');
      requestAnimationFrame(() => document.getElementById(errorId)?.focus());
    } catch {
      setMsg({
        text: `Couldn’t save that just now. Try again later, or email ${supportEmail} — we won’t claim it was received until it saves.`,
        type: 'err',
      });
      requestAnimationFrame(() => emailRef.current?.focus());
    } finally {
      setBusy(false);
    }
  }

  const invalid = msg.type === 'err';

  return (
    <form className="notify-open-form" onSubmit={onSubmit} noValidate aria-busy={busy || undefined}>
      <div className="notify-open-row">
        <label className="field" htmlFor={fieldId}>
          {fieldLabel || emailFieldLabel(placement)}
          <input
          ref={emailRef}
          id={fieldId}
          name="email"
          type="email"
          inputMode="email"
          enterKeyHint="send"
          autoComplete="email"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="you@email.com"
          value={email}
          required={!done}
          disabled={busy || done}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${helpId} ${errorId}` : helpId}
          onChange={event => {
            setEmail(event.target.value);
            if (msg.type === 'err') setMsg({ text: '', type: '' });
          }}
          onKeyDown={event => {
            if (event.key !== 'Escape') return;
            if (!email && msg.type !== 'err' && !done) return;
            event.preventDefault();
            event.stopPropagation();
            if (done) {
              setMsg({ text: '', type: '' });
              requestAnimationFrame(() => {
                const switchBtn = document.getElementById(`${fieldId}-switch`);
                if (switchBtn instanceof HTMLElement) switchBtn.focus();
                else emailRef.current?.focus();
              });
              return;
            }
            setEmail('');
            setMsg({ text: '', type: '' });
            setDone(false);
          }}
        />
        </label>
        <input
          className="sr-only"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          defaultValue=""
        />
        <button className="button" type="submit" disabled={busy || done} aria-busy={busy || undefined} aria-describedby={msg.text ? errorId : helpId}>
          {busy ? 'Saving…' : done ? 'You’re on the list' : (submitLabel || 'Notify me')}
        </button>
      </div>
      <p id={helpId} className="notify-open-privacy">{helpText || 'Private list for availability updates only. See our'}{' '}<Link href="/privacy">Privacy policy</Link>. <span aria-hidden="true">No spam.</span></p>
      <p
        id={errorId}
        className={`notify-open-status${msg.type ? ` is-${msg.type}` : ''}`}
        role={msg.text ? (invalid ? 'alert' : 'status') : undefined}
        aria-live={msg.text ? (invalid ? 'assertive' : 'polite') : undefined}
        tabIndex={msg.text ? -1 : undefined}
        onKeyDown={event => {
          if (event.key !== 'Escape' || !msg.text) return;
          event.preventDefault();
          event.stopPropagation();
          if (done) {
            setDone(false);
            setMsg({ text: '', type: '' });
            setEmail('');
            requestAnimationFrame(() => emailRef.current?.focus());
            return;
          }
          setMsg({ text: '', type: '' });
          requestAnimationFrame(() => emailRef.current?.focus());
        }}
      >
        {msg.text}
      </p>
      {(done || invalid) && (
        <>
          <p className="sr-only" id={`${fieldId}-followup-hint`}>Arrow keys move between switch email or support, how booking works, free tools and draft. Escape blurs.</p>
          <LinkKeyboardGroup className="notify-open-followups" aria-label="Notify form follow-up" as="p" aria-describedby={`${fieldId}-followup-hint`}>
            {done ? (
              <button
                type="button"
                id={`${fieldId}-switch`}
                className="text-link"
                onClick={() => {
                  setDone(false);
                  setMsg({ text: '', type: '' });
                  setEmail('');
                  requestAnimationFrame(() => emailRef.current?.focus());
                }}
              >
                Use a different email
              </button>
            ) : (
              <Link className="text-link" href="/contact">Contact support →</Link>
            )}
            {' · '}
            <Link className="text-link" href="/how-it-works#booking-availability-how">How booking will work →</Link>
            {' · '}
            <Link className="text-link" href="/tools">Try free tools →</Link>
            {' · '}
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </>
      )}
    </form>
  );
}
