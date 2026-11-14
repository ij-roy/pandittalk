import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getErrorMessage, getUserDetailsForBooking, joinVideoSession } from '../lib/api';
import { chatSocket } from '../lib/chatSocket';
import { chimeVideo } from '../lib/chimeVideo';
import { formatTimer } from '../lib/format';
import { usePanditStore } from '../store/usePanditStore';
import styles from './VideoSession.module.css';

const IST = 'Asia/Kolkata';
const PIP_WIDTH = 140;
const PIP_HEIGHT = 190;
const PIP_MARGIN = 16;

type PipCorner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
type FocusedView = 'local' | 'remote';

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

function cornerPosition(corner: PipCorner): { top: number; left: number } {
  switch (corner) {
    case 'topLeft':
      return { top: PIP_MARGIN, left: PIP_MARGIN };
    case 'topRight':
      return { top: PIP_MARGIN, left: window.innerWidth - PIP_WIDTH - PIP_MARGIN };
    case 'bottomLeft':
      return { top: window.innerHeight - PIP_HEIGHT - PIP_MARGIN - 160, left: PIP_MARGIN };
    case 'bottomRight':
      return {
        top: window.innerHeight - PIP_HEIGHT - PIP_MARGIN - 160,
        left: window.innerWidth - PIP_WIDTH - PIP_MARGIN,
      };
  }
}

function nearestCorner(x: number, y: number): PipCorner {
  const midX = window.innerWidth / 2;
  const midY = window.innerHeight / 2;
  if (x < midX) {
    return y < midY ? 'topLeft' : 'bottomLeft';
  }
  return y < midY ? 'topRight' : 'bottomRight';
}

