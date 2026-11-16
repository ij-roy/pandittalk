'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { normalizePhone, safeReturnTo } from '@/lib/api/security';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { SocialSignIn } from './SocialSignIn';

type AuthResult = { needsPhone?: boolean; pendingToken?: string; hasProfile?: boolean };
type Action = 'request-otp' | 'verify-otp' | 'complete-social';
type MessageTone = 'status' | 'alert';

export function AuthForm() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [socialConsentAttempted, setSocialConsentAttempted] = useState(false);
  const [socialConsentToast, setSocialConsentToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [messageTone, setMessageTone] = useState<MessageTone>('status');
  const [pending, setPending] = useState<string>();
  const [retryAt, setRetryAt] = useState<Partial<Record<Action, number>>>({});
  const [now, setNow] = useState(0);
  const [destination, setDestination] = useState('/home');
  const otpRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const socialConsentRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const socialConsentToastTimer = useRef<number | null>(null);
  const action = sent ? pending ? 'complete-social' : 'verify-otp' : 'request-otp';
  const secondsLeft = (target: Action) => Math.max(0, Math.ceil(((retryAt[target] || 0) - now) / 1000));
  const destinationLabel = (() => {
    if (destination.startsWith('/bookings/new')) return 'the booking page';
    if (destination.startsWith('/wallet/recharge')) return 'wallet recharge';
    if (destination.startsWith('/bookings')) return 'your existing bookings list';
    if (destination.startsWith('/wallet')) return 'your wallet';
    if (destination.startsWith('/guidance')) return 'your guidance draft';
    if (destination.startsWith('/tools')) return 'free tools';
    if (destination.startsWith('/reports')) return 'your saved reports';
    return destination;
  })();

  function announce(note: string, isError = false, tone: MessageTone = isError ? 'alert' : 'status') {
    setFailed(isError);
    setMessageTone(tone);
    setMessage(note);
    requestAnimationFrame(() => messageRef.current?.focus());
  }

  function requireSocialConsent(provider: 'google' | 'apple') {
    const providerName = provider === 'google' ? 'Google' : 'Apple';
    setSocialConsentAttempted(true);
    setSocialConsentToast(`Please confirm the checkbox above before continuing with ${providerName}.`);
    if (socialConsentToastTimer.current !== null) window.clearTimeout(socialConsentToastTimer.current);
    socialConsentToastTimer.current = window.setTimeout(() => {
      setSocialConsentToast('');
      socialConsentToastTimer.current = null;
    }, 5000);
    requestAnimationFrame(() => {
      const checkbox = socialConsentRef.current;
      if (!checkbox) return;
      checkbox.focus({ preventScroll: true });
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      checkbox.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
  }

  useEffect(() => () => {
    if (socialConsentToastTimer.current !== null) window.clearTimeout(socialConsentToastTimer.current);
  }, []);

  function resetToPhoneEntry(note = '') {
    setSent(false);
    setOtp('');
    setPending(undefined);
    setFailed(false);
    setMessageTone('status');
    setMessage(note);
    requestAnimationFrame(() => (note ? messageRef.current : phoneRef.current)?.focus());
  }

  function dismissMessage() {
    setMessage('');
    setFailed(false);
    setMessageTone('status');
    requestAnimationFrame(() => (sent ? otpRef.current : phoneRef.current)?.focus());
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setDestination(safeReturnTo(params.get('returnTo')));
    if (params.get('reason') === 'auth') {
      announce('Sign in to continue to your private Pandit Talk space. Signing in does not create a booking or charge your wallet.');
    } else if (params.get('reason') === 'reauth') {
      announce('For your security, sign in again to continue with this sensitive action.');
    } else if (params.get('reason') === 'session') {
      announce('Your session ended or expired. Sign in again to continue — no new booking or charge is created by signing in.', false, 'alert');
    }
  }, []);
  useEffect(() => {
    if (!Object.values(retryAt).some(time => time > Date.now())) return;
    const timer = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (Object.values(retryAt).every(deadline => deadline <= time)) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  function finish(result: AuthResult) {
    if (result.needsPhone && result.pendingToken) {
      setPending(result.pendingToken);
      setSent(false);
      setOtp('');
      announce('Add your Indian mobile number to finish signing in.');
      requestAnimationFrame(() => phoneRef.current?.focus());
      return;
    }
    location.assign(result.hasProfile === false ? `/profile-setup?returnTo=${encodeURIComponent(destination)}` : destination);
  }

  async function submit(target: Action) {
    if (busy) return;
    // Consent is only required to verify / complete social — never to send or resend a code.
    if (target !== 'request-otp' && !consent) {
      announce('Accept the terms above to verify and continue.', true);
      requestAnimationFrame(() => {
        const checkbox = document.querySelector<HTMLInputElement>('.auth-panel input[type="checkbox"]');
        checkbox?.focus();
      });
      return;
    }
    const phoneNumber = normalizePhone(phone);
    setFailed(false);
    if (!phoneNumber) {
      setFailed(true);
      setMessage('Enter a valid 10-digit Indian mobile number, with or without +91.');
      // Keep the alert live for AT, but return focus to the field for recovery (consent still never blocks Send code).
      requestAnimationFrame(() => phoneRef.current?.focus());
      return;
    }
    if (Date.now() < (retryAt[target] || 0)) return;
    setBusy(true);
    setMessage('');
      setMessageTone('status');
    try {
      const response = await fetch(`/api/auth/${target}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, ...(target !== 'request-otp' ? { otp, acceptedLegalConsent: consent, ...(pending ? { pendingToken: pending } : {}) } : {}) }),
      });
      const result = await response.json();
      if (!response.ok) {
        const retry = Number(response.headers.get('retry-after'));
        if (retry > 0) { setNow(Date.now()); setRetryAt(previous => ({ ...previous, [target]: Date.now() + retry * 1000 })); }
        throw new Error(result.message || 'Sign-in could not be completed. Please try again.');
      }
      if (target === 'request-otp') {
        const wasResend = sent;
        setSent(true);
        setOtp('');
        setFailed(false);
        // Default cool-down when the API omits Retry-After — stops rapid resend spam.
        const retryHeader = Number(response.headers.get('retry-after'));
        if (!(retryHeader > 0)) {
          setNow(Date.now());
          setRetryAt(previous => ({ ...previous, 'request-otp': Date.now() + 30_000 }));
        }
        const apiNote = typeof result.message === 'string' ? result.message.trim() : '';
        const smsSkipped = /not sent|allowlisted|test number/i.test(apiNote);
        setMessageTone('status');
        setMessage(smsSkipped
          ? `${apiNote}. Enter the four-digit test code below when your environment provides one. Signing in does not create a booking or charge your wallet.`
          : wasResend
            ? `A new code was sent to ${phoneNumber}. Enter the four-digit code below. Codes usually expire in a few minutes.`
            : `Code sent to ${phoneNumber}. Enter the four-digit code below. Codes usually expire in a few minutes.`);
        requestAnimationFrame(() => {
          const field = otpRef.current;
          if (!field) return;
          field.focus();
          const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          field.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        });
      } else finish(result);
    } catch (error) {
      announce(error instanceof Error ? error.message : 'Sign-in could not be completed.', true);
    } finally { setBusy(false); }
  }

  return <main id="main-content" className="page auth-page" aria-busy={busy || undefined}>
    <div className="eyebrow">Your private Pandit Talk space</div>
    <h1>{pending ? 'One more step.' : sent ? 'Enter your code.' : 'Sign in to your private space.'}</h1>
    <p className="lede">{pending ? 'Link your Indian mobile number to keep your wallet, bookings and reports together.' : sent ? 'We sent a four-digit code to your phone. It usually arrives within a minute and expires after a few minutes — use Resend if it stops working.' : 'Use the same account as the app. Your profile, wallet and reports stay together.'}</p>
    {destination !== '/home' && (
      <aside className="notice auth-return-notice" role="status" aria-label="Sign-in destination">
        After you sign in, we will bring you back to <strong>{destinationLabel}</strong>. That return never creates a new booking or recharge. Consent never blocks Send code.
      </aside>
    )}
    <div className="panel auth-panel">
      <form className="stack" aria-busy={busy} onSubmit={event => { event.preventDefault(); void submit(action); }}>
        <label className="field">Indian mobile number (+91)
          <div className="phone-field">
            <span className="phone-prefix" aria-hidden="true">+91</span>
            <input ref={phoneRef} type="tel" name="phone" autoComplete="tel-national" inputMode="numeric" enterKeyHint="next" autoCapitalize="off" autoCorrect="off" spellCheck={false} value={phone} onChange={event => { setPhone(event.target.value); if (!sent) setMessage(''); }} onKeyDown={event => {
              if (event.key !== 'Escape' || sent || !phone) return;
              event.preventDefault();
              setPhone('');
              setMessage('');
              setFailed(false);
            }} placeholder="98765 43210" maxLength={14} required disabled={busy || sent} readOnly={sent} aria-describedby={failed && !sent && message ? 'phone-help auth-message' : 'phone-help'} aria-invalid={failed && !sent ? true : undefined} />
          </div>
        </label>
        <small id="phone-help">Enter your 10-digit number. Country code +91 is filled for you. We only use it to send a sign-in code and protect your account — Send code never charges coins. You can clear the number before sending a code.</small>
        {sent && <label className="field">Four-digit code<input ref={otpRef} type="text" name="otp" inputMode="numeric" autoComplete="one-time-code" enterKeyHint="done" pattern="[0-9]{4}" maxLength={4} required disabled={busy} value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))} onKeyDown={event => {
          if (event.key !== 'Escape' || busy) return;
          event.preventDefault();
          if (otp) {
            setOtp('');
            return;
          }
          // Empty code + Escape returns to phone entry (Send code still unconstrained by consent).
          resetToPhoneEntry();
        }} aria-describedby={failed && message ? 'otp-help auth-message' : 'otp-help'} aria-invalid={failed ? true : undefined} /><small id="otp-help">Type the code from your SMS. Codes usually expire in a few minutes — use Resend if yours stops working. Pandit Talk staff will never ask for this code.</small></label>}
        {(sent || !!pending) && <label className="check"><input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)} required={action !== 'request-otp'} aria-describedby={!consent ? 'auth-consent-help' : undefined} /><span>I am 18 or older and agree to the <span className="sr-only" id="auth-legal-otp-hint">Arrow keys move between Terms and Privacy. Escape blurs. Consent never blocks Send code.</span><LinkKeyboardGroup as="span" aria-label="Sign-in legal links" aria-describedby="auth-legal-otp-hint"><Link href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions<span className="sr-only"> (opens in a new tab)</span></Link> and <Link href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy<span className="sr-only"> (opens in a new tab)</span></Link></LinkKeyboardGroup>.</span></label>}
        {(sent || !!pending) && !consent && <p className="expert-meta" id="auth-consent-help">Accept the statement above to verify. Sending or resending a code does not require this yet.</p>}
        {message && <div id="auth-message" ref={messageRef} tabIndex={-1} className={`auth-message ${failed ? 'auth-message-error' : messageTone === 'alert' ? 'auth-message-alert' : 'auth-message-status'}`} role={failed || messageTone === 'alert' ? 'alert' : 'status'} aria-live={failed || messageTone === 'alert' ? 'assertive' : 'polite'} aria-atomic="true" onKeyDown={event => {
          if (event.key !== 'Escape' || !message) return;
          event.preventDefault();
          dismissMessage();
        }}>
          <span className="auth-message-icon" aria-hidden="true">{failed || messageTone === 'alert' ? '!' : 'i'}</span>
          <p className="auth-message-copy">{message}</p>
          <button type="button" className="auth-message-dismiss" onClick={dismissMessage}>Dismiss<span className="sr-only"> sign-in message</span></button>
        </div>}
        {failed && message && (
          <>
            <p className="sr-only" id="auth-error-recovery-hint">Arrow keys move between Resend, different number, account help, free tools, draft and support after a sign-in error. Escape blurs. Consent never blocks Send code. Skip remains site-content.</p>
            <LinkKeyboardGroup className="actions" style={{ marginTop: 0 }} aria-label="Sign-in error recovery" aria-describedby="auth-error-recovery-hint">
              {sent && (
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy || secondsLeft('request-otp') > 0}
                  aria-busy={busy || undefined}
                  onClick={() => void submit('request-otp')}
                >
                  {secondsLeft('request-otp') > 0 ? `Resend in ${secondsLeft('request-otp')}s` : 'Resend code'}
                </button>
              )}
              {sent && (
                <button type="button" className="button secondary" disabled={busy} onClick={() => resetToPhoneEntry()}>
                  Use a different number
                </button>
              )}
              <Link className="button secondary" href="/help/account-access">Account access help</Link>
              <Link className="button secondary" href="/tools">Try free tools</Link>
              <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
              <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
              <Link className="text-link" href="/contact">Contact support →</Link>
            </LinkKeyboardGroup>
          </>
        )}
        <p className="sr-only" id="auth-actions-hint">Arrow keys move between sign-in actions when more than one is shown. Escape blurs. Consent never blocks Send code.</p>
        <LinkKeyboardGroup className="actions" style={{ marginTop: 8 }} aria-label="Phone sign-in actions" aria-describedby="auth-actions-hint">
          <button type="submit" className="button" disabled={busy || (action !== 'request-otp' && !consent) || secondsLeft(action) > 0 || (sent && otp.length !== 4 && action !== 'request-otp')} aria-busy={busy || undefined} aria-describedby={[(sent || !!pending) && !consent && action !== 'request-otp' ? 'auth-consent-help' : '', message ? 'auth-message' : ''].filter(Boolean).join(' ') || undefined}>{busy ? 'Please wait…' : secondsLeft(action) > 0 ? `Try again in ${secondsLeft(action)}s` : sent ? 'Verify and continue' : 'Send code'}</button>
          {sent && <button type="button" className="button secondary" disabled={busy || secondsLeft('request-otp') > 0} aria-busy={busy || undefined} onClick={() => void submit('request-otp')}>{secondsLeft('request-otp') > 0 ? `Resend in ${secondsLeft('request-otp')}s` : 'Resend code'}</button>}
          {sent && !pending && <button type="button" className="text-link" disabled={busy} onClick={() => resetToPhoneEntry()}>Use a different number</button>}
          {pending && <button type="button" className="text-link" disabled={busy} onClick={() => resetToPhoneEntry('Start again with your mobile number or social sign-in.')}>Cancel phone linking and start over</button>}
        </LinkKeyboardGroup>
      </form>
      {!pending && !sent && <>
        <label className="check"><input ref={socialConsentRef} id="auth-social-consent" type="checkbox" checked={consent} disabled={busy} aria-invalid={socialConsentAttempted && !consent ? true : undefined} aria-describedby={socialConsentToast ? 'auth-social-consent-toast' : undefined} onChange={event => {
          const checked = event.target.checked;
          setConsent(checked);
          if (checked) {
            setSocialConsentAttempted(false);
            setSocialConsentToast('');
            if (socialConsentToastTimer.current !== null) {
              window.clearTimeout(socialConsentToastTimer.current);
              socialConsentToastTimer.current = null;
            }
          }
        }} /><span>I am 18 or older and agree to the <span className="sr-only" id="auth-legal-phone-hint">Arrow keys move between Terms and Privacy. Escape blurs. Consent never blocks Send code.</span><LinkKeyboardGroup as="span" aria-label="Sign-in legal links" aria-describedby="auth-legal-phone-hint"><Link href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions<span className="sr-only"> (opens in a new tab)</span></Link> and <Link href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy<span className="sr-only"> (opens in a new tab)</span></Link></LinkKeyboardGroup>.{socialConsentAttempted && !consent && <span className="auth-consent-required" aria-hidden="true">*</span>}</span></label>
        <SocialSignIn consent={consent} disabled={busy} onResult={finish} onConsentRequired={requireSocialConsent} />
      </>}
    </div>
    {socialConsentToast && <div id="auth-social-consent-toast" className="auth-consent-toast" role="alert" aria-atomic="true">{socialConsentToast}</div>}
    <aside className="notice auth-availability" role="status">
      <p>Signing in opens your existing private space; it does not create a booking or charge.</p>
      <p className="expert-meta">While you wait: <Link href="/tools">try free tools</Link> · <Link href="/guidance/start">prepare a draft</Link> · <Link href="/how-it-works#booking-availability-how">get booking updates</Link>.</p>
    </aside>
    <p className="sr-only" id="auth-help-hint">Arrow keys move between account help, tools, draft, support, booking updates and delete-account. Escape blurs. Consent never blocks Send code. Skip link remains site-content.</p>
    <LinkKeyboardGroup className="auth-help-links" aria-label="Sign-in help links" as="p" aria-describedby="auth-help-hint">
      Need help with access? <Link href="/help/account-access">Get account help</Link> · <Link href="/tools">Try free tools</Link> · <Link href="/guidance/start">Prepare a draft</Link> · <Link href="/contact">Contact support</Link> · <Link href="/how-it-works#booking-availability-how">Booking updates</Link> · <Link href="/delete-account">Delete account</Link>.
    </LinkKeyboardGroup>
  </main>;
}
