'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';

type Google = { accounts: { id: { initialize: (options: { client_id: string; callback: (result: { credential: string }) => void }) => void; renderButton: (element: HTMLElement, options: { theme: string; size: string; width?: number }) => void } } };
type Apple = { auth: { init: (options: { clientId: string; scope: string; redirectURI: string; state: string; usePopup: boolean }) => void; signIn: () => Promise<{ authorization: { id_token: string; state: string } }> } };
type Config = { googleClientId?: string; appleClientId?: string; appleRedirectUri?: string };
declare global { interface Window { google?: Google; AppleID?: Apple } }

function AppleMark() {
  return <svg className="social-brand-icon" data-brand-logo="apple" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M19.67 13.19c-.03-2.52 2.06-3.74 2.15-3.8-1.18-1.72-3.02-1.96-3.67-1.98-1.55-.16-3.05.92-3.84.92-.8 0-2.04-.9-3.35-.87-1.72.03-3.3 1-4.18 2.52-1.8 3.11-.46 7.68 1.27 10.2.84 1.24 1.84 2.63 3.15 2.58 1.27-.05 1.75-.82 3.29-.82 1.53 0 1.96.82 3.29.79 1.36-.02 2.23-1.23 3.04-2.48.96-1.44 1.35-2.84 1.37-2.91-.03-.01-2.61-1-2.64-4.15zM17.14 5.76c.7-.86 1.17-2.04 1.04-3.22-1.01.04-2.23.68-2.95 1.53-.64.74-1.2 1.94-1.06 3.08 1.12.09 2.27-.57 2.97-1.39z" /></svg>;
}

function GoogleMark() {
  return <svg className="social-brand-icon" data-brand-logo="google" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="#4285F4" d="M21.35 12.27c0-.71-.06-1.4-.18-2.05H12v3.88h5.22a4.46 4.46 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.19z" /><path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.51A9.75 9.75 0 0 0 12 21.75z" /><path fill="#FBBC05" d="M6.54 13.85A5.85 5.85 0 0 1 6.25 12c0-.64.11-1.26.29-1.85V7.64H3.29A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.04 4.36l3.25-2.51z" /><path fill="#EA4335" d="M12 6.12c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.17 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.71 5.39l3.25 2.51C7.31 7.84 9.46 6.12 12 6.12z" /></svg>;
}

async function loadScript(src: string) {
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); reject(new Error('Sign-in could not load. Try phone sign-in.')); };
    document.head.appendChild(script);
  });
}

export function SocialSignIn({ consent, disabled = false, onResult, onConsentRequired }: {
  consent: boolean;
  disabled?: boolean;
  onResult: (result: { needsPhone?: boolean; pendingToken?: string; hasProfile?: boolean }) => void;
  onConsentRequired: (provider: 'google' | 'apple') => void;
}) {
  const [config, setConfig] = useState<Config>();
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const googleBox = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
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

  function dismissMessage() {
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
  }

  function renderMessage() {
    if (!message) return null;
    return <div
      ref={messageRef}
      tabIndex={-1}
      className={`auth-message ${failed ? 'auth-message-error' : 'auth-message-status'}`}
      role={failed ? 'alert' : 'status'}
      aria-live={failed ? 'assertive' : 'polite'}
      aria-atomic="true"
      onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        dismissMessage();
      }}
    >
      <span className="auth-message-icon" aria-hidden="true">{failed ? '!' : 'i'}</span>
      <p className="auth-message-copy">{message}</p>
      <button type="button" className="auth-message-dismiss" onClick={dismissMessage}>Dismiss<span className="sr-only"> sign-in message</span></button>
    </div>;
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
        const slotWidth = Math.round(Math.min(400, googleBox.current.parentElement?.getBoundingClientRect().width || 400));
        window.google!.accounts.id.renderButton(googleBox.current, { theme: 'outline', size: 'large', width: slotWidth });
      } catch {
        if (!cancelled) announce('Google sign-in could not load. You can still use phone sign-in.', true);
      }
    })();
    return () => { cancelled = true; };
  }, [consent, disabled, config?.googleClientId]);

  async function start(provider: 'google' | 'apple') {
    if (busy || disabled) return;
    if (!consent) {
      onConsentRequired(provider);
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
  const providerHint = config === undefined
    ? 'Check the statement above to enable Google or Apple sign-in. Phone sign-in stays available without it.'
    : hasGoogle || hasApple
      ? 'Check the statement above to enable Google or Apple sign-in. Phone sign-in stays available without it.'
      : 'Browser sign-in is not configured yet. Phone sign-in stays available.';
  return <div className="stack" aria-busy={busy || undefined}>
    <p className="eyebrow">Or continue with</p>
    <p className="expert-meta" id="social-provider-help">{providerHint}</p>
    <p className="sr-only" id="social-keys-hint">Arrow keys move between Google and Apple sign-in when shown. Escape blurs.</p>
    <LinkKeyboardGroup className="actions" aria-label="Social sign-in options" aria-describedby="social-keys-hint">
      <button type="button" data-provider="apple" className="button secondary social-provider-button" disabled={busy || disabled || !consent || !hasApple} aria-disabled={!consent || disabled || !hasApple || busy || undefined} aria-busy={busy || undefined} title={!hasApple ? 'Apple sign-in is not configured on this website yet.' : undefined} onClick={() => void start('apple')}><AppleMark />{busy ? 'Signing in with Apple…' : 'Sign in with Apple'}</button>
      <div className="social-google-slot" data-provider="google">
        {(!consent || disabled || !hasGoogle) && <button type="button" className="button secondary social-google-placeholder social-provider-button" disabled={busy || disabled || !consent || !hasGoogle} aria-disabled={!consent || disabled || !hasGoogle || busy || undefined} title={!hasGoogle ? 'Google sign-in is not configured on this website yet.' : undefined} onClick={() => {
          if (!consent) onConsentRequired('google');
        }}><GoogleMark />Sign in with Google</button>}
        <div ref={googleBox} className="social-google-widget" hidden={!consent || disabled || !hasGoogle} role="group" aria-label="Google sign-in" />
      </div>
    </LinkKeyboardGroup>
    {renderMessage()}
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
