'use client';

import { useId, useRef, useState } from 'react';
import Link from 'next/link';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { supportEmail } from '@/content/siteIdentity';

export function PaymentReferenceActions({ reference }: { reference: string }) {
  const statusId = useId();
  const fieldId = useId();
  const fieldRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      requestAnimationFrame(() => statusRef.current?.focus());
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
      setFailed(true);
      requestAnimationFrame(() => {
        const input = fieldRef.current;
        if (!input) return;
        input.focus();
        input.select();
      });
    } finally {
      setBusy(false);
    }
  }

  const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(`Payment reference ${reference}`)}&body=${encodeURIComponent(`Payment reference: ${reference}\n\nWhat I expected:\nWhat I see in my wallet:\n\nNote: This is about an existing payment attempt.\n`)}`;

  return (
    <div className="stack">
      <label className="field" htmlFor={fieldId}>
        Payment reference
        <input
          ref={fieldRef}
          id={fieldId}
          type="text"
          readOnly
          value={reference}
          enterKeyHint="done"
          onFocus={event => event.currentTarget.select()}
          onKeyDown={event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            setFailed(false);
            setCopied(false);
            requestAnimationFrame(() => document.getElementById(`${statusId}-copy`)?.focus());
          }}
          aria-describedby={statusId}
        />
      </label>
      <LinkKeyboardGroup
        className="actions"
        aria-label="Payment reference actions"
      >
        <button type="button" id={`${statusId}-copy`} className="button secondary" disabled={busy} aria-busy={busy || undefined} aria-describedby={statusId} onClick={() => void copy()}>
          {busy ? 'Copying…' : copied ? 'Reference copied' : 'Copy reference'}
        </button>
        <a className="button secondary" href={mailto}>
          Email support with this reference
          <span className="sr-only"> (opens your email app)</span>
        </a>
        <Link className="text-link" href="/help/coins-and-payment-pending">
          Payment help →
        </Link>
        <Link className="text-link" href="/wallet">
          Check wallet balance →
        </Link>
        <Link className="text-link" href="/tools">
          Try free tools →
        </Link>
        <Link className="text-link" href="/guidance/start">
          Prepare a draft →
        </Link>
      </LinkKeyboardGroup>
      <p
        id={statusId}
        ref={statusRef}
        tabIndex={(copied || failed) ? -1 : undefined}
        className={failed ? 'error' : 'expert-meta'}
        role={failed ? 'alert' : 'status'}
        aria-live={failed ? 'assertive' : 'polite'}
        onKeyDown={event => {
          if (event.key !== 'Escape' || (!copied && !failed)) return;
          event.preventDefault();
          setCopied(false);
          setFailed(false);
          requestAnimationFrame(() => document.getElementById(`${statusId}-copy`)?.focus());
        }}
      >
        {busy
          ? 'Copying reference…'
          : copied
            ? 'Reference copied to your clipboard. Press Escape to dismiss and return to Copy. Copying does not credit coins — check your wallet next.'
            : failed
              ? 'Clipboard access was blocked. Select the reference above and copy it manually, email support with it, or open payment help. Press Escape to dismiss this message.'
              : 'This reference identifies a payment attempt. Copying it does not confirm coins were credited — check your wallet balance next.'}
      </p>
    </div>
  );
}
