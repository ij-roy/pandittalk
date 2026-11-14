import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getErrorMessage, getUserDetailsForBooking, joinAudioSession } from '../lib/api';
import { chatSocket } from '../lib/chatSocket';
import { chimeAudio } from '../lib/chimeAudio';
import { formatTimer } from '../lib/format';
import { usePanditStore } from '../store/usePanditStore';
import styles from './AudioSession.module.css';

const IST = 'Asia/Kolkata';

function formatStartTimeIst(startsAt: string): string {
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: IST,
  });
}

export function AudioSession() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const accessToken = usePanditStore((state) => state.accessToken);

  const [userName, setUserName] = useState('User');
  const [timerLabel, setTimerLabel] = useState('--:--');
  const [connectionStatus, setConnectionStatus] = useState('Connecting…');
  const [waitingForStart, setWaitingForStart] = useState(false);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionMediaActive, setSessionMediaActive] = useState(false);
  const [showWarningBanner, setShowWarningBanner] = useState(false);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [micStatus, setMicStatus] = useState<'connecting' | 'connected' | 'active' | 'error'>(
    'connecting',
  );
  const [micStatusMessage, setMicStatusMessage] = useState<string | null>(null);

  const endTimeMsRef = useRef<number | null>(null);
  const startTimeMsRef = useRef<number | null>(null);
  const sessionActiveRef = useRef(false);
  const sessionEndedRef = useRef(false);
  const waitingForOtherRef = useRef(true);
  const waitingForStartRef = useRef(false);
  const micEverActiveRef = useRef(false);
  const micWarningTimeoutRef = useRef<number | null>(null);
  const resizeDragRef = useRef<{ startY: number; startH: number } | null>(null);
  const isMutedRef = useRef(true);
  const sessionMediaActiveRef = useRef(false);
  const micActivityPendingRef = useRef<{ active: boolean } | null>(null);
  const micActivityRafRef = useRef<number | null>(null);

  const setConnectionStatusSafe = useCallback((next: string) => {
    setConnectionStatus((prev) => (prev === next ? prev : next));
  }, []);

  const handleSessionEnded = useCallback(async () => {
    if (sessionEndedRef.current) return;
    sessionEndedRef.current = true;
    setConnectionStatusSafe('Session ended');
    window.alert('Session ended');
    await chimeAudio.stopSession();
    chatSocket.removeAllListeners();
    navigate('/dashboard?sessionCompleted=1', { replace: true });
  }, [navigate, setConnectionStatusSafe]);

  const handleGraceEnded = useCallback(
    (message: string) => {
      if (sessionEndedRef.current) return;
      sessionEndedRef.current = true;
      window.alert(message);
      void chimeAudio.stopSession();
      chatSocket.removeAllListeners();
      navigate('/dashboard', { replace: true });
    },
    [navigate],
  );

  const handleLeave = useCallback(async () => {
    if (!bookingId || sessionEndedRef.current) return;
    if (!window.confirm('Leave this session? The seeker stays. Only they can end it.')) return;
    chatSocket.leaveAudioSession(bookingId);
    await chimeAudio.stopSession();
    chatSocket.removeAllListeners();
    navigate('/dashboard', { replace: true });
  }, [bookingId, navigate]);

  const scheduleMicPublishWarning = useCallback(() => {
    if (micWarningTimeoutRef.current !== null) {
      window.clearTimeout(micWarningTimeoutRef.current);
    }
    micWarningTimeoutRef.current = window.setTimeout(() => {
      if (micEverActiveRef.current || isMutedRef.current || !sessionMediaActiveRef.current) return;
      setMicStatus('error');
      setMicStatusMessage('Chime is not sending audio — check mic selection in browser settings');
    }, 5000);
  }, []);

  const toggleMute = useCallback(() => {
    if (!sessionMediaActiveRef.current) return;
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      chimeAudio.setMuted(next);
      if (next) {
        setMicStatus('connected');
        setMicStatusMessage('Microphone muted');
      } else {
        setMicStatusMessage('Microphone connected — speak to test');
      }
      return next;
    });
  }, []);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    sessionMediaActiveRef.current = sessionMediaActive;
  }, [sessionMediaActive]);

  useEffect(() => {
    chimeAudio.setMicActivityHandler((active) => {
      if (isMutedRef.current || !sessionMediaActiveRef.current) return;
      if (active) {
        micEverActiveRef.current = true;
        if (micWarningTimeoutRef.current !== null) {
          window.clearTimeout(micWarningTimeoutRef.current);
          micWarningTimeoutRef.current = null;
        }
      }
      micActivityPendingRef.current = { active };
      if (micActivityRafRef.current !== null) return;
      micActivityRafRef.current = window.requestAnimationFrame(() => {
        micActivityRafRef.current = null;
        const pending = micActivityPendingRef.current;
        if (!pending) return;
        setMicStatus(pending.active ? 'active' : 'connected');
        setMicStatusMessage(
          pending.active
            ? 'Microphone active — user can hear you'
            : 'Microphone connected — speak to test',
        );
      });
    });
    return () => {
      chimeAudio.setMicActivityHandler(null);
      if (micActivityRafRef.current !== null) {
        window.cancelAnimationFrame(micActivityRafRef.current);
        micActivityRafRef.current = null;
      }
    };
  }, []);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      resizeDragRef.current = { startY: e.clientY, startH: bottomPanelHeight };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [bottomPanelHeight],
  );

  const onResizePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeDragRef.current) return;
    const delta = resizeDragRef.current.startY - e.clientY;
    const maxH = window.innerHeight * 0.4;
    setBottomPanelHeight(
      Math.min(maxH, Math.max(100, resizeDragRef.current.startH + delta)),
    );
  }, []);

  const onResizePointerUp = useCallback(() => {
    resizeDragRef.current = null;
  }, []);

  useEffect(() => {
    const tick = () => {
      if (!waitingForStartRef.current || startTimeMsRef.current === null) return;
      const secondsLeft = Math.max(
        0,
        Math.floor((startTimeMsRef.current - Date.now()) / 1000),
      );
      setTimerLabel(formatTimer(secondsLeft));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!bookingId || !accessToken) {
      navigate('/dashboard', { replace: true });
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const details = await getUserDetailsForBooking(bookingId);
        if (!cancelled) {
          setUserName(details.userName?.trim() || 'User');
        }

        const { meeting, attendee } = await joinAudioSession(bookingId);
        if (cancelled) return;

        await chimeAudio.startSession(meeting, attendee);
        if (cancelled) return;

        if (!sessionActiveRef.current) {
          setMicStatus('connected');
          setMicStatusMessage('Waiting for session to start');
          micEverActiveRef.current = false;
          setIsInitializing(false);
          isMutedRef.current = true;
          setIsMuted(true);
          setConnectionStatusSafe('Waiting for user');
        } else {
          setIsInitializing(false);
        }

        chatSocket.connect(accessToken);
        chatSocket.joinAudioSession(bookingId, accessToken, {
          onWaitingForOther: () => {
            waitingForOtherRef.current = true;
            waitingForStartRef.current = false;
            sessionActiveRef.current = false;
            sessionMediaActiveRef.current = false;
            setSessionMediaActive(false);
            endTimeMsRef.current = null;
            startTimeMsRef.current = null;
            setWaitingForStart(false);
            setStartsAt(null);
            setConnectionStatusSafe('Waiting for user');
            setTimerLabel('--:--');
            chimeAudio.enterWaitingRoomMode();
          },
          onWaitingForStart: ({ startsAt: startsAtIso }) => {
            const startMs = Date.parse(startsAtIso);
            waitingForOtherRef.current = false;
            waitingForStartRef.current = true;
            sessionActiveRef.current = false;
            sessionMediaActiveRef.current = false;
            setSessionMediaActive(false);
            startTimeMsRef.current = Number.isNaN(startMs) ? null : startMs;
            endTimeMsRef.current = null;
            setWaitingForStart(true);
            setStartsAt(startsAtIso);
            setConnectionStatusSafe('User is ready — waiting for start time');
            chimeAudio.enterWaitingRoomMode();
            setTimerLabel(
              startTimeMsRef.current === null
                ? '--:--'
                : formatTimer(
                    Math.max(0, Math.floor((startTimeMsRef.current - Date.now()) / 1000)),
                  ),
            );
          },
          onSessionStarted: ({ endTime }) => {
            waitingForOtherRef.current = false;
            waitingForStartRef.current = false;
            sessionActiveRef.current = true;
            sessionMediaActiveRef.current = true;
            setSessionMediaActive(true);
            startTimeMsRef.current = null;
            endTimeMsRef.current = endTime;
            setWaitingForStart(false);
            setStartsAt(null);
            setConnectionStatusSafe('Connected');
            chimeAudio.enableSessionMedia();
            isMutedRef.current = false;
            setIsMuted(false);
            chimeAudio.setMuted(false);
            scheduleMicPublishWarning();
            setMicStatusMessage('Microphone connected — speak to test');
            setTimerLabel(
              formatTimer(Math.max(0, Math.floor((endTime - Date.now()) / 1000))),
            );
          },
          onTimeRemaining: (seconds) => {
            if (!sessionActiveRef.current) return;
            endTimeMsRef.current = Date.now() + seconds * 1000;
            setTimerLabel(formatTimer(seconds));
          },
          onWarning: () => setShowWarningBanner(true),
          onSessionTimeUp: () => {
            void handleSessionEnded();
          },
          onSessionEnded: () => {
            void handleSessionEnded();
          },
          onParticipantLeft: () => {
            if (sessionActiveRef.current) {
              setConnectionStatusSafe(
                'Other participant disconnected — waiting for reconnect…',
              );
            } else {
              setConnectionStatusSafe('Waiting for user');
            }
          },
          onParticipantRejoined: () => {
            if (sessionActiveRef.current) {
              setConnectionStatusSafe('Connected');
            }
          },
          onSessionGraceEnded: ({ message }) => {
            handleGraceEnded(message);
          },
          onError: (message) => {
            setError(message);
            setConnectionStatusSafe('Error');
            setIsInitializing(false);
          },
        });
      } catch (err) {
        if (cancelled) return;
        const message = getErrorMessage(err);
        setMicStatus('error');
        setMicStatusMessage(message);
        setError(message);
        setConnectionStatusSafe('Error');
        setIsInitializing(false);
      }
    })();

    return () => {
      cancelled = true;
      if (micWarningTimeoutRef.current !== null) {
        window.clearTimeout(micWarningTimeoutRef.current);
      }
      if (bookingId && !sessionEndedRef.current) {
        chatSocket.leaveAudioSession(bookingId);
      }
      void chimeAudio.stopSession();
      chatSocket.removeAllListeners();
    };
  }, [accessToken, bookingId, handleGraceEnded, handleSessionEnded, navigate, scheduleMicPublishWarning, setConnectionStatusSafe]);

  if (!bookingId) {
    return null;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Audio Session — {bookingId}</h1>
        <button type="button" className={styles.leaveBtn} onClick={() => void handleLeave()}>
          Leave
        </button>
      </header>

      {error && <div className={styles.banner}>{error}</div>}
      {showWarningBanner ? (
        <div className={styles.warningBanner}>5 minutes remaining</div>
      ) : null}

      {isInitializing ? (
        <div className={styles.loading}>Connecting to audio session…</div>
      ) : (
        <div className={styles.bottomPanel} style={{ height: bottomPanelHeight }}>
          <div
            className={styles.resizeHandle}
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
          />
          <div className={styles.infoBar}>
            <h2 className={styles.userName}>{userName}</h2>
            {waitingForStart && startsAt ? (
              <p className={styles.sessionBeginsText}>
                Session begins at {formatStartTimeIst(startsAt)} IST
              </p>
            ) : null}
            <span className={styles.timer}>{timerLabel}</span>
            <p className={styles.status}>{connectionStatus}</p>
            {micStatusMessage ? (
              <p
                className={`${styles.micStatus} ${
                  micStatus === 'error'
                    ? styles.micStatusError
                    : micStatus === 'active'
                      ? styles.micStatusActive
                      : ''
                }`}
              >
                {micStatusMessage}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className={`${styles.muteBtn} ${isMuted ? styles.muteBtnActive : ''}`}
            onClick={toggleMute}
            disabled={!sessionMediaActive}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>
      )}
    </div>
  );
}
