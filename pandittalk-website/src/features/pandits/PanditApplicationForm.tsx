'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { normalizePhone } from '@/lib/api/security';
import { api } from '@/lib/api/client';

export default function PanditApplicationForm() {
  const [status, setStatus] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [phone, setPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: boolean; practice?: boolean; languages?: boolean; phone?: boolean; consent?: boolean }>({});

  function announce(message: string, isError: boolean) {
    setFailed(isError);
    setStatus(message);
    requestAnimationFrame(() => {
      const node = document.getElementById('application-status');
      if (!node) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      node.focus({ preventScroll: true });
      node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
  }

  function focusFirstInvalid(errors: typeof fieldErrors) {
    requestAnimationFrame(() => {
      const form = document.querySelector<HTMLFormElement>('#apply form, form.panel');
      if (!form) return;
      const order: (keyof typeof errors)[] = ['name', 'phone', 'practice', 'languages', 'consent'];
      for (const key of order) {
        if (!errors[key]) continue;
        const field = form.querySelector<HTMLElement>(`[name="${key}"]`);
        if (field) {
          field.focus();
          return;
        }
      }
      document.getElementById('application-status')?.focus();
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || done) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const trap = String(fields.get('company') || '').trim();
    if (trap) {
      setFieldErrors({});
      setDone(true);
      announce('Thanks — if this was a real application, you will hear from us.', false);
      return;
    }
    const phoneNumber = normalizePhone(phone);
    const name = String(fields.get('name') || '').trim();
    const practice = String(fields.get('practice') || '').trim();
    const languages = String(fields.get('languages') || '').split(',').map(value => value.trim()).filter(Boolean);
    const consent = fields.get('consent') === 'on';
    const nextErrors = {
      phone: !phoneNumber,
      name: !name,
      practice: !practice,
      languages: languages.length === 0,
      consent: !consent,
    };
    if (nextErrors.phone || nextErrors.name || nextErrors.practice || nextErrors.languages || nextErrors.consent) {
      setFieldErrors(nextErrors);
      setFailed(true);
      if (nextErrors.phone) setStatus('Enter a valid 10-digit Indian mobile number.');
      else if (nextErrors.name || nextErrors.practice) setStatus('Enter your name and a short practice description.');
      else if (nextErrors.languages) setStatus('List at least one language you consult in.');
      else setStatus('Confirm consent so we can review your application and contact you.');
      focusFirstInvalid(nextErrors);
      return;
    }
    setBusy(true);
    setStatus('');
    setFailed(false);
    setFieldErrors({});
    try {
      const result = await api<{ id: string; status: string }>('/pandit-applications', {
        method: 'POST',
        body: JSON.stringify({
          name,
          phone: phoneNumber,
          email: fields.get('email') || undefined,
          practice,
          languages,
          message: fields.get('message') || undefined,
          consent: true,
        }),
      });
      form.reset();
      setPhone('');
      setDone(true);
      announce(`Application received. Reference: ${result.id}. Please keep this reference for your records.`, false);
    } catch (error) {
      announce(error instanceof Error ? error.message : 'Could not submit the application. Your details are still here; please try again.', true);
    } finally {
      setBusy(false);
    }
  }

  return <form className="panel stack" onSubmit={submit} aria-busy={busy} noValidate>
    <h2>Tell us about your practice</h2>
    <p className="expert-meta">Fields are required unless marked optional. Validation messages appear below the form. Submitting does not publish a public profile, create customer bookings, or charge anyone.</p>
    {done && !failed && (
      <aside className="notice" role="status" id="application-status" tabIndex={-1} onKeyDown={e => {
        if (e.key !== 'Escape') return;
        e.preventDefault();
        (e.currentTarget as HTMLElement).blur();
      }}>
        <p><strong>{status}</strong></p>
        <p className="expert-meta">Approved practitioners manage availability in the dashboard. Wait for our email before expecting a public profile. Press Escape to leave this confirmation.</p>
        <p className="sr-only" id="application-done-hint">Arrow keys move between next steps including free tools and draft. Escape blurs the focused control. Skip remains site-content. OfferNotice still requires source.</p>
        <LinkKeyboardGroup className="actions" aria-label="Application submitted next steps" aria-describedby="application-done-hint">
          <Link className="text-link" href="/for-pandits">Back to For Pandits</Link>
          <Link className="text-link" href="/trust">Trust standard →</Link>
          <Link className="text-link" href="/how-it-works">How conversations work →</Link>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          <Link className="text-link" href="/contact">Contact support →</Link>
          <button type="button" className="text-link" onClick={() => { setDone(false); setStatus(''); setFailed(false); requestAnimationFrame(() => document.querySelector<HTMLElement>('#apply input, #apply textarea, form input')?.focus()); }}>Submit another application</button>
        </LinkKeyboardGroup>
      </aside>
    )}
    {!done && <>
      <fieldset className="stack" disabled={busy}>
        <legend className="sr-only">Your application</legend>
        <label className="field">Name<input name="name" required autoComplete="name" enterKeyHint="next" autoCapitalize="words" maxLength={100} placeholder="Your full name" aria-invalid={fieldErrors.name ? true : undefined} aria-describedby={fieldErrors.name ? 'application-status' : undefined} onKeyDown={e => {
          if (e.key !== 'Escape' || !e.currentTarget.value) return;
          e.preventDefault();
          e.currentTarget.value = '';
          if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: false }));
        }} /></label>
        <label className="field">Indian mobile number (+91)<div className="phone-field"><span className="phone-prefix" aria-hidden="true">+91</span><input name="phone" type="tel" required inputMode="numeric" autoComplete="tel-national" enterKeyHint="next" autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder="98765 43210" maxLength={14} value={phone} onChange={e => { setPhone(e.target.value); if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: false })); }} onKeyDown={e => {
          if (e.key !== 'Escape' || !phone) return;
          e.preventDefault();
          setPhone('');
          if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: false }));
        }} aria-describedby={fieldErrors.phone ? 'application-phone application-phone-keyboard-hint application-status' : 'application-phone application-phone-keyboard-hint'} aria-invalid={fieldErrors.phone ? true : undefined} /></div></label>
        <small id="application-phone">Enter your 10-digit number. Country code is filled for you.</small>
        <span className="sr-only" id="application-phone-keyboard-hint">Press Escape to clear the number.</span>
        <label className="field">Email (optional)<input name="email" type="email" autoComplete="email" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="next" maxLength={254} placeholder="you@email.com" onKeyDown={e => {
          if (e.key !== 'Escape' || !e.currentTarget.value) return;
          e.preventDefault();
          e.currentTarget.value = '';
        }} /></label>
        <label className="field">Practice<input name="practice" required enterKeyHint="next" placeholder="Jyotish, Vastu, palmistry…" maxLength={200} aria-invalid={fieldErrors.practice ? true : undefined} aria-describedby={fieldErrors.practice ? 'application-status' : undefined} onKeyDown={e => {
          if (e.key !== 'Escape' || !e.currentTarget.value) return;
          e.preventDefault();
          e.currentTarget.value = '';
          if (fieldErrors.practice) setFieldErrors(prev => ({ ...prev, practice: false }));
        }} /></label>
        <label className="field">Languages<input name="languages" required enterKeyHint="next" placeholder="Hindi, English" aria-describedby={fieldErrors.languages ? 'application-languages application-status' : 'application-languages'} aria-invalid={fieldErrors.languages ? true : undefined} maxLength={200} onKeyDown={e => {
          if (e.key !== 'Escape' || !e.currentTarget.value) return;
          e.preventDefault();
          e.currentTarget.value = '';
          if (fieldErrors.languages) setFieldErrors(prev => ({ ...prev, languages: false }));
        }} /></label>
        <small id="application-languages">Separate each language with a comma.</small>
        <span className="sr-only" id="application-languages-keyboard-hint">Press Escape to clear the languages field.</span>
        <label className="field">Anything else (optional)<textarea name="message" rows={4} maxLength={2000} enterKeyHint="done" placeholder="Years of practice, regions you serve, or how you prefer to consult…" aria-describedby="application-message-help application-message-help-keyboard-hint" onKeyDown={e => {
          if (e.key !== 'Escape' || !e.currentTarget.value) return;
          e.preventDefault();
          e.currentTarget.value = '';
        }} /></label>
        <small id="application-message-help">Optional. Add any useful context about your practice.</small>
        <span className="sr-only" id="application-message-help-keyboard-hint">Press Escape to clear this note.</span>
        <input className="sr-only" name="company" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" defaultValue="" />
        <label className="check"><input name="consent" type="checkbox" required aria-invalid={fieldErrors.consent ? true : undefined} aria-describedby={fieldErrors.consent ? 'application-status' : undefined} /><span>I consent to Pandit Talk reviewing this application and contacting me about next steps. See the <span className="sr-only" id="application-privacy-hint">Arrow keys move between Privacy and Terms. Escape blurs.</span><LinkKeyboardGroup as="span" aria-label="Application legal links" aria-describedby="application-privacy-hint"><Link href="/privacy">Privacy Policy</Link> and <Link href="/terms-and-conditions">Terms &amp; Conditions</Link></LinkKeyboardGroup>.</span></label>
      </fieldset>
      <button type="submit" className="button" disabled={busy} aria-busy={busy || undefined}>{busy ? 'Sending application…' : 'Submit application'}</button>
      <p id="application-status" className={status ? (failed ? 'error' : 'notice') : 'sr-only'} role={failed ? 'alert' : 'status'} tabIndex={-1} aria-live={failed ? 'assertive' : 'polite'} onKeyDown={e => {
        if (e.key !== 'Escape' || !status) return;
        e.preventDefault();
        const priorErrors = fieldErrors;
        setStatus('');
        setFailed(false);
        setFieldErrors({});
        if (Object.values(priorErrors).some(Boolean)) focusFirstInvalid(priorErrors);
        else requestAnimationFrame(() => (e.currentTarget as HTMLElement).closest('form')?.querySelector<HTMLElement>('input, textarea, select, button')?.focus());
      }}>{status ? `${status}${failed ? ' Press Escape to dismiss.' : ''}` : 'Application status will appear here after you submit.'}</p>
      {failed && status ? (
        <>
          <p className="sr-only" id="application-error-hint">Arrow keys move between application error recovery links. Escape blurs. OfferNotice still requires source. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Application error recovery" aria-describedby="application-error-hint">
            <Link className="button secondary" href="/contact">Contact support</Link>
            <Link className="button secondary" href="/trust">Read our trust standard</Link>
            <Link className="button secondary" href="/how-it-works">How conversations work</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/for-pandits">Back to For Pandits →</Link>
          </LinkKeyboardGroup>
        </>
      ) : null}
    </>}
  </form>;
}
