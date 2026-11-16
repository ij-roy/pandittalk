"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, type FormEvent } from 'react';
import { api, useApi } from '@/lib/api/client';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { LoadingState } from '@/components/site/Skeleton';
import { safeReturnTo } from '@/lib/api/security';
import { signs, validBirthDate } from '../tools/schemas';
import styles from './customer.module.css';

type Profile = Record<string, string | null>;
const personalFields = [
  ['firstName', 'First name', 100, 'given-name'],
  ['lastName', 'Last name', 100, 'family-name'],
  ['currentAddress', 'Current address', 500, 'street-address'],
  ['city', 'City', 100, 'address-level2'],
  ['postalCode', 'Postal code', 20, 'postal-code'],
] as const;
const options: [string, string, readonly string[]][] = [
  ['gender', 'Gender', ['male', 'female', 'other', 'prefer_not_to_say']],
  ['maritalStatus', 'Marital status', ['single', 'married', 'divorced', 'widowed', 'other']],
];

export default function ProfileForm() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setup = pathname === '/profile-setup';
  const skipHref = setup ? (safeReturnTo(searchParams.get('returnTo')) || '/home') : '/home';
  const { data, error, loading, reload } = useApi<Profile>('/users/profile');
  const [status, setStatus] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<'dob' | 'timeOfBirth' | null>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const loadErrorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) requestAnimationFrame(() => loadErrorRef.current?.focus());
  }, [error]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setStatus(''); setFailed(false); setFieldError(null);
    try {
      const form = new FormData(e.currentTarget);
      const body: Record<string, string> = {};
      for (const [key, value] of form.entries()) if (typeof value === 'string' && value.trim()) body[key] = value.trim();
      if (body.dob && !validBirthDate(body.dob)) {
        setFieldError('dob');
        setFailed(true);
        setBusy(false);
        setStatus('Enter a valid birth date that is not in the future.');
        requestAnimationFrame(() => {
          const field = document.querySelector<HTMLInputElement>('input[name="dob"]');
          field?.focus();
          statusRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
        });
        return;
      }
      if (body.timeOfBirth && !/^\d{1,2}:\d{2}(\s?[AaPp][Mm])?$/.test(body.timeOfBirth.trim())) {
        setFieldError('timeOfBirth');
        setFailed(true);
        setBusy(false);
        setStatus('Enter birth time like 10:30 or 10:30 AM (IST preferred).');
        requestAnimationFrame(() => {
          const field = document.querySelector<HTMLInputElement>('input[name="timeOfBirth"]');
          field?.focus();
          statusRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
        });
        return;
      }
      await api('/users/profile', { method: 'PATCH', body: JSON.stringify(body) });
      if (setup) {
        location.assign(skipHref);
        return;
      }
      setStatus('Profile saved.'); reload();
      requestAnimationFrame(() => {
        statusRef.current?.focus();
        statusRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      });
    } catch (e) {
      setFailed(true);
      setStatus(e instanceof Error ? e.message : 'Profile could not be saved.');
      requestAnimationFrame(() => {
        const message = e instanceof Error ? e.message : '';
        const focusName = /birth date/i.test(message) ? 'dob' : /birth time/i.test(message) ? 'timeOfBirth' : null;
        const field = focusName
          ? document.querySelector<HTMLElement>(`main form [name="${focusName}"]`)
          : null;
        if (field) {
          field.focus();
          field.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
          return;
        }
        statusRef.current?.focus();
        statusRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      });
    }
    finally { setBusy(false); }
  }
  async function upload(file?: File) {
    if (!file) return;
    setStatus(''); setFailed(false);
    const type = file.type || '';
    const name = file.name.toLowerCase();
    if (name.endsWith('.heic') || name.endsWith('.heif') || type === 'image/heic' || type === 'image/heif') {
      setFailed(true);
      setStatus('HEIC photos from iPhone need converting first. Export or save as JPEG, PNG or WebP, then try again.');
      requestAnimationFrame(() => statusRef.current?.focus());
      return;
    }
    if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
      setFailed(true);
      setStatus('Choose a JPEG, PNG or WebP image up to 5 MB.');
      requestAnimationFrame(() => statusRef.current?.focus());
      return;
    }
    setBusy(true);
    setStatus('Uploading your profile photo…');
    try {
      const form = new FormData(); form.set('file', file);
      await api('/users/profile/avatar', { method: 'POST', body: form });
      reload(); setStatus('Profile photo saved. It may take a moment to appear everywhere.');
      requestAnimationFrame(() => statusRef.current?.focus());
    } catch (e) {
      setFailed(true);
      setStatus(e instanceof Error ? e.message : 'Photo upload failed. Your previous photo is unchanged.');
      requestAnimationFrame(() => statusRef.current?.focus());
    }
    finally { setBusy(false); }
  }
  return <main id="main-content" className="page stack">
    {!setup && <Link className="text-link" href="/account">← Your account</Link>}
    <div>
      <p className="eyebrow">{setup ? 'Welcome to Pandit Talk' : 'Your details, at your pace'}</p>
      <h1>{setup ? 'Complete your profile' : 'Your profile'}</h1>
      <p className="lede">{setup
        ? 'Add a few optional details so a timed conversation can start with context. Completing or skipping this page never creates a booking or charge. You can finish later from your account.'
        : 'Keep your personal and birth details ready for a later conversation. All fields are optional. Saving here never opens a booking or charges coins.'}</p>
    </div>
    <aside className="notice" role="status">
      <p><strong>{setup ? 'Signing in does not open a booking.' : 'Saving profile details does not open a booking.'}</strong> Completing, editing or skipping this profile never charges coins. When you are ready, choose a Pandit to see the available timed session or Chat Now total before confirming. <span className="sr-only" id="profile-pause-hint">Arrow keys move between Pandits, free tools and an optional note. Escape blurs. Skip remains site-content.</span> <LinkKeyboardGroup as="span" aria-label="Profile next steps" aria-describedby="profile-pause-hint"><Link href="/pandits">Choose a Pandit</Link> · <Link href="/tools">Try free tools</Link> · <Link href="/guidance/start">Prepare an optional note</Link></LinkKeyboardGroup>.</p>
    </aside>
    {loading && <div aria-busy="true">
      <LoadingState label="Loading your profile…" variant="form" />
      <p className="sr-only" id="profile-inline-loading-hint">Skip to content still targets site-content. Arrow keys move between free tools and draft if loading takes longer than expected.</p>
      <LinkKeyboardGroup className="actions" aria-label="While profile details load" aria-describedby="profile-inline-loading-hint">
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
      </LinkKeyboardGroup>
    </div>}
    {error && <div className="error" role="alert" tabIndex={-1} ref={loadErrorRef} onKeyDown={e => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }}><p>{error.message} Press Escape to leave this alert.</p><p className="sr-only" id="profile-load-hint">Arrow keys move between profile load recovery links. Escape blurs the focused control. Skip remains site-content.</p><LinkKeyboardGroup className="actions" aria-label="Profile load recovery" aria-describedby="profile-load-hint"><button type="button" className="button secondary" onClick={reload} disabled={loading} aria-busy={loading || undefined}>{loading ? 'Trying again…' : 'Try again'}</button>{setup && <Link className="button" href={skipHref}>Skip for now</Link>}<Link className="button secondary" href="/tools">Try free tools</Link><Link className="button secondary" href="/guidance/start">Prepare a draft</Link><Link className="text-link" href="/contact">Contact support →</Link></LinkKeyboardGroup></div>}
    {status && <p id="profile-status" role={failed ? 'alert' : 'status'} className={failed ? 'error' : 'notice'} tabIndex={-1} ref={statusRef} aria-live={failed ? 'assertive' : 'polite'} onKeyDown={e => {
      if (e.key !== 'Escape' || !status) return;
      e.preventDefault();
      setStatus('');
      setFailed(false);
      requestAnimationFrame(() => {
        const invalid = document.querySelector<HTMLElement>('#main-content [aria-invalid="true"]');
        (invalid || document.querySelector<HTMLElement>('#main-content form input, #main-content form select, #main-content form textarea'))?.focus();
      });
    }}>{status} Press Escape to dismiss and return to the form.</p>}
    {status && failed && (
      <>
        <p className="sr-only" id="profile-save-recovery-hint">Arrow keys move between support, account help, free tools and draft after a profile save failure. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Profile save recovery" aria-describedby="profile-save-recovery-hint">
          <Link className="button secondary" href="/contact">Contact support</Link>
          <Link className="button secondary" href="/help/account-access">Account access help</Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </>
    )}
    {data && <>
      <section className={`panel ${styles.identity}`} aria-label="Contact details and profile photo">
        {data.profileImageUrl && /^https?:\/\//.test(data.profileImageUrl)
          ? <img src={data.profileImageUrl} alt="Your profile photo" width={88} height={88} />
          : <span className="expert-avatar portrait-fallback" role="img" aria-label="No profile photo yet" style={{ width: 88, height: 88 }}>{(data.firstName || data.phoneNumber || '?').toString().trim().slice(0, 1).toUpperCase()}</span>}
        <div><h2>Your account details</h2><p>Phone: {data.phoneNumber || 'Not linked'}</p><p>Email: {data.email || 'Not provided'}</p><p className="sr-only" id="profile-account-links-hint">Arrow keys move between phone, privacy, tools, draft and account home. Escape blurs. Skip remains site-content.</p><LinkKeyboardGroup className="actions" aria-label="Profile account links" aria-describedby="profile-account-links-hint"><Link className="text-link" href="/account/phone">Change phone number</Link><Link className="text-link" href="/account/privacy">Privacy &amp; data</Link><Link className="text-link" href="/tools">Try free tools</Link><Link className="text-link" href="/guidance/start">Prepare a draft</Link><Link className="text-link" href="/account">Account home →</Link></LinkKeyboardGroup></div>
        <div><label className="field">Profile photo<input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" aria-describedby="photo-help" disabled={busy} onChange={e => { const input = e.currentTarget; const file = input.files?.[0]; void upload(file).finally(() => { input.value = ''; }); }} onKeyDown={e => {
          if (e.key !== 'Escape' || !e.currentTarget.value) return;
          e.preventDefault();
          e.currentTarget.value = '';
        }} /></label><p id="photo-help" className={styles.helper}>JPEG, PNG or WebP · up to 5 MB · Convert HEIC photos first. Press Escape to clear a chosen file before upload finishes.</p></div>
      </section>
      <form key={JSON.stringify(data)} onSubmit={submit} className="stack" aria-busy={busy} onInvalid={event => {
        const target = event.target;
        if (target instanceof HTMLElement) requestAnimationFrame(() => target.focus());
      }}>
        <fieldset className="panel stack" disabled={busy}><legend>Personal details</legend><div className={styles.formGrid}>
          {personalFields.map(([name, label, max, autoComplete]) => <label key={name} className={`field ${name === 'currentAddress' ? styles.fullWidth : ''}`}>{label}<input name={name} autoComplete={autoComplete} enterKeyHint={name === 'postalCode' ? 'done' : 'next'} maxLength={max} minLength={name === 'postalCode' ? 3 : undefined} defaultValue={data[name] ?? ''} autoFocus={setup && name === 'firstName'} onKeyDown={e => {
            if (e.key !== 'Escape' || !e.currentTarget.value) return;
            e.preventDefault();
            e.currentTarget.value = '';
          }} /></label>)}
          {options.map(([name, label, values]) => <label className="field" key={name}>{label}<select name={name} defaultValue={data[name] ?? ''} onKeyDown={e => {
            if (e.key !== 'Escape' || !e.currentTarget.value) return;
            e.preventDefault();
            e.currentTarget.value = '';
          }}><option value="">Not specified</option>{values.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase())}</option>)}</select></label>)}
        </div></fieldset>
        <fieldset className="panel stack" disabled={busy}><legend>Birth details</legend><p className={styles.helper}>{setup ? 'Helpful for later conversations — optional now.' : 'Add what you know. You can complete these details later.'}</p><div className={styles.formGrid}>
          <label className="field">Birth date<input name="dob" type="date" autoComplete="bday" max={new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())} defaultValue={data.dob?.slice(0, 10) ?? ''} aria-invalid={fieldError === 'dob' ? true : undefined} aria-describedby={fieldError === 'dob' ? 'profile-status' : undefined} onKeyDown={e => {
            if (e.key !== 'Escape' || !e.currentTarget.value) return;
            e.preventDefault();
            e.currentTarget.value = '';
            if (fieldError === 'dob') setFieldError(null);
          }} /></label>
          <label className="field">Birth time (as recorded; IST preferred)<input name="timeOfBirth" maxLength={50} defaultValue={data.timeOfBirth ?? ''} placeholder="e.g. 10:30 AM" enterKeyHint="next" aria-describedby={fieldError === 'timeOfBirth' ? 'birth-time-help profile-status' : 'birth-time-help'} aria-invalid={fieldError === 'timeOfBirth' ? true : undefined} onKeyDown={e => {
            if (e.key !== 'Escape') return;
            const input = e.currentTarget;
            if (!input.value) return;
            e.preventDefault();
            input.value = '';
            if (fieldError === 'timeOfBirth') setFieldError(null);
          }} /></label>
          <label className="field">Birth place<input name="placeOfBirth" maxLength={255} defaultValue={data.placeOfBirth ?? ''} placeholder="City or town" autoComplete="address-level2" autoCapitalize="words" enterKeyHint="done" onKeyDown={e => {
            if (e.key !== 'Escape' || !e.currentTarget.value) return;
            e.preventDefault();
            e.currentTarget.value = '';
          }} /></label>
          <label className="field">Zodiac sign<select name="zodiacSign" defaultValue={data.zodiacSign ?? ''} onKeyDown={e => {
            if (e.key !== 'Escape' || !e.currentTarget.value) return;
            e.preventDefault();
            e.currentTarget.value = '';
          }}><option value="">Not specified</option>{signs.map(value => <option key={value} value={value}>{value.replace(/^./, c => c.toUpperCase())}</option>)}</select></label>
        </div>
        <p id="birth-time-help" className={styles.helper}>Use the time from your birth record when possible. India Standard Time (IST) is preferred if a timezone was not written down. Press Escape to clear a focused birth field.</p>
        </fieldset>
        <p className={styles.helper}>Leaving a field empty keeps its saved value. <span className="sr-only" id="profile-help-links-hint">Arrow keys move between contact support, account help, free tools and draft. Escape blurs. Skip remains site-content.</span><LinkKeyboardGroup as="span" aria-label="Profile help links" aria-describedby="profile-help-links-hint"><Link href="/contact">Contact support</Link> to remove a stored detail, <Link href="/help/account-access">get account help</Link>, <Link href="/tools">try free tools</Link>, or <Link href="/guidance/start">prepare a draft</Link></LinkKeyboardGroup>.</p>
        <p className="sr-only" id="profile-save-hint">Arrow keys move between Save, Skip, free tools and draft. Escape blurs the focused control. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label={setup ? 'Profile setup save actions' : 'Profile save actions'} aria-describedby="profile-save-hint">
          <button type="submit" className="button" disabled={busy} aria-busy={busy || undefined}>{busy ? 'Saving…' : setup ? 'Save and continue' : 'Save profile'}</button>
          <Link className="button secondary" href={skipHref}>{setup ? 'Skip for now' : 'Back to home'}</Link>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </form>
    </>}
  </main>;
}
