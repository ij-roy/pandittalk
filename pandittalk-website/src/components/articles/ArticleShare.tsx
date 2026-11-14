'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { recordArticleEvent } from '@/lib/articles/events';

export function ArticleShare({
  slug,
  title,
  url,
}: {
  slug: string;
  title: string;
  url: string;
}) {
  const statusId = useId();
  const urlFieldId = useId();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  async function copyLink() {
    if (busy) return;
    setBusy(true);
    setStatus('');
    try {
      await navigator.clipboard.writeText(url);
      recordArticleEvent(slug, 'cta_click');
      setShowUrl(false);
      setStatus('Link copied. Paste it wherever you like — nothing was posted for you, and no Pandit was notified.');
      requestAnimationFrame(() => document.getElementById(statusId)?.focus());
    } catch {
      setShowUrl(true);
      setStatus('Select and copy the link below — clipboard access was blocked.');
      requestAnimationFrame(() => {
        const input = document.getElementById(urlFieldId) as HTMLInputElement | null;
        input?.focus();
        input?.select();
      });
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (busy) return;
    setBusy(true);
    setStatus('');
    setShowUrl(false);
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title, url, text: title });
        recordArticleEvent(slug, 'cta_click');
        setStatus('Shared. Thank you for passing this along.');
        requestAnimationFrame(() => document.getElementById(statusId)?.focus());
        return;
      }
      await navigator.clipboard.writeText(url);
      recordArticleEvent(slug, 'cta_click');
      setStatus('Link copied. Paste it wherever you like — nothing was posted for you, and no Pandit was notified.');
      requestAnimationFrame(() => document.getElementById(statusId)?.focus());
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStatus('Share cancelled.');
        requestAnimationFrame(() => document.getElementById(statusId)?.focus());
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        setStatus('Link copied. Paste it wherever you like — nothing was posted for you, and no Pandit was notified.');
        requestAnimationFrame(() => document.getElementById(statusId)?.focus());
      } catch {
        setShowUrl(true);
        setStatus('Select and copy the link below — clipboard access was blocked.');
        requestAnimationFrame(() => {
          const input = document.getElementById(urlFieldId) as HTMLInputElement | null;
          input?.focus();
          input?.select();
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="journal-share no-print stack" aria-busy={busy || undefined}>
      <p className="sr-only" id={`${statusId}-share-keys`}>Arrow keys move between Share, Copy and Hide link when shown. Escape blurs the focused control. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions journal-share-actions" aria-label="Share this article" aria-describedby={`${statusId} ${statusId}-share-keys`}>
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          aria-busy={busy || undefined}
          aria-describedby={statusId}
          onClick={() => void share()}
        >
          {busy ? 'Working…' : 'Share this article'}
        </button>
        <button
          type="button"
          id={`${statusId}-copy`}
          className="button secondary"
          disabled={busy}
          aria-busy={busy || undefined}
          aria-describedby={statusId}
          onClick={() => void copyLink()}
        >
          Copy link
        </button>
        {showUrl && (
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setShowUrl(false);
              setStatus('');
              requestAnimationFrame(() => document.getElementById(`${statusId}-copy`)?.focus());
            }}
          >
            Hide link field
          </button>
        )}
      </LinkKeyboardGroup>
      <p
        id={statusId}
        className="notice"
        role="status"
        aria-live="polite"
        tabIndex={status ? -1 : undefined}
        onKeyDown={event => {
          if (event.key !== 'Escape' || !status) return;
          event.preventDefault();
          setStatus('');
          requestAnimationFrame(() => {
            if (showUrl) document.getElementById(urlFieldId)?.focus();
            else document.getElementById(`${statusId}-copy`)?.focus();
          });
        }}
      >
        {status || 'Share opens your device sheet when available. Copy link never posts on your behalf, never notifies a Pandit, and never creates a booking or charge. Arrow keys move between Share, Copy and Hide link when shown; Escape dismisses a status message.'}
      </p>
      {status && !showUrl ? (
        <>
          <p className="sr-only" id="article-share-followup-hint">Arrow keys move between more journal, free tools, draft and booking updates after sharing. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" style={{ marginTop: 0 }} aria-label="After sharing this article" aria-describedby="article-share-followup-hint">
            <Link className="text-link" href="/articles">More journal articles →</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
            <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
          </LinkKeyboardGroup>
        </>
      ) : null}
      {showUrl && (
        <>
          <label className="field" htmlFor={urlFieldId}>
            Article link
            <input
              id={urlFieldId}
              type="text"
              readOnly
              value={url}
              enterKeyHint="done"
              onFocus={event => event.currentTarget.select()}
              onKeyDown={event => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  setShowUrl(false);
                  setStatus('Link field closed. Use Share or Copy link again if you still need it.');
                  requestAnimationFrame(() => document.getElementById(statusId)?.focus());
                }
              }}
            />
          </label>
          <p className="sr-only" id="article-share-clipboard-hint">Arrow keys move between journal, free tools, draft and support when clipboard copy is blocked. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" style={{ marginTop: 0 }} aria-label="Clipboard blocked recovery" aria-describedby="article-share-clipboard-hint">
            <Link className="text-link" href="/articles">More journal articles →</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
            <Link className="text-link" href="/contact">Contact support →</Link>
          </LinkKeyboardGroup>
        </>
      )}
    </div>
  );
}
