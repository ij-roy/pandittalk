'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Socket } from 'socket.io-client';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { createSessionSocket } from './socket';
import { Message, parseMessage, reconcileMessages } from './events';
import { formatIstDateTime } from '@/lib/time/ist';
import styles from '../account/customer.module.css';
import { formatSessionRemaining } from './sessionTimer';

const chatDraftKey = (bookingId: string) => `pandittalk-chat-draft:${bookingId}`;

export default function ChatRoom({ id }: { id: string }) {
  const socket = useRef<Socket | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const draftRestored = useRef(false);
  const sawChatEmpty = useRef(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [state, setState] = useState('Connecting');
  const [connected, setConnected] = useState(false);
  const [ended, setEnded] = useState(false);
  const [sessionEndAt, setSessionEndAt] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmGrace, setConfirmGrace] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [graceRequested, setGraceRequested] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const [showJump, setShowJump] = useState(false);
  const [reconnectKey, setReconnectKey] = useState(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSentAt = useRef<number>(0);
  const dialogOpen = confirmEnd || confirmGrace || confirmLeave;

  useEffect(() => {
    if (messages.length > 0 || dialogOpen) {
      sawChatEmpty.current = false;
      return;
    }
    if (sawChatEmpty.current) return;
    sawChatEmpty.current = true;
    requestAnimationFrame(() => document.getElementById('chat-empty-log')?.focus());
  }, [messages.length, dialogOpen]);

  useEffect(() => {
    if (!sessionEndAt || ended) return;
    const update = () => setSecondsRemaining(Math.max(0, Math.ceil((sessionEndAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [sessionEndAt, ended]);

  useEffect(() => {
    let disposed = false;
    setConnected(false);
    setState('Connecting');
    void createSessionSocket().then(({ socket: s, token }) => {
      if (disposed) { s.disconnect(); return; }
      socket.current = s;
      s.on('connect', () => {
        setConnected(true);
        setState('Connected. Loading your conversation…');
        s.emit('joinSession', { bookingId: id, token });
      });
      s.on('disconnect', () => {
        setConnected(false);
        setState('Connection interrupted. Reconnecting automatically… Your draft stays in this browser until you send it.');
      });
      s.on('connect_error', () => {
        setConnected(false);
        setError('We could not reconnect yet. Keep this page open — your draft is retained in this browser. If this continues, refresh from your booking.');
      });
      s.on('error', (p: { message?: string }) => {
        const raw = p.message || '';
        setError(/token|auth|unauthorized|forbidden/i.test(raw)
          ? 'Your session expired. Sign in again, then reopen this consultation.'
          : 'Session request failed. Please try again from your booking.');
        setPending(false);
      });
      s.on('sessionJoined', (p: { bookingId: string; messages: unknown[] }) => {
        if (p.bookingId !== id) return;
        setMessages(old => reconcileMessages(old, (p.messages || []).map(parseMessage).filter((m): m is Message => m !== null)));
        setState('Connected');
      });
      s.on('newMessage', (p: unknown) => {
        const m = parseMessage(p);
        if (m) setMessages(old => reconcileMessages(old, [m]));
      });
      s.on('typingIndicator', () => {
        setTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), 2500);
      });
      s.on('waitingForPandit', () => setState('Waiting for your Pandit'));
      s.on('waitingForStart', () => setState('Waiting for the scheduled start'));
      s.on('sessionStarted', (p: { endTime?: number; durationMinutes?: number }) => {
        if (Number.isFinite(p.endTime)) setSessionEndAt(Number(p.endTime));
        setState('Conversation started');
      });
      s.on('timeRemaining', (p: { secondsLeft?: number }) => {
        if (Number.isFinite(p.secondsLeft)) setSecondsRemaining(Math.max(0, Number(p.secondsLeft)));
      });
      for (const e of ['sessionEnded', 'sessionTimeUp', 'sessionGraceEnded']) {
        s.on(e, () => {
          setEnded(true);
          setSecondsRemaining(0);
          setState('Your consultation has ended. Return to your booking for the final details.');
        });
      }
      s.on('panditDisconnected', () => setState('Your Pandit disconnected briefly. Stay here — we will reconnect when they return. Your draft is still available.'));
      for (const e of ['sessionRefunded', 'sessionEndedWithRefund']) {
        s.on(e, (p: { message?: string; coinsRefunded?: number }) => {
          setEnded(true);
          setSecondsRemaining(0);
          setState(`${p.message || 'Session refund update'}${Number.isFinite(p.coinsRefunded) ? ` (${p.coinsRefunded} coins)` : ''}. Check your wallet for the refund details.`);
        });
      }
      s.connect();
    }).catch(e => setError(e instanceof Error ? e.message : 'Secure session connection is unavailable.'));
    return () => {
      disposed = true;
      if (typingTimer.current) clearTimeout(typingTimer.current);
      socket.current?.emit('leaveSession', { bookingId: id });
      socket.current?.removeAllListeners();
      socket.current?.disconnect();
      socket.current = null;
      setConnected(false);
    };
  }, [id, reconnectKey]);

  function retryConnection() {
    setError('');
    setState('Connecting');
    setReconnectKey(key => key + 1);
  }

  useEffect(() => {
    if (!error) return;
    requestAnimationFrame(() => errorRef.current?.focus());
  }, [error]);

  useEffect(() => {
    if (draftRestored.current) return;
    draftRestored.current = true;
    try {
      const saved = sessionStorage.getItem(chatDraftKey(id));
      if (saved) setDraft(saved.slice(0, 2000));
    } catch {
      /* private mode */
    }
  }, [id]);

  useEffect(() => {
    if (!draftRestored.current) return;
    try {
      if (draft.trim()) sessionStorage.setItem(chatDraftKey(id), draft.slice(0, 2000));
      else sessionStorage.removeItem(chatDraftKey(id));
    } catch {
      /* private mode */
    }
  }, [draft, id]);

  useEffect(() => {
    if (!pending) return;
    const own = [...messages].reverse().find(m => m.senderRole === 'user');
    if (own && own.timestamp >= pendingSentAt.current - 2000) {
      setDraft('');
      setPending(false);
      try { sessionStorage.removeItem(chatDraftKey(id)); } catch { /* ignore */ }
    }
  }, [messages, pending, id]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => {
      setPending(false);
      setError('Delivery was not confirmed within 20 seconds. Your draft is still below — check the conversation above before sending again to avoid duplicates.');
    }, 20000);
    return () => window.clearTimeout(timer);
  }, [pending]);

  useEffect(() => {
    const node = logRef.current;
    if (!node) return;
    const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 120;
    setShowJump(!nearBottom && messages.length > 0);
    if (nearBottom) node.scrollTop = node.scrollHeight;
  }, [messages, typing]);

  function jumpToLatest() {
    const node = logRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
    setShowJump(false);
    const articles = node.querySelectorAll<HTMLElement>('article[data-sender]');
    const last = articles[articles.length - 1];
    if (last) {
      last.tabIndex = -1;
      last.focus({ preventScroll: true });
    }
  }

  useEffect(() => {
    const node = logRef.current;
    if (!node) return;
    const onScroll = () => {
      const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 120;
      setShowJump(!nearBottom && messages.length > 0);
    };
    node.addEventListener('scroll', onScroll, { passive: true });
    return () => node.removeEventListener('scroll', onScroll);
  }, [messages.length]);

  useEffect(() => {
    if (!confirmEnd && !confirmGrace && !confirmLeave) return;
    const node = confirmRef.current;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(node?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []).filter(el => !el.hasAttribute('disabled'));
    const items = focusables();
    (items.find(el => !el.className.includes('danger')) || items[0])?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setConfirmEnd(false); setConfirmGrace(false); setConfirmLeave(false); return; }
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
  }, [confirmEnd, confirmGrace, confirmLeave]);

  return (
    <section className="stack">
      <p id="chat-session-state" role="status" className="notice" tabIndex={-1} inert={dialogOpen ? true : undefined}>{state}</p>
      {secondsRemaining !== null && !ended && <div className={styles.sessionTimer} role="status" aria-live="polite" data-warning={secondsRemaining <= 300 ? 'true' : undefined}><strong>{formatSessionRemaining(secondsRemaining)}</strong><span>remaining · server timer</span></div>}
      {error && (
        <div className="error" role="alert" tabIndex={-1} ref={errorRef} inert={dialogOpen ? true : undefined} onKeyDown={e => {
          if (e.key !== 'Escape') return;
          e.preventDefault();
          setError('');
          requestAnimationFrame(() => {
            const composer = document.querySelector<HTMLTextAreaElement>('#chat-composer');
            const recovery = document.querySelector<HTMLElement>('a[href*="chat-reconnect"], a[href*="/bookings/"]');
            (composer || recovery)?.focus();
          });
        }}>
          <p>{error} Press Escape to dismiss and return to the composer when available.</p>
          <p className="sr-only" id="chat-error-hint">Arrow keys move between recovery links. Escape dismisses this alert. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Chat error recovery" aria-describedby="chat-error-hint">
            {/token|auth|unauthorized|forbidden|sign in/i.test(error) ? (
              <Link className="button secondary" href={`/login?returnTo=${encodeURIComponent(`/sessions/${id}/chat`)}&reason=session`}>Sign in again</Link>
            ) : (
              <button type="button" className="button secondary" onClick={retryConnection}>Retry connection</button>
            )}
            {!/token|auth|unauthorized|forbidden|sign in/i.test(error) && (
              <Link className="button secondary" href="/help/chat-reconnect">Chat reconnect help</Link>
            )}
            <Link className="button secondary" href={`/bookings/${encodeURIComponent(id)}`}>Open booking</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </div>
      )}
      <p className={styles.helper} inert={dialogOpen ? true : undefined}>
        If your connection is interrupted, your draft stays here. Check the conversation before sending again to avoid duplicate messages.
        <span className="sr-only" id="chat-reconnect-help-hint">Arrow keys move between chat reconnect, booking, tools and draft. Escape blurs. Skip remains site-content.</span>
        {' '}
        <LinkKeyboardGroup as="span" aria-label="Chat reconnect help" aria-describedby="chat-reconnect-help-hint">
          <Link href="/help/chat-reconnect">Chat reconnect help</Link>
          {' · '}
          <Link href={`/bookings/${encodeURIComponent(id)}`}>Open booking</Link>
          {' · '}
          <Link href="/tools">Try free tools</Link>
          {' · '}
          <Link href="/guidance/start">Prepare a draft</Link>
        </LinkKeyboardGroup>
        .
      </p>
      <div
        ref={logRef}
        className={`panel stack ${styles.messageLog}`}
        role="log"
        aria-relevant="additions"
        aria-label="Conversation"
        inert={dialogOpen ? true : undefined}
      >
        {messages.map((m, index) => (
          <article className={styles.message} data-sender={m.senderRole} key={`${m.timestamp}-${m.senderId}-${index}`}>
            <strong>{m.senderRole === 'pandit' ? 'Pandit' : 'You'}</strong>
            <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.message}</p>
            <small>{formatIstDateTime(m.timestamp)}</small>
          </article>
        ))}
        {messages.length === 0 && (
          <div
            className="stack"
            role="status"
            id="chat-empty-log"
            aria-live="polite"
            tabIndex={-1}
            onKeyDown={event => {
              if (event.key !== 'Escape') return;
              event.preventDefault();
              (event.currentTarget as HTMLElement).blur();
            }}
          >
            <p className={styles.helper}>
              {!connected
                ? 'Connecting… Messages will appear here when the room is ready. Your draft below is kept until you send it. Press Escape to leave this notice.'
                : ended
                  ? 'No messages were recorded in this room view. Return to your booking for final details. Press Escape to leave this notice.'
                  : 'No messages yet. Say hello when your Pandit joins — sending does not create a new booking. Press Escape to leave this notice.'}
            </p>
            <p className="sr-only" id="chat-empty-hint">Arrow keys move between Retry when shown, Open booking, reconnect help, free tools and draft. Escape blurs. Skip remains site-content.</p>
            <LinkKeyboardGroup className="actions" style={{ margin: 0 }} aria-label="While chat has no messages" aria-describedby="chat-empty-hint">
              {!connected && (
                <button type="button" className="button secondary" onClick={retryConnection}>Retry connection</button>
              )}
              <Link className="text-link" href={`/bookings/${encodeURIComponent(id)}`}>Open booking →</Link>
              <Link className="text-link" href="/help/chat-reconnect">Chat reconnect help →</Link>
              <Link className="text-link" href="/tools">Try free tools →</Link>
              <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
            </LinkKeyboardGroup>
          </div>
        )}
      </div>
      {showJump && (
        <button
          type="button"
          className="button secondary"
          inert={dialogOpen ? true : undefined}
          aria-label="Jump to latest messages"
          onClick={jumpToLatest}
          onKeyDown={event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            (event.currentTarget as HTMLButtonElement).blur();
          }}
        >
          Jump to latest messages
        </button>
      )}
      {typing && <p role="status" inert={dialogOpen ? true : undefined}>Your Pandit is typing…</p>}
      {ended && (
        <>
          <aside className="notice" role="status" tabIndex={-1} inert={dialogOpen ? true : undefined} onKeyDown={event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            (event.currentTarget as HTMLElement).blur();
          }}>
            <p><strong>This consultation has ended.</strong> Ending here does not create a new booking or charge coins. If a refund was mentioned, confirm the amount in your wallet — this room is not a payment receipt. Press Escape to leave this notice.</p>
          </aside>
          <p className="sr-only" id="chat-ended-hint">Arrow keys move between post-chat links. Escape blurs the focused link. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="After chat ended" aria-describedby="chat-ended-hint" inert={dialogOpen ? true : undefined}>
            <Link className="button" href={`/bookings/${encodeURIComponent(id)}`}>Open booking details</Link>
            <Link className="button secondary" href={`/bookings/${encodeURIComponent(id)}/review`}>Review if completed</Link>
            <Link className="button secondary" href="/wallet">Check wallet</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/help/refunds-and-complaints">Refund help →</Link>
            <Link className="text-link" href="/how-it-works#booking-availability-how">New booking updates →</Link>
          </LinkKeyboardGroup>
        </>
      )}
      {graceRequested && !ended && (
        <>
          <p className="sr-only" id="chat-grace-hint">Arrow keys move between wallet, booking, tools and draft. Escape blurs the focused link. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" role="status" aria-label="Chat grace refund next steps" aria-describedby="chat-grace-hint" inert={dialogOpen ? true : undefined}>
            <Link className="button" href="/wallet">Open wallet</Link>
            <Link className="button secondary" href={`/bookings/${encodeURIComponent(id)}`}>Open booking</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/help/refunds-and-complaints">Refund help →</Link>
          </LinkKeyboardGroup>
        </>
      )}
      <form
        className="stack"
        aria-busy={pending || undefined}
        inert={dialogOpen ? true : undefined}
        onSubmit={e => {
          e.preventDefault();
          if (ended || !connected || pending || !draft.trim()) return;
          pendingSentAt.current = Date.now();
          setError('');
          socket.current?.emit('sendMessage', { bookingId: id, message: draft.trim() });
          setPending(true);
        }}
      >
        <label className="field">
          Message
          <textarea
            id="chat-composer"
            rows={4}
            maxLength={2000}
            aria-describedby="chat-draft-help chat-draft-count"
            placeholder="Write your message…"
            enterKeyHint="send"
            value={draft}
            disabled={ended || pending || !connected || dialogOpen}
            onChange={e => {
              setDraft(e.target.value);
              socket.current?.emit('typing', { bookingId: id });
            }}
            onKeyDown={e => {
              if (e.key !== 'Escape' || !draft) return;
              e.preventDefault();
              setDraft('');
              try { sessionStorage.removeItem(chatDraftKey(id)); } catch { /* ignore */ }
            }}
          />
        </label>
        <p id="chat-draft-count" className={styles.helper} aria-live="polite">{draft.length}/2000 characters</p>
        <p id="chat-draft-help" className={styles.helper}>
          {ended
            ? 'This consultation has ended. You can still read your conversation.'
            : !connected
              ? 'Waiting to reconnect before you can send. Keep this tab open — your draft is saved in this browser for this booking.'
              : pending
                ? 'Waiting up to 20 seconds for your message to appear in the conversation…'
                : 'Your message is shared with the Pandit in this consultation. Drafts stay in this browser until you send or press Escape to clear.'}
        </p>
        <button type="submit" className="button" disabled={pending || ended || !draft.trim() || !connected || dialogOpen} aria-busy={pending || undefined}>
          {pending ? 'Sending…' : ended ? 'Consultation ended' : !connected ? 'Reconnecting…' : 'Send message'}
        </button>
        {pending && (
          <p role="status" className="notice">
            Message submitted. If it does not appear above within about 20 seconds, sending unlocks again and your draft stays here.
          </p>
        )}
      </form>
      {!ended && (
        <>
          <p className="sr-only" id="chat-controls-hint">Arrow keys move between refund, end, leave, free tools and draft. Escape blurs the focused control. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Chat room controls" aria-describedby="chat-controls-hint" inert={dialogOpen ? true : undefined}>
            <button type="button" className="button secondary" disabled={!connected || dialogOpen} onClick={() => { setConfirmEnd(false); setConfirmLeave(false); setConfirmGrace(true); }}>
              Ask about an early-disconnect refund
            </button>
            <button type="button" className={`button secondary ${styles.danger}`} disabled={!connected || dialogOpen} onClick={() => { setConfirmGrace(false); setConfirmLeave(false); setConfirmEnd(true); }}>
              End consultation
            </button>
            <button type="button" className="button secondary" disabled={dialogOpen} onClick={() => { setConfirmEnd(false); setConfirmGrace(false); setConfirmLeave(true); }}>
              Leave room
            </button>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </>
      )}
      {ended && !confirmLeave && (
        <>
          <p className="sr-only" id="chat-leave-ended-hint">Arrow keys move between Leave room, draft, free tools and booking. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Leave ended chat" aria-describedby="chat-leave-ended-hint" inert={dialogOpen ? true : undefined}>
            <button type="button" className="button secondary" disabled={dialogOpen} onClick={() => setConfirmLeave(true)}>
              Leave room
            </button>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="text-link" href={`/bookings/${encodeURIComponent(id)}`}>View booking →</Link>
          </LinkKeyboardGroup>
        </>
      )}
      {confirmGrace && !ended && (
        <div className="notice" role="dialog" aria-modal="true" aria-labelledby="grace-title" ref={confirmRef}>
          <p id="grace-title"><strong>Ask about an early-disconnect refund?</strong></p>
          <p>This is for the first ~90 seconds after an early disconnect under your booking terms — not a general undo. Submitting asks for a review; it does not guarantee coins back. Check your wallet afterwards. Press Escape to cancel.</p>
          <p className="sr-only" id="chat-grace-confirm-hint">Arrow keys move between Cancel, Submit, wallet, free tools and draft. Escape cancels this dialog. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Chat grace refund confirmation" aria-describedby="chat-grace-confirm-hint">
            <button type="button" className="button secondary" onClick={() => setConfirmGrace(false)}>Cancel</button>
            <button
              type="button"
              className="button"
              disabled={!connected}
              onClick={() => {
                socket.current?.emit('requestGraceRefund', { bookingId: id });
                setConfirmGrace(false);
                setGraceRequested(true);
                setState('Early-disconnect refund request submitted. Check your wallet for the final outcome — eligibility is not guaranteed.');
                requestAnimationFrame(() => {
                  const node = document.getElementById('chat-session-state');
                  if (!node) return;
                  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                  node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
                  node.focus({ preventScroll: true });
                });
              }}
            >
              Submit request
            </button>
            <Link className="button secondary" href="/wallet">Open wallet</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </div>
      )}
      {confirmEnd && !ended && (
        <div className="notice" role="dialog" aria-modal="true" aria-labelledby="end-chat-title" ref={confirmRef}>
          <p id="end-chat-title"><strong>End this consultation for everyone?</strong></p>
          <p>You can leave the room without ending the consultation. Press Escape to cancel.</p>
          <p className="sr-only" id="chat-end-confirm-hint">Arrow keys move between Keep talking, End for everyone, free tools and draft. Escape cancels this dialog. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="End chat confirmation" aria-describedby="chat-end-confirm-hint">
            <button type="button" className="button secondary" onClick={() => setConfirmEnd(false)}>Keep talking</button>
            <button
              type="button"
              className={`button secondary ${styles.danger}`}
              disabled={!connected}
              onClick={() => {
                socket.current?.emit('endSession', { bookingId: id });
                setConfirmEnd(false);
              }}
            >
              End for everyone
            </button>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </div>
      )}
      {confirmLeave && (
        <div className="notice" role="dialog" aria-modal="true" aria-labelledby="leave-chat-title" ref={confirmRef}>
          <p id="leave-chat-title"><strong>Leave this chat room?</strong></p>
          <p>The consultation stays open for your booked window. You can rejoin from the booking page. Your unsent draft will not be kept after you leave. Press Escape to stay.</p>
          <p className="sr-only" id="chat-leave-confirm-hint">Arrow keys move between Stay, Leave, free tools and draft. Escape cancels this dialog. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Leave chat confirmation" aria-describedby="chat-leave-confirm-hint">
            <button type="button" className="button secondary" onClick={() => setConfirmLeave(false)}>Stay in room</button>
            <Link className="button" href={`/bookings/${encodeURIComponent(id)}`}>Leave and open booking</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
          </LinkKeyboardGroup>
        </div>
      )}
    </section>
  );
}
