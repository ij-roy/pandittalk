'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';

type Google = { accounts: { id: { initialize: (options: { client_id: string; callback: (result: { credential: string }) => void }) => void; renderButton: (element: HTMLElement, options: { theme: string; size: string }) => void } } };
type Apple = { auth: { init: (options: { clientId: string; scope: string; redirectURI: string; state: string; usePopup: boolean }) => void; signIn: () => Promise<{ authorization: { id_token: string; state: string } }> } };
type Config = { googleClientId?: string; appleClientId?: string; appleRedirectUri?: string };
declare global { interface Window { google?: Google; AppleID?: Apple } }

async function loadScript(src: string) {
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); reject(new Error('Sign-in could not load. Try phone sign-in.')); };
    document.head.appendChild(script);
  });
}

export function SocialSignIn({ consent, disabled = false, onResult }: {
  consent: boolean;
  disabled?: boolean;
  onResult: (result: { needsPhone?: boolean; pendingToken?: string; hasProfile?: boolean }) => void;
}) {
  const [config, setConfig] = useState<Config>();
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const googleBox = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const consentRef = useRef(consent);
  useEffect(() => { consentRef.current = consent; }, [consent]);

  function announce(note: string, isError = false) {
    setFailed(isError);
    setMessage(note);
    requestAnimationFrame(() => {
      const node = messageRef.current;
      if (!node) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      node.focus({ preventScroll: true });
      node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    });
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/config', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(setConfig)
      .catch(() => { if (!controller.signal.aborted) announce('Social sign-in is unavailable. You can still sign in by phone.', true); });
    return () => controller.abort();
  }, []);

  async function exchange(provider: string, token: string) {
    if (!consentRef.current) throw new Error('Please accept the age, terms and privacy statement first.');
    const response = await fetch(`/api/auth/${provider}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [provider === 'apple' ? 'identityToken' : 'idToken']: token, acceptedLegalConsent: consentRef.current }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Sign-in could not be completed. Please try again.');
    onResult(result);
  }

  useEffect(() => {
    if (!consent || !message) return;
    if (failed && message.toLowerCase().includes('accept')) {
      setFailed(false);
      setMessage('');
    }
  }, [consent, failed, message]);

  useEffect(() => {
    if (!consent || disabled || !config?.googleClientId || !googleBox.current) {
      googleBox.current?.replaceChildren();
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        if (!window.google) await loadScript('https://accounts.google.com/gsi/client');
        if (cancelled || !googleBox.current || !config.googleClientId) return;
        window.google!.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: result => {
            setBusy(true);
            setFailed(false);
            setMessage('Completing Google sign-in…');
            void exchange('google', result.credential).catch(error => announce(error.message, true)).finally(() => setBusy(false));
          },
        });
        googleBox.current.replaceChildren();
        window.google!.accounts.id.renderButton(googleBox.current, { theme: 'outline', size: 'large' });
      } catch {
        if (!cancelled) announce('Google sign-in could not load. You can still use phone sign-in.', true);
      }
    })();
    return () => { cancelled = true; };
  }, [consent, disabled, config?.googleClientId]);

  async function start(provider: 'google' | 'apple') {
    if (busy || disabled) return;
    if (!consent) {
      announce('Please accept the age, terms and privacy statement first.', true);
      requestAnimationFrame(() => {
        const checkbox = document.querySelector<HTMLInputElement>('.auth-panel input[type="checkbox"]');
        checkbox?.focus();
      });
      return;
    }
    if (provider === 'google') {
      announce('Use the Google button below to choose your account.');
      return;
    }
    setBusy(true);
    setFailed(false);
    setMessage('');
    try {
      if (!config?.appleClientId || !config.appleRedirectUri) throw new Error('Apple sign-in is unavailable. Please use phone sign-in.');
      if (!window.AppleID) await loadScript('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js');
      const state = crypto.randomUUID();
      window.AppleID!.auth.init({ clientId: config.appleClientId, scope: 'name email', redirectURI: config.appleRedirectUri, state, usePopup: true });
      const result = await window.AppleID!.auth.signIn();
      if (result.authorization.state !== state) throw new Error('The sign-in response could not be verified.');
      await exchange('apple', result.authorization.id_token);
    } catch (error) {
      announce(error instanceof Error ? error.message : 'Sign-in was interrupted. You can try again.', true);
    } finally { setBusy(false); }
  }

  const hasGoogle = !!config?.googleClientId;
  const hasApple = !!config?.appleClientId && !!config?.appleRedirectUri;
  if (!hasGoogle && !hasApple) return message ? <p role={failed ? 'alert' : 'status'} tabIndex={-1} ref={messageRef}>{message}</p> : null;
  return <div className="stack" aria-busy={busy || undefined}>
    <p className="eyebrow">Or continue with</p>
    <p className="expert-meta" id="social-consent-help" aria-live="polite" aria-atomic="true">{consent ? 'Consent accepted. Google and Apple are enabled. Phone Send code remains available without this checkbox.' : 'Accept the age, terms and privacy statement above to enable Google or Apple. Phone Send code works without this checkbox.'}</p>
    <p className="sr-only" id="social-keys-hint">Arrow keys move between Google and Apple sign-in when shown. Escape blurs. Consent never blocks Send code.</p>
    <LinkKeyboardGroup className="actions" aria-label="Social sign-in options" aria-describedby={[!consent ? 'social-consent-help' : '', 'social-keys-hint'].filter(Boolean).join(' ') || undefined}>
      {hasApple && <button type="button" className="button secondary" disabled={busy || disabled || !consent} aria-busy={busy || undefined} aria-describedby={!consent ? 'social-consent-help' : undefined} onClick={() => void start('apple')}>{busy ? 'Continuing with Apple…' : 'Continue with Apple'}</button>}
      {hasGoogle && <div className="social-google-slot">
        {(!consent || disabled) && <button type="button" className="button secondary social-google-placeholder" disabled aria-describedby={!consent ? 'social-consent-help' : undefined}>Sign in with Google</button>}
        <div ref={googleBox} className="social-google-widget" hidden={!consent || disabled} role="group" aria-label="Google sign-in" />
      </div>}
    </LinkKeyboardGroup>
    {message ? (
      <p
        ref={messageRef}
        tabIndex={-1}
        className={failed ? 'error' : undefined}
        role={failed ? 'alert' : 'status'}
        aria-live={failed ? 'assertive' : 'polite'}
        onKeyDown={event => {
          if (event.key !== 'Escape' || !message) return;
          event.preventDefault();
          setMessage('');
          setFailed(false);
          requestAnimationFrame(() => {
            if (!consent) {
              document.querySelector<HTMLInputElement>('.auth-panel input[type="checkbox"]')?.focus();
              return;
            }
            const apple = document.querySelector<HTMLButtonElement>('.auth-panel .actions button.secondary');
            if (apple && !apple.disabled) apple.focus();
          });
        }}
      >
        {message} Press Escape to dismiss. Consent never blocks phone Send code.
      </p>
    ) : null}
    {failed && message ? (
      <>
        <p className="sr-only" id="social-fail-hint">Arrow keys move between phone Send code focus, free tools and draft. Escape blurs. Consent never blocks Send code. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Social sign-in recovery" aria-describedby="social-fail-hint">
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              requestAnimationFrame(() => {
                const send = document.querySelector<HTMLButtonElement>('.auth-panel form .actions button.button:not(.secondary)');
                send?.focus();
              });
            }}
          >
            Focus phone Send code
          </button>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          <Link className="text-link" href="/help/account-access">Account access help →</Link>
          <Link className="text-link" href="/contact">Contact support →</Link>
        </LinkKeyboardGroup>
      </>
    ) : null}
  </div>;
}
