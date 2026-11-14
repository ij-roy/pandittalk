"use client";

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, useApi } from '@/lib/api/client';
import { normalizePhone } from '@/lib/api/security';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import styles from './customer.module.css';

export async function logout() {
  const response = await fetch('/api/auth/logout', { method: 'POST' });
  if (!response.ok) throw new Error('Sign out failed. Please try again.');
  window.location.assign('/login');
}
export default function Account() {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const links = [
    ['profile', 'Personal details', 'Manage your profile photo, personal and birth details.'],
    ['story', 'Your story', 'Save a private note for a future conversation — new bookings stay paused.'],
    ['notifications', 'Notification preferences', 'Choose the updates you want to receive.'],
    ['phone', 'Phone number', 'Securely update the number linked to your account.'],
    ['privacy', 'Privacy & data', 'Find your data controls and privacy support.'],
    ['delete', 'Delete account', 'Review what happens before closing your account.'],
  ];
  return <main id="main-content" className="page stack" aria-busy={busy || undefined}>
    <div><p className="eyebrow">Your Pandit Talk</p><h1>Your account</h1><p className="lede">Your details, your preferences, your space.</p></div>
    <aside className="notice" role="status">
      <p>New No Timer bookings and wallet recharge stay paused. Account settings below still work for existing records and future access. <span className="sr-only" id="account-pause-hint">Arrow keys move between booking updates, free tools and draft. Escape blurs. Skip remains site-content.</span> <LinkKeyboardGroup as="span" aria-label="Account pause next steps" aria-describedby="account-pause-hint"><Link href="/how-it-works#booking-availability-how">Get a note when booking opens</Link> · <Link href="/tools">Try free tools</Link> · <Link href="/guidance/start">Prepare a draft</Link> · <Link href="/pandits">Explore Pandits</Link></LinkKeyboardGroup>.</p>
    </aside>
    <p className="sr-only" id="account-shortcuts-hint">Arrow keys move between account shortcuts including free tools and draft. Escape blurs. Skip remains site-content.</p>
    <LinkKeyboardGroup className="actions" aria-label="Account shortcuts" aria-describedby="account-shortcuts-hint">
      <Link className="button secondary" href="/home">My home</Link>
      <Link className="button secondary" href="/bookings">Bookings</Link>
      <Link className="button secondary" href="/wallet">Wallet</Link>
      <Link className="button secondary" href="/reports">Reports</Link>
      <Link className="button secondary" href="/notifications">Updates</Link>
      <Link className="button secondary" href="/tools">Free tools</Link>
      <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
    </LinkKeyboardGroup>
    <p className="sr-only" id="account-grid-hint">Arrow keys move between account settings cards. Home and End jump to the first or last card. Escape blurs. Skip remains site-content.</p>
    <div
      className="grid"
      role="navigation"
      aria-label="Account settings"
      aria-describedby="account-grid-hint"
      onKeyDown={event => {
        if (!(event.target instanceof HTMLAnchorElement)) return;
        const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>('a[href]'));
        const index = links.indexOf(event.target);
        if (index < 0) return;
        let next = index;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % links.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + links.length) % links.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = links.length - 1;
        else if (event.key === 'Escape') {
          event.preventDefault();
          event.target.blur();
          return;
        }
        else return;
        event.preventDefault();
        links[next]?.focus();
      }}
    >{links.map(([path, title, copy]) => <Link className="panel stack" key={path} href={'/account/' + path}><h2>{title}</h2><p>{copy}</p><span className="text-link">Manage →</span></Link>)}</div>
    {error && <p className="error" role="alert" tabIndex={-1} ref={errorRef} onKeyDown={e => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setError('');
      requestAnimationFrame(() => {
        const signOut = document.querySelector<HTMLButtonElement>('main .actions button.secondary');
        signOut?.focus();
      });
    }}>{error} Press Escape to dismiss and return to Sign out.</p>}
    {error ? (
      <>
        <p className="sr-only" id="account-signout-error-hint">Arrow keys move between support, account help, free tools and draft after a sign-out failure. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Sign out error recovery" aria-describedby="account-signout-error-hint">
          <Link className="button secondary" href="/contact">Contact support</Link>
          <Link className="button secondary" href="/help/account-access">Account access help</Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </>
    ) : null}
    <p className="sr-only" id="account-signout-hint">Arrow keys move between sign-out, help, tools and draft. Escape blurs. Skip remains site-content.</p>
    <LinkKeyboardGroup className="actions" aria-label="Sign out and help" aria-describedby="account-signout-hint">
      <button type="button" className="button secondary" disabled={busy} aria-busy={busy || undefined} onClick={() => { setBusy(true); setError(''); void logout().catch(e => { setError(e.message); setBusy(false); requestAnimationFrame(() => errorRef.current?.focus()); }); }}>{busy ? 'Signing out…' : 'Sign out'}</button>
      <Link className="text-link" href="/help/account-access">Need account help?</Link>
      <Link className="text-link" href="/tools">Try free tools</Link>
      <Link className="text-link" href="/guidance/start">Prepare a draft</Link>
      <Link className="text-link" href="/contact">Contact support</Link>
      <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates</Link>
    </LinkKeyboardGroup>
    <p className="expert-meta">Signing out only ends this browser session. It does not cancel bookings or delete your account.</p>
  </main>;
}