export function VideoSession() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const accessToken = usePanditStore((state) => state.accessToken);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const videoAreaRef = useRef<HTMLDivElement>(null);

  const [userName, setUserName] = useState('User');
  const [timerLabel, setTimerLabel] = useState('--:--');
  const [connectionStatus, setConnectionStatus] = useState('Connecting…');
  const [prepDone, setPrepDone] = useState(false);
  const [waitingForStart, setWaitingForStart] = useState(false);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [userCameraOn, setUserCameraOn] = useState(true);
  const [participantInCall, setParticipantInCall] = useState(false);
  const [remoteVideoFit, setRemoteVideoFit] = useState<'contain' | 'cover'>('contain');
  const [sessionMediaActive, setSessionMediaActive] = useState(false);
  const [showWarningBanner, setShowWarningBanner] = useState(false);
  const [focusedView, setFocusedView] = useState<FocusedView>('remote');
  const [pipCorner, setPipCorner] = useState<PipCorner>('topRight');
  const [pipDragPos, setPipDragPos] = useState<{ top: number; left: number } | null>(null);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(140);

  const endTimeMsRef = useRef<number | null>(null);
  const startTimeMsRef = useRef<number | null>(null);
  const sessionActiveRef = useRef(false);
  const sessionEndedRef = useRef(false);
  const waitingForOtherRef = useRef(true);
  const waitingForStartRef = useRef(false);
  const resizeDragRef = useRef<{ startY: number; startH: number } | null>(null);
  const pipDragRef = useRef<{ startX: number; startY: number; origTop: number; origLeft: number } | null>(null);
  const participantInCallRef = useRef(false);
  const pipDidDragRef = useRef(false);
  const userCameraOnRef = useRef(true);

  const setConnectionStatusSafe = useCallback((next: string) => {
    setConnectionStatus((prev) => (prev === next ? prev : next));
  }, []);

  const updateActiveConnectionStatus = useCallback(
    (inCall: boolean, remoteVideo: boolean, cameraOn: boolean) => {
      if (!sessionActiveRef.current) return;
      if (!inCall) {
        setConnectionStatusSafe(
          'Other participant disconnected — waiting for reconnect…',
        );
        return;
      }
      if (!remoteVideo || !cameraOn) {
        setConnectionStatusSafe('User has turned off their video');
        return;
      }
      setConnectionStatusSafe('Connected');
    },
    [setConnectionStatusSafe],
  );

  const handleGraceEnded = useCallback(
    (message: string) => {
      if (sessionEndedRef.current) return;
      sessionEndedRef.current = true;
      window.alert(message);
      void chimeVideo.stopSession();
      chatSocket.removeAllListeners();
      navigate('/dashboard', { replace: true });
    },
    [navigate],
  );

  const handleSessionEnded = useCallback(async () => {
    if (sessionEndedRef.current) return;
    sessionEndedRef.current = true;
    setConnectionStatusSafe('Session ended');
    window.alert('Session ended');
    await chimeVideo.stopSession();
    chatSocket.removeAllListeners();
    navigate('/dashboard?sessionCompleted=1', { replace: true });
  }, [navigate, setConnectionStatusSafe]);

  const handleLeave = useCallback(async () => {
    if (!bookingId || sessionEndedRef.current) return;
    if (!window.confirm('Leave this session? The seeker stays. Only they can end it.')) return;
    chatSocket.leaveVideoSession(bookingId);
    await chimeVideo.stopSession();
    chatSocket.removeAllListeners();
    navigate('/dashboard', { replace: true });
  }, [bookingId, navigate]);

  const toggleMute = useCallback(() => {
    if (!sessionMediaActive) return;
    setIsMuted((prev) => {
      const next = !prev;
      chimeVideo.setMuted(next);
      return next;
    });
  }, [sessionMediaActive]);

  const isCameraOnRef = useRef(true);

  const toggleCamera = useCallback(() => {
    setIsCameraOn((prev) => {
      const next = !prev;
      isCameraOnRef.current = next;
      chimeVideo.setCameraEnabled(next);
      if (bookingId) chatSocket.emitVideoCameraState(bookingId, next);
      return next;
    });
  }, [bookingId]);

  const toggleRemoteVideoFit = useCallback(() => {
    setRemoteVideoFit((prev) => (prev === 'contain' ? 'cover' : 'contain'));
  }, []);

  const toggleFocusedView = useCallback(() => {
    if (pipDidDragRef.current) {
      pipDidDragRef.current = false;
      return;
    }
    setFocusedView((prev) => (prev === 'remote' ? 'local' : 'remote'));
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
      Math.min(maxH, Math.max(80, resizeDragRef.current.startH + delta)),
    );
  }, []);

  const onResizePointerUp = useCallback(() => {
    resizeDragRef.current = null;
  }, []);

  const onPipPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      pipDidDragRef.current = false;
      const pos = pipDragPos ?? cornerPosition(pipCorner);
      pipDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origTop: pos.top,
        origLeft: pos.left,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      e.stopPropagation();
    },
    [pipCorner, pipDragPos],
  );

  const onPipPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!pipDragRef.current) return;
    const dx = e.clientX - pipDragRef.current.startX;
    const dy = e.clientY - pipDragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      pipDidDragRef.current = true;
    }
    setPipDragPos({
      top: pipDragRef.current.origTop + dy,
      left: pipDragRef.current.origLeft + dx,
    });
  }, []);

  const onPipPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!pipDragRef.current) return;
      const dx = e.clientX - pipDragRef.current.startX;
      const dy = e.clientY - pipDragRef.current.startY;
      const finalTop = pipDragRef.current.origTop + dy;
      const finalLeft = pipDragRef.current.origLeft + dx;
      const corner = nearestCorner(finalLeft + PIP_WIDTH / 2, finalTop + PIP_HEIGHT / 2);
      setPipCorner(corner);
      setPipDragPos(null);
      pipDragRef.current = null;
    },
    [],
  );

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
    userCameraOnRef.current = userCameraOn;
  }, [userCameraOn]);

  useEffect(() => {
    const pollRemote = window.setInterval(() => {
      if (!sessionMediaActive) return;
      const remoteVideo = chimeVideo.hasRemoteVideo();
      setHasRemoteVideo(remoteVideo);
      updateActiveConnectionStatus(
        participantInCallRef.current,
        remoteVideo,
        userCameraOnRef.current,
      );
    }, 500);
    return () => window.clearInterval(pollRemote);
  }, [sessionMediaActive, updateActiveConnectionStatus]);

  useEffect(() => {
    updateActiveConnectionStatus(
      participantInCallRef.current,
      hasRemoteVideo,
      userCameraOnRef.current,
    );
  }, [hasRemoteVideo, userCameraOn, updateActiveConnectionStatus]);

  useEffect(() => {
    if (!prepDone) return;
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

        const localEl = localVideoRef.current;
        const remoteEl = remoteVideoRef.current;
        if (!localEl || !remoteEl) {
          throw new Error('Video elements not ready');
        }

        const { meeting, attendee } = await joinVideoSession(bookingId);
        if (cancelled) return;

        await chimeVideo.startSession(meeting, attendee, {
          localVideo: localEl,
          remoteVideo: remoteEl,
        });
        if (cancelled) return;

        setIsInitializing(false);
        setIsMuted(true);
        setConnectionStatus('Waiting for user');

        chatSocket.connect(accessToken);
        chatSocket.joinVideoSession(bookingId, accessToken, {
          onWaitingForOther: () => {
            waitingForOtherRef.current = true;
            waitingForStartRef.current = false;
            sessionActiveRef.current = false;
            setSessionMediaActive(false);
            endTimeMsRef.current = null;
            startTimeMsRef.current = null;
            setWaitingForStart(false);
            setStartsAt(null);
            setConnectionStatus('Waiting for user');
            setTimerLabel('--:--');
            setHasRemoteVideo(false);
            chimeVideo.enterWaitingRoomMode();
          },
          onWaitingForStart: ({ startsAt: startsAtIso }) => {
            const startMs = Date.parse(startsAtIso);
            waitingForOtherRef.current = false;
            waitingForStartRef.current = true;
            sessionActiveRef.current = false;
            setSessionMediaActive(false);
            startTimeMsRef.current = Number.isNaN(startMs) ? null : startMs;
            endTimeMsRef.current = null;
            setWaitingForStart(true);
            setStartsAt(startsAtIso);
            setConnectionStatus('User is ready — waiting for start time');
            setHasRemoteVideo(false);
            chimeVideo.enterWaitingRoomMode();
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
            participantInCallRef.current = true;
            setParticipantInCall(true);
            setUserCameraOn(true);
            setSessionMediaActive(true);
            startTimeMsRef.current = null;
            endTimeMsRef.current = endTime;
            setWaitingForStart(false);
            setStartsAt(null);
            setConnectionStatusSafe('Connected');
            chimeVideo.enableSessionMedia();
            if (bookingId) chatSocket.emitVideoCameraState(bookingId, isCameraOnRef.current);
            setIsMuted(false);
            chimeVideo.setMuted(false);
            setTimerLabel(
              formatTimer(Math.max(0, Math.floor((endTime - Date.now()) / 1000))),
            );
          },
          onTimeRemaining: (seconds) => {
            if (!sessionActiveRef.current) return;
            endTimeMsRef.current = Date.now() + seconds * 1000;
            setTimerLabel(formatTimer(seconds));
          },
          onWarning: () => {
            setShowWarningBanner(true);
          },
          onSessionTimeUp: () => {
            void handleSessionEnded();
          },
          onSessionEnded: () => {
            void handleSessionEnded();
          },
          onParticipantLeft: () => {
            participantInCallRef.current = false;
            setParticipantInCall(false);
            if (sessionActiveRef.current) {
              setHasRemoteVideo(false);
              updateActiveConnectionStatus(false, false, userCameraOnRef.current);
            } else {
              setConnectionStatusSafe('Waiting for user');
            }
          },
          onParticipantRejoined: () => {
            participantInCallRef.current = true;
            setParticipantInCall(true);
            if (bookingId) chatSocket.emitVideoCameraState(bookingId, isCameraOnRef.current);
            if (sessionActiveRef.current) {
              setConnectionStatusSafe('Connected');
              updateActiveConnectionStatus(true, chimeVideo.hasRemoteVideo(), userCameraOnRef.current);
            }
          },
          onVideoCameraState: ({ cameraOn, senderRole }) => {
            if (senderRole === 'pandit') return;
            participantInCallRef.current = true;
            setParticipantInCall(true);
            userCameraOnRef.current = cameraOn;
            setUserCameraOn(cameraOn);
            updateActiveConnectionStatus(true, chimeVideo.hasRemoteVideo(), cameraOn);
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
        setError(message);
        setConnectionStatus('Error');
        setIsInitializing(false);
      }
    })();

    return () => {
      cancelled = true;
      if (bookingId && !sessionEndedRef.current) {
        chatSocket.leaveVideoSession(bookingId);
      }
      void chimeVideo.stopSession();
      chatSocket.removeAllListeners();
    };
  }, [accessToken, bookingId, handleGraceEnded, handleSessionEnded, navigate, prepDone, setConnectionStatusSafe, updateActiveConnectionStatus]);

  if (!bookingId) {
    return null;
  }

  if (!prepDone) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Prepare for video</h1>
          <button type="button" className={styles.leaveBtn} onClick={() => navigate('/dashboard')}>
            Back
          </button>
        </header>
        <div className={styles.banner} style={{ margin: '1.5rem', maxWidth: 480 }}>
          <p style={{ marginTop: 0 }}>
            Quick checklist before you join:
          </p>
          <ul>
            <li>Allow camera and microphone when prompted</li>
            <li>Find a quiet, well-lit space</li>
            <li>Keep the seeker&apos;s concern nearby</li>
          </ul>
          <button
            type="button"
            className={styles.leaveBtn}
            style={{ marginTop: '1rem' }}
            onClick={() => setPrepDone(true)}
          >
            I&apos;m ready — join video
          </button>
        </div>
      </div>
    );
  }

  const mainIsLocal = focusedView === 'local';
  const mainVideoRef = mainIsLocal ? localVideoRef : remoteVideoRef;
  const pipVideoRef = mainIsLocal ? remoteVideoRef : localVideoRef;
  const pipPos = pipDragPos ?? cornerPosition(pipCorner);
  const showRemoteFallback = sessionMediaActive && !hasRemoteVideo && !isInitializing;
  const mainFitClass =
    remoteVideoFit === 'contain' ? styles.remoteVideoContain : styles.remoteVideoCover;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Video Session — {bookingId}</h1>
        <button type="button" className={styles.leaveBtn} onClick={() => void handleLeave()}>
          Leave
        </button>
      </header>

      {error && <div className={styles.banner}>{error}</div>}
      {showWarningBanner ? (
        <div className={styles.warningBanner}>5 minutes remaining</div>
      ) : null}

      <div className={styles.videoArea} ref={videoAreaRef} hidden={isInitializing}>
        <video
          ref={mainVideoRef}
          className={`${styles.mainVideo} ${!mainIsLocal ? mainFitClass : ''}`}
          autoPlay
          playsInline
          muted={mainIsLocal}
        />
        {showRemoteFallback && !mainIsLocal ? (
          <div className={styles.remoteFallback}>
            <h2 className={styles.fallbackName}>{userName}</h2>
            <p className={styles.fallbackStatus}>
              {participantInCall
                ? 'User has turned off their video'
                : 'Waiting for user video…'}
            </p>
          </div>
        ) : null}
        <button
          type="button"
          className={styles.fitToggleBtn}
          onClick={toggleRemoteVideoFit}
          hidden={mainIsLocal}
        >
          {remoteVideoFit === 'contain' ? 'Fill' : 'Fit'}
        </button>
        <div
          className={styles.pipVideo}
          style={{ top: pipPos.top, left: pipPos.left }}
          onPointerDown={onPipPointerDown}
          onPointerMove={onPipPointerMove}
          onPointerUp={onPipPointerUp}
          onClick={toggleFocusedView}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') toggleFocusedView();
          }}
        >
          <video
            ref={pipVideoRef}
            className={`${styles.pipVideoInner} ${!mainIsLocal ? '' : styles.pipVideoInnerMirror}`}
            autoPlay
            playsInline
            muted={!mainIsLocal}
            style={{ visibility: !mainIsLocal && !isCameraOn ? 'hidden' : 'visible' }}
          />
        </div>
      </div>

      {isInitializing ? (
        <div className={styles.loading}>Connecting to video session…</div>
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
          </div>
          <div className={styles.controls}>
            <button
              type="button"
              className={`${styles.controlBtn} ${isMuted ? styles.controlBtnActive : ''}`}
              onClick={toggleMute}
              disabled={!!error || !sessionMediaActive}
              title={!sessionMediaActive ? 'Available when session starts' : undefined}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              type="button"
              className={`${styles.controlBtn} ${!isCameraOn ? styles.controlBtnActive : ''}`}
              onClick={toggleCamera}
              disabled={!!error}
            >
              {isCameraOn ? 'Camera Off' : 'Camera On'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
