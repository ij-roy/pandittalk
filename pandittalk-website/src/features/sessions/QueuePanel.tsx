'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { api, useApi } from '@/lib/api/client';

/** Instant chat-now queue — reserved for existing bookings only; new instant chats stay closed. */
export default function QueuePanel({ panditId }: { panditId: string }) {
  const q = useApi<{ position: number | null; queueLength: number }>(
    `/bookings/chat-now/queue?panditId=${encodeURIComponent(panditId)}`,
  );
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function leave() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      await api('/bookings/chat-now/queue', { method: 'DELETE', body: JSON.stringify({ panditId }) });
      q.reload();
      setStatus('Your request to leave the queue was submitted. Leaving does not create a charge.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel stack" aria-busy={q.loading || busy || undefined}>
      <h2>Chat queue</h2>
      <aside className="notice" role="status">
        <p>
          <strong>New instant chats are currently unavailable.</strong> No coins will be charged. You can still open an
          existing booking.
        </p>
      </aside>
      {q.loading && <p role="status">Checking your queue status…</p>}
      {(q.error || error) && (
        <div
          className="error"
          role="alert"
          tabIndex={-1}
          onKeyDown={event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            (event.currentTarget as HTMLElement).blur();
          }}
        >
          <p>{q.error?.message || error} Press Escape to leave this alert.</p>
          <p className="sr-only" id="queue-error-hint">
            Arrow keys move between queue recovery links. Escape blurs. Skip remains site-content.
          </p>
          <LinkKeyboardGroup className="actions" aria-label="Chat queue error recovery" aria-describedby="queue-error-hint">
            <button
              type="button"
              className="button secondary"
              disabled={q.loading || busy}
              aria-busy={q.loading || undefined}
              onClick={q.reload}
            >
              {q.loading ? 'Trying again…' : 'Try again'}
            </button>
            <Link className="button secondary" href="/bookings">
              Open bookings
            </Link>
            <Link className="button secondary" href="/tools">
              Try free tools
            </Link>
            <Link className="text-link" href="/guidance/start">
              Prepare a draft →
            </Link>
          </LinkKeyboardGroup>
        </div>
      )}
      {status && (
        <p
          className="notice"
          role="status"
          tabIndex={-1}
          onKeyDown={event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            setStatus('');
          }}
        >
          {status} Press Escape to dismiss.
        </p>
      )}
      {q.data && (
        <p>
          {q.data.position === null
            ? 'You are not currently waiting for this Pandit.'
            : `Your place in the queue: ${q.data.position} of ${q.data.queueLength}.`}
        </p>
      )}
      <p className="sr-only" id="queue-actions-hint">
        Arrow keys move between Leave, Refresh, bookings, free tools and draft. Escape blurs. Skip remains site-content.
      </p>
      <LinkKeyboardGroup className="actions" aria-label="Chat queue actions" aria-describedby="queue-actions-hint">
        {q.data?.position != null && (
          <button
            type="button"
            className="button secondary"
            disabled={busy || q.loading}
            aria-busy={busy || undefined}
            onClick={() => void leave()}
          >
            {busy ? 'Leaving…' : 'Leave queue'}
          </button>
        )}
        <button
          type="button"
          className="button secondary"
          disabled={q.loading || busy}
          aria-busy={q.loading || undefined}
          onClick={q.reload}
        >
          {q.loading ? 'Refreshing…' : 'Refresh queue'}
        </button>
        <Link className="button secondary" href="/bookings">
          Find your existing booking
        </Link>
        <Link className="button secondary" href="/tools">
          Try free tools
        </Link>
        <Link className="text-link" href="/guidance/start">
          Prepare a draft →
        </Link>
      </LinkKeyboardGroup>
    </section>
  );
}