type PreferencesData = { bookingReminders: boolean; sessionUpdates: boolean; messages: boolean; marketing: boolean };
const preferences: [keyof PreferencesData, string, string][] = [
  ['bookingReminders', 'Booking reminders', 'A reminder before your upcoming consultation.'],
  ['sessionUpdates', 'Session updates', 'Changes and updates to your consultation.'],
  ['messages', 'Message updates', 'New messages related to your conversations.'],
  ['marketing', 'Product news', 'Occasional product news from Pandit Talk — not booking or recharge alerts. Those use separate notify lists on public pages.'],
];
export function Preferences() {
  const q = useApi<PreferencesData>('/users/notification-preferences');
  const [status, setStatus] = useState(''); const [failed, setFailed] = useState(false); const [busyKey, setBusyKey] = useState('');
  const [failedKey, setFailedKey] = useState<keyof PreferencesData | ''>('');
  const [draft, setDraft] = useState<PreferencesData | null>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const loadErrorRef = useRef<HTMLDivElement>(null);
  const view = draft ?? q.data;
  useEffect(() => { if (q.data) setDraft(q.data); }, [q.data]);
  useEffect(() => {
    if (q.error && !view) requestAnimationFrame(() => loadErrorRef.current?.focus());
  }, [q.error, view]);
  async function update(key: keyof PreferencesData, value: boolean) {
    if (!view) return;
    const previous = view;
    setDraft({ ...view, [key]: value });
    setBusyKey(key); setStatus(''); setFailed(false); setFailedKey('');
    try {
      await api('/users/notification-preferences', { method: 'PATCH', body: JSON.stringify({ [key]: value }) });
      setStatus(`${preferences.find(p => p[0] === key)?.[1] || 'Preference'} saved.`);
      q.reload();
    } catch (e) {
      setDraft(previous);
      setFailed(true);
      setFailedKey(key);
      setStatus(e instanceof Error ? e.message : 'Could not save preferences.');
    } finally {
      setBusyKey('');
      requestAnimationFrame(() => {
        const node = statusRef.current;
        if (!node) return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        node.focus({ preventScroll: true });
        node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
      });
    }
  }
  return <main id="main-content" className="page stack" aria-busy={q.loading || !!busyKey || undefined}><Link className="text-link" href="/account">← Your account</Link><h1>Notification preferences</h1><p className="lede">Choose the updates that are useful to you. Changes save automatically. Turning a preference on does not open No Timer booking or wallet recharge.</p>
    <aside className="notice" role="status">
      <p>
        <strong>Account alerts stay separate from public waitlists.</strong> Booking-open and recharge emails live on public pages, not these checkboxes.{' '}
        <span className="sr-only" id="pref-pause-hint">Arrow keys move between booking waitlist, recharge waitlist, free tools and draft. Escape blurs. Skip remains site-content.</span>
        <LinkKeyboardGroup as="span" aria-label="Preference pause waitlist links" aria-describedby="pref-pause-hint">
          <Link href="/how-it-works#booking-availability-how">Booking waitlist</Link>
          {' · '}
          <Link href="/wallet/recharge">Recharge waitlist</Link>
          {' · '}
          <Link href="/tools">Try free tools</Link>
          {' · '}
          <Link href="/guidance/start">Prepare a draft</Link>
        </LinkKeyboardGroup>
        .
      </p>
    </aside>
    {q.loading && !view && (
      <>
        <p className="notice" role="status">Loading your preferences…</p>
        <p className="sr-only" id="pref-loading-hint">Skip to content still targets site-content. Arrow keys move between free tools and draft if loading takes longer than expected.</p>
        <LinkKeyboardGroup className="actions" aria-label="While notification preferences load" aria-describedby="pref-loading-hint">
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          <Link className="text-link" href="/notifications">Open notifications →</Link>
        </LinkKeyboardGroup>
      </>
    )}
    {q.error && !view && <div className="error" role="alert" tabIndex={-1} ref={loadErrorRef} onKeyDown={e => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }}><p>{q.error.message} Press Escape to leave this alert.</p><p className="sr-only" id="pref-load-hint">Arrow keys move between preference load recovery links. Escape blurs. Skip remains site-content.</p><LinkKeyboardGroup className="actions" aria-label="Notification preference load recovery" aria-describedby="pref-load-hint"><button type="button" className="button secondary" onClick={q.reload} disabled={q.loading} aria-busy={q.loading || undefined}>{q.loading ? 'Trying again…' : 'Try again'}</button><Link className="button secondary" href="/notifications">Open notifications</Link><Link className="button secondary" href="/tools">Try free tools</Link><Link className="button secondary" href="/guidance/start">Prepare a draft</Link><Link className="text-link" href="/contact">Contact support →</Link></LinkKeyboardGroup></div>}
    {view && <fieldset className="panel stack" aria-busy={!!busyKey}><legend>Account notifications</legend>{preferences.map(([key, label, copy]) => <label className={styles.checkRow} key={key}><input type="checkbox" checked={Boolean(view[key])} disabled={busyKey === key} aria-busy={busyKey === key || undefined} aria-invalid={failedKey === key ? true : undefined} aria-describedby="pref-status" onChange={e => void update(key, e.target.checked)} /><span>{label}<small>{copy}{busyKey === key ? ' · Saving…' : ''}</small></span></label>)}</fieldset>}
    <p id="pref-status" role={failed ? 'alert' : 'status'} className={status ? (failed ? 'error' : 'notice') : 'sr-only'} tabIndex={status ? -1 : undefined} ref={statusRef} aria-live={failed ? 'assertive' : 'polite'} onKeyDown={event => {
      if (event.key !== 'Escape' || !status) return;
      event.preventDefault();
      const restoreKey = failedKey;
      setStatus('');
      setFailed(false);
      setFailedKey('');
      requestAnimationFrame(() => {
        if (restoreKey) {
          const boxes = Array.from(document.querySelectorAll<HTMLInputElement>('main fieldset input[type="checkbox"]'));
          const index = preferences.findIndex(p => p[0] === restoreKey);
          (boxes[index] || boxes[0])?.focus();
          return;
        }
        document.querySelector<HTMLInputElement>('main fieldset input[type="checkbox"]')?.focus();
      });
    }}>{status || 'Preference changes save automatically. Press Escape to dismiss a saved message.'}</p>
    {failed && status ? (
      <>
        <p className="sr-only" id="pref-save-recovery-hint">Arrow keys move between Refresh, support, free tools and draft after a preference save failure. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Preference save recovery" aria-describedby="pref-save-recovery-hint">
          <button type="button" className="button secondary" onClick={q.reload} disabled={q.loading} aria-busy={q.loading || undefined}>
            {q.loading ? 'Refreshing…' : 'Refresh preferences'}
          </button>
          <Link className="button secondary" href="/contact">Contact support</Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </>
    ) : null}
    <p className={styles.helper}>Service and safety messages may still be sent when necessary. Booking-open and recharge waitlists on public pages are separate from these account preferences. Product news is not a booking or recharge alert.</p>
    <p className="sr-only" id="pref-links-hint">Arrow keys move between preference recovery links. Escape blurs. Skip remains site-content.</p>
    <LinkKeyboardGroup className="actions" aria-label="Preference related links" aria-describedby="pref-links-hint">
      <Link className="text-link" href="/notifications">View your notifications →</Link>
      <Link className="text-link" href="/how-it-works#booking-availability-how">Booking waitlist →</Link>
      <Link className="text-link" href="/wallet/recharge">Recharge waitlist →</Link>
      <Link className="text-link" href="/tools">Try free tools →</Link>
      <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
    </LinkKeyboardGroup>
  </main>;
}
export function PhoneChange() {
  const [phone, setPhone] = useState(''); const [challenge, setChallenge] = useState(''); const [otp, setOtp] = useState('');
  const [status, setStatus] = useState(''); const [failed, setFailed] = useState(false); const [busy, setBusy] = useState(false); const [verified, setVerified] = useState(false);
  const [retryAt, setRetryAt] = useState(0); const [now, setNow] = useState(0);
  const phoneRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const wait = Math.max(0, Math.ceil((retryAt - now) / 1000));
  useEffect(() => {
    if (challenge || verified) return;
    requestAnimationFrame(() => phoneRef.current?.focus());
  }, [challenge, verified]);
  useEffect(() => {
    if (retryAt <= Date.now()) return;
    const timer = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (retryAt <= time) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  async function request(e?: FormEvent) {
    e?.preventDefault();
    if (busy || wait > 0) return;
    setBusy(true); setStatus(''); setFailed(false);
    const phoneNumber = normalizePhone(phone);
    if (!phoneNumber) {
      setBusy(false); setFailed(true); setStatus('Enter a valid 10-digit Indian mobile number.');
      requestAnimationFrame(() => {
        phoneRef.current?.focus();
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        statusRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
      });
      return;
    }
    try {
      const r = await api<{ challengeId: string }>('/users/phone-change/request', { method: 'POST', body: JSON.stringify({ phoneNumber }) });
      setChallenge(r.challengeId);
      setRetryAt(Date.now() + 30000);
      setNow(Date.now());
      setStatus('Code sent. Check the phone number you entered.');
      requestAnimationFrame(() => otpRef.current?.focus());
    } catch (e) {
      setFailed(true);
      const message = e instanceof Error ? e.message : 'Could not send a verification code.';
      const match = message.match(/(\d+)\s*seconds?/i);
      if (match) {
        setRetryAt(Date.now() + Number(match[1]) * 1000);
        setNow(Date.now());
      }
      setStatus(message);
      requestAnimationFrame(() => statusRef.current?.focus());
    } finally { setBusy(false); }
  }
  async function verify(e: FormEvent) {
    e.preventDefault(); setBusy(true); setStatus(''); setFailed(false);
    try { await api('/users/phone-change/verify', { method: 'POST', body: JSON.stringify({ challengeId: challenge, otp }) }); setVerified(true); setStatus('Phone number updated. Sign in again with your new number.'); requestAnimationFrame(() => statusRef.current?.focus()); await logout().catch(() => undefined); location.assign('/login?reason=reauth&returnTo=%2Fhome'); }
    catch (e) {
      setFailed(true);
      setStatus(e instanceof Error ? e.message : 'Could not verify this code.');
      requestAnimationFrame(() => statusRef.current?.focus());
    }
    finally { setBusy(false); }
  }
  return <main id="main-content" className="page stack" aria-busy={busy || undefined}><Link className="text-link" href="/account">← Your account</Link><h1>Change phone number</h1><p className="lede">We will send a verification code to your new number. Once verified, you will need to sign in again on your devices. Changing your number never opens No Timer booking or wallet recharge.</p>
    <aside className="notice" role="status">
      <p><strong>Account security only.</strong> A successful phone change updates sign-in access — it does not create a booking, move coins, or end the website pause. <span className="sr-only" id="phone-pause-hint">Arrow keys move between booking updates, free tools and draft. Escape blurs. Skip remains site-content.</span> <LinkKeyboardGroup as="span" aria-label="Phone change pause next steps" aria-describedby="phone-pause-hint"><Link href="/how-it-works#booking-availability-how">Booking updates</Link> · <Link href="/tools">Try free tools</Link> · <Link href="/guidance/start">Prepare a draft</Link></LinkKeyboardGroup>.</p>
    </aside>
    {verified ? <aside className="notice" role="status" tabIndex={-1} ref={statusRef} onKeyDown={e => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }}><p><strong>Phone number updated.</strong> Sign in again with your new number to continue. Press Escape to leave this notice.</p><p className="sr-only" id="phone-updated-hint">Arrow keys move between sign-in, account, tools and draft. Escape blurs. Skip remains site-content.</p><LinkKeyboardGroup className="actions" aria-label="After phone number update" aria-describedby="phone-updated-hint"><Link className="button" href="/login">Sign in with your new number</Link><Link className="text-link" href="/account">Back to account →</Link><Link className="text-link" href="/tools">Try free tools →</Link><Link className="text-link" href="/guidance/start">Prepare a draft →</Link></LinkKeyboardGroup></aside> : !challenge ? <form onSubmit={request} className="panel stack" aria-busy={busy}><label className="field">New Indian mobile number (+91)<div className="phone-field"><span className="phone-prefix" aria-hidden="true">+91</span><input ref={phoneRef} required type="tel" inputMode="numeric" autoComplete="tel-national" enterKeyHint="send" autoCapitalize="off" autoCorrect="off" spellCheck={false} disabled={busy} value={phone} onChange={e => { setPhone(e.target.value); if (failed) { setFailed(false); setStatus(''); } }} onKeyDown={e => { if (e.key === 'Escape' && phone) { e.preventDefault(); setPhone(''); if (failed) { setFailed(false); setStatus(''); } } }} placeholder="98765 43210" maxLength={14} aria-describedby={failed && status ? 'phone-help phone-change-status' : 'phone-help'} aria-invalid={failed && !challenge ? true : undefined} /></div></label><p className={styles.helper} id="phone-help">Enter your 10-digit number. Country code +91 is filled for you. Press Escape to clear.</p><p className="sr-only" id="phone-request-hint">Arrow keys move between Send, free tools and draft. Escape blurs. Skip remains site-content.</p><LinkKeyboardGroup className="actions" aria-label="Phone change send actions" aria-describedby="phone-request-hint"><button className="button" type="submit" disabled={busy || wait > 0} aria-busy={busy || undefined}>{busy ? 'Sending…' : wait > 0 ? `Try again in ${wait}s` : 'Send verification code'}</button><Link className="text-link" href="/tools">Try free tools →</Link><Link className="text-link" href="/guidance/start">Prepare a draft →</Link></LinkKeyboardGroup></form> : <form onSubmit={verify} className="panel stack" aria-busy={busy}><p>Enter the 4-digit code sent to <strong>+91 {normalizePhone(phone)?.replace('+91', '') || phone}</strong>.</p><label className="field">Verification code<input ref={otpRef} required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4}" minLength={4} maxLength={4} disabled={busy} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))} onKeyDown={e => { if (e.key !== 'Escape' || busy) return; e.preventDefault(); if (otp) { setOtp(''); return; } setChallenge(''); setStatus(''); setFailed(false); requestAnimationFrame(() => phoneRef.current?.focus()); }} aria-invalid={failed ? true : undefined} aria-describedby={failed && status ? 'otp-phone-help phone-change-status' : 'otp-phone-help'} enterKeyHint="done" /><small id="otp-phone-help" className={styles.helper}>Type the SMS code. Pandit Talk staff will never ask for this code. Escape clears the code, or returns to the phone field when the code is empty.</small></label><p className="sr-only" id="phone-verify-hint">Arrow keys move between Verify, Resend, Use a different number, free tools and draft. Escape blurs. Skip remains site-content.</p><LinkKeyboardGroup className="actions" aria-label="Phone change verify actions" aria-describedby="phone-verify-hint"><button className="button" type="submit" disabled={busy || otp.length !== 4} aria-busy={busy || undefined}>{busy ? 'Checking…' : 'Verify phone number'}</button><button className="button secondary" type="button" disabled={busy || wait > 0} aria-busy={busy || undefined} onClick={() => void request()}>{wait > 0 ? `Resend in ${wait}s` : 'Resend code'}</button><button className="button secondary" type="button" disabled={busy} onClick={() => { setChallenge(''); setOtp(''); setStatus(''); setFailed(false); requestAnimationFrame(() => phoneRef.current?.focus()); }}>Use a different number</button><Link className="text-link" href="/tools">Try free tools →</Link><Link className="text-link" href="/guidance/start">Prepare a draft →</Link></LinkKeyboardGroup></form>}
    {!verified && status && <p id="phone-change-status" role={failed ? 'alert' : 'status'} className={failed ? 'error' : 'notice'} tabIndex={-1} ref={statusRef} aria-live={failed ? 'assertive' : 'polite'} onKeyDown={e => {
      if (e.key !== 'Escape' || !status) return;
      e.preventDefault();
      setStatus('');
      setFailed(false);
      requestAnimationFrame(() => (challenge ? otpRef.current : phoneRef.current)?.focus());
    }}>{status} Press Escape to dismiss.</p>}
    {!verified && failed && status ? (
      <>
        <p className="sr-only" id="phone-fail-recovery-hint">Arrow keys move between account help, support, free tools and draft after a phone-change failure. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Phone change failure recovery" aria-describedby="phone-fail-recovery-hint">
          <Link className="button secondary" href="/help/account-access">Account access help</Link>
          <Link className="button secondary" href="/contact">Contact support</Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
        </LinkKeyboardGroup>
      </>
    ) : null}
    <p className="sr-only" id="phone-help-links-hint">Arrow keys move between phone change help links. Escape blurs. Skip remains site-content.</p><LinkKeyboardGroup className="actions" aria-label="Phone change help links" aria-describedby="phone-help-links-hint"><Link className="text-link" href="/help/account-access">Get account help</Link><Link className="text-link" href="/contact">Contact support</Link><Link className="text-link" href="/tools">Try free tools</Link><Link className="text-link" href="/guidance/start">Prepare a draft</Link></LinkKeyboardGroup>
  </main>;
}
export function DeleteAccount() {
  const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirmOpen) return;
    const node = confirmRef.current;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(node?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []).filter(el => !el.hasAttribute('disabled'));
    const items = focusables();
    (items.find(el => !el.className.includes('danger')) || items[0])?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setConfirmOpen(false); return; }
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
  }, [confirmOpen]);

  async function remove() {
    setBusy(true); setStatus(''); setConfirmOpen(false);
    try {
      const r = await api<{ success: boolean }>('/users/profile', { method: 'DELETE' });
      if (r.success !== true) throw new Error('Deletion was not confirmed. Please contact support before retrying.');
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Account was deactivated, but sign-out did not finish. Close this browser or clear site data, then visit the public deletion page.');
      location.assign('/delete-account?deleted=1');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Account deletion was not confirmed.';
      if (/reauth|re-auth|authenticated|sign in again|session expired/i.test(message)) {
        location.assign('/login?returnTo=%2Faccount%2Fdelete&reason=reauth');
        return;
      }
      setStatus(message);
      requestAnimationFrame(() => statusRef.current?.focus());
    } finally { setBusy(false); }
  }

  function requestDelete(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setConfirmOpen(true);
  }

  return <main id="main-content" className="page stack" aria-busy={busy || undefined}><Link className="text-link" href="/account">← Your account</Link><h1>Delete your account</h1>
    <div inert={confirmOpen ? true : undefined}>
    <section className="panel stack"><h2>Before you continue</h2><p>This deactivates your account and removes your profile details and photo. Some transaction, booking and report records may be retained.</p><p>If you have an active booking or a remaining wallet balance, contact support first to understand what happens to them. New No Timer bookings and recharge are already paused on the website, so deletion mainly affects your signed-in records and future access.</p><p className="sr-only" id="delete-before-hint">Arrow keys move between support, privacy, tools and draft. Escape blurs. Skip remains site-content.</p><LinkKeyboardGroup className="actions" aria-label="Delete account before you continue" aria-describedby="delete-before-hint"><Link className="button secondary" href="/contact">Contact support</Link><Link className="text-link" href="/account/privacy">Privacy and data controls</Link><Link className="text-link" href="/tools">Try free tools</Link><Link className="text-link" href="/guidance/start">Prepare a draft</Link><Link className="text-link" href="/delete-account">Public deletion instructions →</Link></LinkKeyboardGroup></section>
    <form onSubmit={requestDelete} className="panel stack" aria-busy={busy} onInvalid={event => {
      const target = event.target;
      if (target instanceof HTMLElement) requestAnimationFrame(() => {
        target.focus();
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      });
    }}><p>For your security, <Link href="/login?returnTo=%2Faccount%2Fdelete&reason=reauth">sign in again</Link> before deleting your account. Deletion may be refused if your current session is older than a few minutes.</p><label className={styles.checkRow}><input type="checkbox" required disabled={busy} /><span>I understand this deactivates my account and does not immediately remove all records.</span></label><label className="field">Type DELETE to confirm<input name="confirm-delete" pattern="DELETE" required autoComplete="off" disabled={busy} enterKeyHint="done" aria-describedby="delete-confirm-help" title="Type DELETE in capital letters" onKeyDown={e => {
      if (e.key !== 'Escape') return;
      const input = e.currentTarget;
      if (!input.value) return;
      e.preventDefault();
      input.value = '';
    }} /></label><p id="delete-confirm-help" className={styles.helper}>Type the word DELETE in capital letters to enable permanent deactivation. Press Escape to clear the field.</p><p className="sr-only" id="delete-form-hint">Arrow keys move between Delete, Keep, free tools and draft. Escape blurs the focused control. Skip remains site-content.</p><LinkKeyboardGroup className="actions" aria-label="Delete account form actions" aria-describedby="delete-form-hint"><button type="submit" className={`button secondary ${styles.danger}`} disabled={busy} aria-busy={busy || undefined}>{busy ? 'Deleting…' : 'Delete my account'}</button><Link className="text-link" href="/account">Keep my account</Link><Link className="text-link" href="/tools">Try free tools →</Link><Link className="text-link" href="/guidance/start">Prepare a draft →</Link></LinkKeyboardGroup></form>
    {status && <p role="alert" className="error" tabIndex={-1} ref={statusRef} aria-live="assertive" onKeyDown={e => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setStatus('');
      requestAnimationFrame(() => {
        const confirm = document.querySelector<HTMLInputElement>('input[name="confirm-delete"]');
        confirm?.focus();
      });
    }}>{status} Press Escape to dismiss and return to the confirmation field.</p>}
    {status && (
      <>
        <p className="sr-only" id="delete-error-hint">Arrow keys move between recovery links. Escape returns to the confirmation field. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Delete account error recovery" aria-describedby="delete-error-hint">
          <Link className="button secondary" href="/contact">Contact support</Link>
          <Link className="button secondary" href="/help/account-access">Account access help</Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          <Link className="text-link" href="/delete-account">Public deletion instructions →</Link>
        </LinkKeyboardGroup>
      </>
    )}
    </div>
    {confirmOpen && (
      <div className="notice" role="alertdialog" aria-modal="true" aria-labelledby="delete-final-title" ref={confirmRef}>
        <p id="delete-final-title"><strong>Permanently deactivate this account?</strong></p>
        <p>This cannot be undone from the website. Press Escape to cancel.</p>
        <p className="sr-only" id="delete-final-hint">Arrow keys move between Keep, Yes, free tools and draft. Escape cancels. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Delete account final confirmation" aria-describedby="delete-final-hint">
          <button type="button" className="button secondary" onClick={() => setConfirmOpen(false)}>Keep my account</button>
          <button type="button" className={`button secondary ${styles.danger}`} disabled={busy} aria-busy={busy || undefined} onClick={() => void remove()}>{busy ? 'Deleting…' : 'Yes, delete my account'}</button>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </div>
    )}
  </main>;
}
