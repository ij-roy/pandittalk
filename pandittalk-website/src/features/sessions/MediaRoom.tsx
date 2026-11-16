'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Socket } from 'socket.io-client';
import { api } from '@/lib/api/client';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { createSessionSocket } from './socket';
import { sessionEvents } from './events';
import { BrowserWebRtcSession, type WebRtcSessionConfig } from './webrtc';
import { formatSessionRemaining } from './sessionTimer';
import styles from '../account/customer.module.css';

export default function MediaRoom({ id, format }: { id: string; format: 'audio' | 'video' }) {
  const media = useRef<BrowserWebRtcSession | null>(null);
  const socket = useRef<Socket | null>(null);
  const local = useRef<HTMLVideoElement | null>(null);
  const remote = useRef<HTMLVideoElement | null>(null);
  const confirmRef = useRef<HTMLDivElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const mounted = useRef(true);
  const [state, setState] = useState('Check your devices, then join when you are ready.');
  const [cameraNote, setCameraNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [mic, setMic] = useState('');
  const [cam, setCam] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmGrace, setConfirmGrace] = useState(false);
  const [graceRequested, setGraceRequested] = useState(false);
  const [leftRoom, setLeftRoom] = useState(false);
  const [ended, setEnded] = useState(false);
  const [sessionEndAt, setSessionEndAt] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const events = sessionEvents(format);
  const dialogOpen = confirmEnd || confirmLeave || confirmGrace;
  const joinRef = useRef<HTMLButtonElement | null>(null);
  const rejoinRef = useRef<HTMLButtonElement | null>(null);
  const endedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!sessionEndAt || ended) return;
    const update = () => setSecondsRemaining(Math.max(0, Math.ceil((sessionEndAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [sessionEndAt, ended]);

  useEffect(() => {
    if (error) requestAnimationFrame(() => errorRef.current?.focus());
  }, [error]);

  useEffect(() => {
    if (!ended) return;
    requestAnimationFrame(() => endedRef.current?.focus());
  }, [ended]);

  useEffect(() => {
    if (joined || leftRoom || busy || ended) return;
    requestAnimationFrame(() => joinRef.current?.focus());
  }, [joined, leftRoom, busy, ended, id, format]);

  useEffect(() => {
    if (!leftRoom || joined || ended) return;
    requestAnimationFrame(() => rejoinRef.current?.focus());
  }, [leftRoom, joined, ended]);

  async function cleanup() {
    const m = media.current;
    media.current = null;
    socket.current?.emit(events.leave, { bookingId: id });
    socket.current?.removeAllListeners();
    socket.current?.disconnect();
    socket.current = null;
    if (m) await m.stop();
    if (mounted.current) {
      setJoined(false);
      setCamera(false);
      setMuted(false);
      setConfirmEnd(false);
      setConfirmLeave(false);
      setConfirmGrace(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void cleanup();
    };
  }, [id, format]);

  useEffect(() => {
    if (!confirmEnd && !confirmLeave && !confirmGrace) return;
    const node = confirmRef.current;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(node?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || [])
        .filter(el => !el.hasAttribute('disabled'));
    const items = focusables();
    (items.find(el => !el.className.includes('danger')) || items[0])?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setConfirmEnd(false);
        setConfirmLeave(false);
        setConfirmGrace(false);
        return;
      }
      if (event.key !== 'Tab' || !node) return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [confirmEnd, confirmLeave, confirmGrace]);

  async function check() {
    if (checking || busy) return;
    setChecking(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: format === 'video' });
      stream.getTracks().forEach(t => t.stop());
      setDevices(await navigator.mediaDevices.enumerateDevices());
      setState('Device access works. Devices are released until you join.');
    } catch (e) {
      setError(`${(e as Error).message}. Check browser permissions. Your booked format and charge have not changed.`);
    } finally {
      setChecking(false);
    }
  }

  async function join() {
    setBusy(true);
    setError('');
    try {
      const config = await api<WebRtcSessionConfig>(`/sessions/${format}/join`, {
        method: 'POST',
        body: JSON.stringify({ bookingId: id }),
      });
      if (!mounted.current) return;
      const session = new BrowserWebRtcSession(config, format, {
        localVideo: local.current,
        remoteVideo: remote.current,
      });
      await session.start(mic || undefined, cam || undefined);
      media.current = session;
      const connection = await createSessionSocket();
      if (!mounted.current) {
        connection.socket.disconnect();
        await cleanup();
        return;
      }
      socket.current = connection.socket;
      const s = connection.socket;
      session.setSignalSender(signal => s.emit('mediaSignal', { bookingId: id, format, signal }));
      s.on('connect', () => s.emit(events.join, { bookingId: id, token: connection.token }));
      s.on('disconnect', () => setState('Connection interrupted. Reconnecting automatically… Stay on this page.'));
      s.on('error', (p: { message?: string }) => setError(p.message || 'Session request rejected.'));
      s.on('connect_error', () =>
        setError('We could not reconnect your consultation yet. Keep this page open, or return from your booking and try again.'),
      );
      s.on(events.started, (p: { endTime?: number; durationMinutes?: number }) => {
        if (Number.isFinite(p.endTime)) setSessionEndAt(Number(p.endTime));
        session.enableSessionMedia();
        setState('Consultation started');
      });
      s.on('timeRemaining', (p: { secondsLeft?: number }) => {
        if (Number.isFinite(p.secondsLeft)) setSecondsRemaining(Math.max(0, Number(p.secondsLeft)));
      });
      s.on(`${format}WaitingForOther`, () => {
        session.enterWaitingRoomMode();
        setState('Waiting for your Pandit');
      });
      s.on(`${format}WaitingForStart`, () => {
        session.enterWaitingRoomMode();
        setState('Waiting for the scheduled start');
      });
      s.on(`${format}ParticipantLeft`, () =>
        setState('Your Pandit left briefly. Stay here — we will reconnect when they return.'),
      );
      s.on(`${format}ParticipantRejoined`, () => setState('Your Pandit rejoined. You can continue.'));
      s.on('mediaPeerReady', (payload: { bookingId?: string; format?: string; initiator?: boolean }) => {
        if (payload.bookingId !== id || payload.format !== format || typeof payload.initiator !== 'boolean') return;
        void session.handlePeerReady(payload.initiator);
      });
      s.on('mediaSignal', (payload: { bookingId?: string; format?: string; signal?: unknown }) => {
        if (payload.bookingId !== id || payload.format !== format || !payload.signal) return;
        void session.handleSignal(payload.signal as Parameters<BrowserWebRtcSession['handleSignal']>[0]);
      });
      s.on('videoCameraState', (p: { cameraOn: boolean }) =>
        setCameraNote(p.cameraOn ? 'Pandit camera is on' : 'Pandit camera is off'),
      );
      for (const event of [events.ended, events.timeUp, 'sessionGraceEnded', 'sessionRefunded']) {
        s.on(event, (p?: { message?: string; coinsRefunded?: number }) => {
          setEnded(true);
          setSecondsRemaining(0);
          setLeftRoom(false);
          setConfirmEnd(false);
          setConfirmLeave(false);
          setConfirmGrace(false);
          setState(p?.message || 'Your consultation has ended. Check your booking and wallet for the final details.');
          void cleanup();
        });
      }
      s.connect();
      setJoined(true);
      if (format === 'video') {
        setCamera(true);
        s.emit('videoCameraState', { bookingId: id, cameraOn: true });
      }
    } catch (e) {
      setError((e as Error).message);
      await cleanup();
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  async function toggleCamera() {
    if (cameraBusy) return;
    setCameraBusy(true);
    try {
      const m = media.current;
      if (!m) return;
      m.setCameraEnabled(!camera);
      socket.current?.emit('videoCameraState', { bookingId: id, cameraOn: !camera });
      setCamera(!camera);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCameraBusy(false);
    }
  }

  return (
    <section className="stack">
      <p
        id="media-session-state"
        className="notice"
        role="status"
        tabIndex={-1}
        inert={dialogOpen ? true : undefined}
        onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).blur();
        }}
      >
        {state} Press Escape to leave this status.
      </p>
      {secondsRemaining !== null && !ended && <div className={styles.sessionTimer} role="status" aria-live="polite" data-warning={secondsRemaining <= 300 ? 'true' : undefined}><strong>{formatSessionRemaining(secondsRemaining)}</strong><span>remaining · server timer</span></div>}
      {cameraNote && format === 'video' && (
        <p
          className="expert-meta"
          role="status"
          aria-live="polite"
          tabIndex={-1}
          inert={dialogOpen ? true : undefined}
          onKeyDown={event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            (event.currentTarget as HTMLElement).blur();
          }}
        >
          {cameraNote} Press Escape to leave this note.
        </p>
      )}
      {error && (
        <div role="alert" className="error" tabIndex={-1} ref={errorRef} inert={dialogOpen ? true : undefined} onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          setError('');
          requestAnimationFrame(() => {
            const join = document.querySelector<HTMLButtonElement>('section.stack > button.button, section.stack button.button:not(:disabled)');
            const recovery = document.querySelector<HTMLElement>('a[href*="joining-audio-video"], a[href*="/bookings/"]');
            (join || recovery)?.focus();
          });
        }}>
          <p>{error} Press Escape to dismiss and return to session controls when available.</p>
          <p className="sr-only" id="media-error-hint">Arrow keys move between media error recovery links. Escape dismisses this alert. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Media session error recovery" aria-describedby="media-error-hint">
            {/token|auth|unauthorized|forbidden|sign in/i.test(error) ? (
              <Link className="button secondary" href={`/login?returnTo=${encodeURIComponent(`/sessions/${id}/${format}`)}&reason=session`}>Sign in again</Link>
            ) : (
              <button
                type="button"
                className="button secondary"
                disabled={busy || checking}
                aria-busy={busy || undefined}
                onClick={() => {
                  setError('');
                  if (joined) {
                    socket.current?.connect();
                    setState('Reconnecting… Keep this tab open.');
                  } else {
                    void join();
                  }
                }}
              >
                {joined ? 'Retry connection' : busy ? 'Joining…' : 'Try joining again'}
              </button>
            )}
            <Link className="button secondary" href={`/bookings/${encodeURIComponent(id)}`}>Open booking</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/help/joining-audio-video">Join help →</Link>
            <Link className="text-link" href="/contact">Contact support →</Link>
          </LinkKeyboardGroup>
        </div>
      )}
      <div className="grid" inert={dialogOpen ? true : undefined}>
        {format === 'video' && (
          <>
            <div className="panel">
              <h2>You</h2>
              <video aria-label="Your camera preview" ref={local} muted autoPlay playsInline className={styles.video} />
              {!camera && <p>Camera off</p>}
            </div>
            <div className="panel">
              <h2>Your Pandit</h2>
              <video aria-label="Video from your Pandit" ref={remote} autoPlay playsInline className={styles.video} />
            </div>
          </>
        )}
      </div>
      {ended && !joined && (
        <section
          className="panel stack"
          role="status"
          tabIndex={-1}
          ref={endedRef}
          onKeyDown={event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            (event.currentTarget as HTMLElement).blur();
          }}
        >
          <p><strong>This consultation has ended.</strong> Rejoining from here will not open a new booking or charge coins. Review is available only after the booking is marked completed. If a refund was mentioned in-session, confirm it in your wallet — this room is not a payment receipt. Press Escape to leave this notice.</p>
          <p className="sr-only" id="media-ended-hint">Arrow keys move between booking, review, free tools, draft and wallet after the consultation ends. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="After media consultation ended" aria-describedby="media-ended-hint">
            <Link className="button" href={`/bookings/${encodeURIComponent(id)}`}>Open booking details</Link>
            <Link className="button secondary" href={`/bookings/${encodeURIComponent(id)}/review`}>Review if completed</Link>
            <Link className="button secondary" href="/wallet">Check wallet</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/help/refunds-and-complaints">Refund help →</Link>
          </LinkKeyboardGroup>
        </section>
      )}
      {!joined && !leftRoom && !ended && (
        <>
          <p className="sr-only" id="media-device-check-hint">Arrow keys move between Check devices, Join, help, free tools and draft. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" style={{ marginBottom: 8 }} aria-label="Check media devices" aria-describedby="media-device-check-hint">
            <button type="button" className="button secondary" disabled={checking || busy} aria-busy={checking || undefined} onClick={check}>
              {checking ? 'Checking…' : 'Check microphone'}
              {format === 'video' ? ' and camera' : ''}
            </button>
            <Link className="text-link" href="/help/joining-audio-video">Join help →</Link>
            <Link className="text-link" href={`/bookings/${encodeURIComponent(id)}`}>Open booking →</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
          <label className="field">
            Microphone
            <select
              disabled={busy || checking}
              value={mic}
              onChange={e => setMic(e.target.value)}
              aria-describedby="media-device-help"
              onKeyDown={e => {
                if (e.key !== 'Escape' || !mic) return;
                e.preventDefault();
                setMic('');
              }}
            >
              <option value="">System default</option>
              {devices
                .filter(d => d.kind === 'audioinput')
                .map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || 'Microphone'}
                  </option>
                ))}
            </select>
          </label>
          {format === 'video' && (
            <label className="field">
              Camera
              <select
                disabled={busy || checking}
                value={cam}
                onChange={e => setCam(e.target.value)}
                aria-describedby="media-device-help"
                onKeyDown={e => {
                  if (e.key !== 'Escape' || !cam) return;
                  e.preventDefault();
                  setCam('');
                }}
              >
                <option value="">System default</option>
                {devices
                  .filter(d => d.kind === 'videoinput')
                  .map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || 'Camera'}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <p id="media-device-help" className={styles.helper}>
            Check devices first so labels appear. Escape resets a select to the system default. Joining does not change your booked format or charge.
          </p>
          <p className="sr-only" id="media-join-extra-hint">Arrow keys also move to free tools and draft. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Join media consultation" aria-describedby="media-device-help media-join-extra-hint">
            <button type="button" className="button" ref={joinRef} disabled={busy || checking} aria-busy={busy || undefined} onClick={() => { setLeftRoom(false); void join(); }}>
              {busy ? 'Joining…' : 'Join consultation'}
            </button>
            <Link className="text-link" href="/help/joining-audio-video">Need join help? →</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </>
      )}
      {joined && (
        <>
          <p className="sr-only" id="media-controls-hint">Arrow keys move between mute, camera, leave, refund, end, free tools and draft. Escape blurs the focused control. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Media room controls" aria-describedby="media-controls-hint" inert={dialogOpen ? true : undefined}>
          <button type="button"
            className="button secondary"
            aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
            aria-pressed={muted}
            disabled={dialogOpen}
            onClick={() => {
              media.current?.setMuted(!muted);
              setMuted(!muted);
            }}
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
          {format === 'video' && (
            <button type="button"
              className="button secondary"
              aria-label={camera ? 'Turn camera off' : 'Turn camera on'}
              aria-pressed={camera}
              disabled={cameraBusy || dialogOpen}
              aria-busy={cameraBusy || undefined}
              onClick={toggleCamera}
            >
              {cameraBusy ? 'Updating camera…' : camera ? 'Turn camera off' : 'Turn camera on'}
            </button>
          )}
          <button type="button"
            className="button secondary"
            disabled={dialogOpen}
            onClick={() => {
              setConfirmEnd(false);
              setConfirmGrace(false);
              setConfirmLeave(true);
            }}
          >
            Leave room
          </button>
          <button type="button"
            className="button secondary"
            disabled={dialogOpen}
            onClick={() => {
              setConfirmEnd(false);
              setConfirmLeave(false);
              setConfirmGrace(true);
            }}
          >
            Request eligible grace refund
          </button>
          <button type="button"
            className={`button secondary ${styles.danger}`}
            disabled={dialogOpen}
            onClick={() => {
              setConfirmLeave(false);
              setConfirmGrace(false);
              setConfirmEnd(true);
            }}
          >
            End consultation
          </button>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
        </>
      )}
      {leftRoom && !joined && !ended && (
        <>
          <p className="sr-only" id="media-rejoin-hint">Arrow keys move between Rejoin, booking, tools, draft and help. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" role="status" aria-label="Rejoin media session" aria-describedby="media-rejoin-hint">
            <p className="expert-meta">You left the room. Your booking window may still be open — rejoin without creating a new charge.</p>
            <button type="button" className="button" ref={rejoinRef} disabled={busy || checking} aria-busy={busy || undefined} onClick={() => { setLeftRoom(false); void join(); }}>
              {busy ? 'Rejoining…' : 'Rejoin consultation'}
            </button>
            <Link className="button secondary" href={`/bookings/${encodeURIComponent(id)}`}>Open booking details</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/help/joining-audio-video">Join help →</Link>
            <Link className="text-link" href="/wallet">Check wallet for refunds →</Link>
          </LinkKeyboardGroup>
        </>
      )}
      {graceRequested && joined && (
        <>
          <p className="sr-only" id="media-grace-hint">Arrow keys move between wallet, booking, tools, draft and refund help. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" role="status" aria-label="Grace refund next steps" aria-describedby="media-grace-hint" inert={dialogOpen ? true : undefined}>
            <Link className="button" href="/wallet">Open wallet</Link>
            <Link className="button secondary" href={`/bookings/${encodeURIComponent(id)}`}>Open booking</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/help/refunds-and-complaints">Refund help →</Link>
          </LinkKeyboardGroup>
        </>
      )}
      {confirmGrace && joined && (
        <div
          className="notice"
          role="dialog"
          aria-modal="true"
          aria-labelledby="grace-media-title"
          ref={confirmRef}
        >
          <p id="grace-media-title">
            <strong>Request a grace refund?</strong>
          </p>
          <p>
            The grace window is about the first ~90 seconds after an early disconnect under your booking terms — not a general undo. Submitting asks for a review; it does not guarantee coins back. Check your wallet afterwards. Press Escape to cancel.
          </p>
          <p className="sr-only" id="media-grace-confirm-hint">Arrow keys move between Cancel, Submit, wallet, free tools and draft. Escape cancels this dialog. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Confirm media grace refund" aria-describedby="media-grace-confirm-hint">
            <button type="button" className="button secondary" onClick={() => setConfirmGrace(false)}>
              Cancel
            </button>
            <button type="button"
              className="button"
              onClick={() => {
                socket.current?.emit('requestGraceRefund', { bookingId: id });
                setConfirmGrace(false);
                setGraceRequested(true);
                setState('Grace refund request submitted. Check your wallet for the final outcome — eligibility is not guaranteed.');
                requestAnimationFrame(() => {
                  const node = document.getElementById('media-session-state');
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
      {confirmLeave && joined && (
        <div
          className="notice"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-media-title"
          ref={confirmRef}
        >
          <p id="leave-media-title">
            <strong>Leave this room?</strong>
          </p>
          <p>
            Your microphone and camera turn off. The consultation stays open for your booked window so you can rejoin.
            Press Escape to stay connected.
          </p>
          <p className="sr-only" id="media-leave-confirm-hint">Arrow keys move between Stay connected, Leave room, free tools and draft. Escape cancels this dialog. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Confirm leave media room" aria-describedby="media-leave-confirm-hint">
            <button type="button" className="button secondary" onClick={() => setConfirmLeave(false)}>
              Stay connected
            </button>
            <button type="button"
              className="button"
              onClick={() => {
                void cleanup();
                setLeftRoom(true);
                setState('You left the room. The consultation has not been explicitly ended — you can rejoin from this page or your booking while the window remains open.');
              }}
            >
              Leave room
            </button>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </div>
      )}
      {confirmEnd && joined && (
        <div
          className="notice"
          role="dialog"
          aria-modal="true"
          aria-labelledby="end-media-title"
          ref={confirmRef}
        >
          <p id="end-media-title">
            <strong>End this consultation for everyone?</strong>
          </p>
          <p>To step away temporarily, choose Leave room instead. Press Escape to keep talking.</p>
          <p className="sr-only" id="media-end-confirm-hint">Arrow keys move between Keep talking, End for everyone, free tools and draft. Escape cancels this dialog. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Confirm end media consultation" aria-describedby="media-end-confirm-hint">
            <button type="button" className="button secondary" onClick={() => setConfirmEnd(false)}>
              Keep talking
            </button>
            <button type="button"
              className={`button secondary ${styles.danger}`}
              onClick={() => {
                socket.current?.emit(events.end, { bookingId: id });
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
      <p className={styles.helper}>
        Leaving turns off your microphone and camera. You may rejoin within your original booking window. Any eligible
        refund will appear in your wallet.
      </p>
    </section>
  );
}
