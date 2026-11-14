import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CallConnectionBanner } from '@/components/session/CallConnectionBanner';
import { ExtendSessionOffer } from '@/components/session/ExtendSessionOffer';
import { PostCallRating } from '@/components/session/PostCallRating';
import { GraceRefundLink } from '@/components/session/GraceRefundLink';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  GOLD,
  GREY_LABEL,
  SCRIM_BLACK,
  SESSION_BG,
  SESSION_CARD,
  SESSION_PANEL,
  SESSION_RED,
  SESSION_SURFACE,
  SHADOW_BLACK,
  TEXT_PRIMARY_DARK,
  WHITE,
} from '@/constants/Colors';
import { useSessionKeepAwake } from '@/hooks/useSessionKeepAwake';
import { PulseRing } from '@/components/session/PulseRing';
import { WaitingForPanditStatus } from '@/components/session/WaitingForPanditStatus';
import { formatApiConnectionError, getApiBase } from '@/lib/authApi';
import { useSessionLeaveGuard } from '@/hooks/useSessionLeaveGuard';
import { chatSocket } from '@/lib/chatSocket';
import { chimeVideo, VideoSurface } from '@/lib/chimeVideo';
import { leaveCallPrompt } from '@/lib/sessionLeaveCopy';
import { remoteVideoPlaceholder } from '@/lib/remoteVideoPlaceholder';
import { videoFeedLabels } from '@/lib/videoFeedLabels';
import {
  alertOpenSettingsForPermission,
  isMediaPermissionDeniedError,
} from '@/lib/mediaPermissions';
import {
  canJoinAvSessions,
  IOS_AV_UNAVAILABLE_MESSAGE,
  IOS_AV_UNAVAILABLE_TITLE,
} from '@/lib/iosStorePolicy';
import { useAuthStore } from '@/store/useAuthStore';

const VIDEO_BG = SHADOW_BLACK;
const IST = 'Asia/Kolkata';
const PIP_WIDTH = 110;
const PIP_HEIGHT = 150;
const PIP_MARGIN = 16;
const DEFAULT_BOTTOM_PANEL = 130;
const MIN_BOTTOM_PANEL = 90;
const MAX_BOTTOM_PANEL_RATIO = 0.4;
const GRACE_PERIOD_SECONDS = 90;

type PipCorner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
type FocusedView = 'local' | 'remote';

function paramString(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

function formatMmSs(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

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

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'P';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function cornerOffsets(
  corner: PipCorner,
  screenW: number,
  bottomPanel: number,
): { top: number; left: number } {
  const maxTop = Dimensions.get('window').height - bottomPanel - PIP_HEIGHT - PIP_MARGIN - 80;
  switch (corner) {
    case 'topLeft':
      return { top: PIP_MARGIN, left: PIP_MARGIN };
    case 'topRight':
      return { top: PIP_MARGIN, left: screenW - PIP_WIDTH - PIP_MARGIN };
    case 'bottomLeft':
      return { top: maxTop, left: PIP_MARGIN };
    case 'bottomRight':
      return { top: maxTop, left: screenW - PIP_WIDTH - PIP_MARGIN };
  }
}

function nearestCorner(x: number, y: number, screenW: number, screenH: number): PipCorner {
  const midX = screenW / 2;
  const midY = screenH / 2;
  if (x < midX) return y < midY ? 'topLeft' : 'bottomLeft';
  return y < midY ? 'topRight' : 'bottomRight';
}

export default function VideoSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const authHydrated = useAuthStore((s) => s.authHydrated);
  const setWalletBalance = useAuthStore((s) => s.setWalletBalance);
  const screenW = Dimensions.get('window').width;

  const raw = useLocalSearchParams<{ bookingId: string; panditName: string }>();
  const bookingId = paramString(raw.bookingId);
  const panditName = paramString(raw.panditName) || 'Pandit';

  // Keep screen on for the whole video call (JS + native window flag for OEM flakiness).
  useSessionKeepAwake('video-session');

  const [waitingForPandit, setWaitingForPandit] = useState(true);
  const [waitingElapsedSeconds, setWaitingElapsedSeconds] = useState(0);
  const [waitingForStart, setWaitingForStart] = useState(false);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [startCountdownSeconds, setStartCountdownSeconds] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionMediaActive, setSessionMediaActive] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [localTileId, setLocalTileId] = useState<number | null>(null);
  const [remoteTileId, setRemoteTileId] = useState<number | null>(null);
  const [panditCameraOn, setPanditCameraOn] = useState<boolean | null>(null);
  const [focusedView, setFocusedView] = useState<FocusedView>('remote');
  const [showSwapHint, setShowSwapHint] = useState(true);
  const [showExtendOffer, setShowExtendOffer] = useState(false);
  const [pipCorner, setPipCorner] = useState<PipCorner>('topRight');
  const [pipPosition, setPipPosition] = useState<{ top: number; left: number } | null>(null);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(DEFAULT_BOTTOM_PANEL);
  const [connectionStatus, setConnectionStatus] = useState('Connecting…');
  const [graceSecondsRemaining, setGraceSecondsRemaining] = useState(0);
  const [graceRefundPending, setGraceRefundPending] = useState(false);
  const [refundMessage, setRefundMessage] = useState<string | null>(null);
  const [refundCoins, setRefundCoins] = useState(0);

  const sessionEndedRef = useRef(false);
  const sessionActiveRef = useRef(false);
  const mediaLockedRef = useRef(false);
  const connectionStatusRef = useRef('Connecting…');
  const sessionStartedAtRef = useRef<number | null>(null);
  const startTimeMsRef = useRef<number | null>(null);
  const startCountdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const graceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitingForPanditRef = useRef(true);
  const waitingForStartRef = useRef(false);
  const pipDragStartRef = useRef<{ top: number; left: number } | null>(null);
  const pipDidDragRef = useRef(false);
  const resizeStartRef = useRef<{ height: number } | null>(null);

  const setConnectionStatusSafe = useCallback((next: string) => {
    if (connectionStatusRef.current === next) return;
    connectionStatusRef.current = next;
    setConnectionStatus(next);
  }, []);

  const clearStartCountdownInterval = useCallback(() => {
    if (startCountdownIntervalRef.current) {
      clearInterval(startCountdownIntervalRef.current);
      startCountdownIntervalRef.current = null;
    }
  }, []);

  const clearNavigateTimeout = useCallback(() => {
    if (navigateTimeoutRef.current) {
      clearTimeout(navigateTimeoutRef.current);
      navigateTimeoutRef.current = null;
    }
  }, []);

  const clearGraceInterval = useCallback(() => {
    if (graceIntervalRef.current) {
      clearInterval(graceIntervalRef.current);
      graceIntervalRef.current = null;
    }
  }, []);

  const startGraceInterval = useCallback(() => {
    clearGraceInterval();
    const tick = () => {
      const startedAt = sessionStartedAtRef.current;
      if (startedAt === null) {
        setGraceSecondsRemaining(0);
        return;
      }
      const remaining = Math.max(
        0,
        GRACE_PERIOD_SECONDS - Math.floor((Date.now() - startedAt) / 1000),
      );
      setGraceSecondsRemaining(remaining);
      if (remaining === 0) clearGraceInterval();
    };
    tick();
    graceIntervalRef.current = setInterval(tick, 1000);
  }, [clearGraceInterval]);

  const startStartCountdownInterval = useCallback(() => {
    clearStartCountdownInterval();
    startCountdownIntervalRef.current = setInterval(() => {
      const startMs = startTimeMsRef.current;
      if (startMs === null) return;
      const next = Math.max(0, Math.floor((startMs - Date.now()) / 1000));
      setStartCountdownSeconds(next);
      if (next === 0) clearStartCountdownInterval();
    }, 1000);
  }, [clearStartCountdownInterval]);

  const teardownSession = useCallback(
    async (disconnectSocket: boolean) => {
      try {
        clearStartCountdownInterval();
        clearGraceInterval();
        clearNavigateTimeout();
        chimeVideo.setTilesChangedHandler(null);
        chimeVideo.setErrorHandler(null);
        mediaLockedRef.current = false;
        if (bookingId && !sessionEndedRef.current) {
          chatSocket.leaveVideoSession(bookingId);
        }
        chatSocket.removeAllListeners();
        await chimeVideo.stopVideoSession();
        if (disconnectSocket) {
          chatSocket.disconnect();
        }
      } catch {
        // Never reject during teardown — unhandled rejections can white-screen RN.
        try {
          await chimeVideo.stopVideoSession();
        } catch {
          // ignore
        }
        if (disconnectSocket) {
          try {
            chatSocket.disconnect();
          } catch {
            // ignore
          }
        }
      }
    },
    [bookingId, clearGraceInterval, clearNavigateTimeout, clearStartCountdownInterval],
  );

  const finalizeSession = useCallback(async () => {
    await teardownSession(true);
  }, [teardownSession]);

  const { allowNextRemove } = useSessionLeaveGuard({
    enabled: !sessionEnded,
    title: leaveCallPrompt.title,
    message: leaveCallPrompt.message,
    onConfirmLeave: async () => {
      await finalizeSession();
    },
  });

  useEffect(() => {
    if (canJoinAvSessions()) return;
    Alert.alert(IOS_AV_UNAVAILABLE_TITLE, IOS_AV_UNAVAILABLE_MESSAGE, [
      {
        text: 'OK',
        onPress: () => {
          allowNextRemove();
          router.back();
        },
      },
    ]);
  }, [allowNextRemove, router]);

  const handleRefundComplete = useCallback(
    (message: string, coins: number) => {
      if (sessionEndedRef.current) return;
      sessionEndedRef.current = true;
      setRefundMessage(message);
      setRefundCoins(coins);
      clearStartCountdownInterval();
      clearGraceInterval();
      if (coins > 0) {
        const currentBalance = useAuthStore.getState().walletBalance ?? 0;
        setWalletBalance(currentBalance + coins);
      }
      allowNextRemove();
      void finalizeSession()
        .then(() => {
          router.replace('/(tabs)/experts');
        })
        .catch(() => {
          router.replace('/(tabs)/experts');
        });
    },
    [
      allowNextRemove,
      clearGraceInterval,
      clearStartCountdownInterval,
      finalizeSession,
      router,
      setWalletBalance,
    ],
  );

  const confirmGraceRefund = useCallback(() => {
    if (graceRefundPending || !bookingId) return;
    Alert.alert(
      'End session and get refund?',
      'You will receive a full refund if you end within the first 90 seconds.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'End & Refund',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setGraceRefundPending(true);
              try {
                await chatSocket.requestGraceRefund(bookingId);
              } catch (err) {
                const msg = err instanceof Error ? err.message : 'Grace refund failed';
                Alert.alert('Refund error', msg);
              } finally {
                setGraceRefundPending(false);
              }
            })();
          },
        },
      ],
    );
  }, [bookingId, graceRefundPending]);

  const handleSessionEnded = useCallback(async () => {
    if (sessionEndedRef.current) return;
    sessionEndedRef.current = true;
    try {
      clearStartCountdownInterval();
      clearGraceInterval();
      clearNavigateTimeout();
      mediaLockedRef.current = false;
      chimeVideo.setTilesChangedHandler(null);
      chimeVideo.setErrorHandler(null);
      if (bookingId) {
        chatSocket.leaveVideoSession(bookingId);
      }
      chatSocket.removeAllListeners();
      await chimeVideo.stopVideoSession();
      chatSocket.disconnect();
      setSessionEnded(true);
    } catch {
      try {
        await chimeVideo.stopVideoSession();
      } catch {
        // ignore
      }
      try {
        chatSocket.disconnect();
      } catch {
        // ignore
      }
      setSessionEnded(true);
    }
  }, [bookingId, clearGraceInterval, clearNavigateTimeout, clearStartCountdownInterval]);

  const handleLeave = useCallback(() => {
    Alert.alert(leaveCallPrompt.title, leaveCallPrompt.message, [
      { text: leaveCallPrompt.stay, style: 'cancel' },
      {
        text: leaveCallPrompt.leave,
        style: 'destructive',
        onPress: () => {
          allowNextRemove();
          void finalizeSession()
            .then(() => router.back())
            .catch(() => router.back());
        },
      },
    ]);
  }, [allowNextRemove, finalizeSession, router]);

  const toggleMute = useCallback(() => {
    if (!sessionMediaActive) return;
    setIsMuted((prev) => {
      const next = !prev;
      return chimeVideo.toggleMute(next) ? next : prev;
    });
  }, [sessionMediaActive]);

  const toggleCamera = useCallback(() => {
    const next = chimeVideo.toggleCamera();
    setIsCameraOn(next);
    if (bookingId) {
      chatSocket.emitVideoCameraState(bookingId, next);
    }
  }, [bookingId]);

  const handleFlipCamera = useCallback(() => {
    chimeVideo.flipCamera();
  }, []);

  const toggleFocusedView = useCallback(() => {
    if (pipDidDragRef.current) {
      pipDidDragRef.current = false;
      return;
    }
    setFocusedView((prev) => (prev === 'remote' ? 'local' : 'remote'));
  }, []);

  const pipPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pipDidDragRef.current = false;
        const base = pipPosition ?? cornerOffsets(pipCorner, screenW, bottomPanelHeight);
        pipDragStartRef.current = base;
      },
      onPanResponderMove: (_, gesture) => {
        if (!pipDragStartRef.current) return;
        if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) {
          pipDidDragRef.current = true;
        }
        setPipPosition({
          top: pipDragStartRef.current.top + gesture.dy,
          left: pipDragStartRef.current.left + gesture.dx,
        });
      },
      onPanResponderRelease: (_, gesture) => {
        if (!pipDragStartRef.current) return;
        const wasDrag = pipDidDragRef.current;
        const finalLeft = pipDragStartRef.current.left + gesture.dx;
        const finalTop = pipDragStartRef.current.top + gesture.dy;
        const corner = nearestCorner(
          finalLeft + PIP_WIDTH / 2,
          finalTop + PIP_HEIGHT / 2,
          screenW,
          Dimensions.get('window').height,
        );
        setPipCorner(corner);
        setPipPosition(null);
        pipDragStartRef.current = null;
        if (!wasDrag) {
          setFocusedView((prev) => (prev === 'remote' ? 'local' : 'remote'));
          setShowSwapHint(false);
        }
        pipDidDragRef.current = false;
      },
    }),
  ).current;

  const resizePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        resizeStartRef.current = { height: bottomPanelHeight };
      },
      onPanResponderMove: (_, gesture) => {
        if (!resizeStartRef.current) return;
        const maxH = Dimensions.get('window').height * MAX_BOTTOM_PANEL_RATIO;
        setBottomPanelHeight(
          Math.min(maxH, Math.max(MIN_BOTTOM_PANEL, resizeStartRef.current.height - gesture.dy)),
        );
      },
      onPanResponderRelease: () => {
        resizeStartRef.current = null;
      },
    }),
  ).current;

  useEffect(() => {
    sessionEndedRef.current = sessionEnded;
  }, [sessionEnded]);

  useEffect(() => {
    waitingForPanditRef.current = waitingForPandit;
  }, [waitingForPandit]);

  useEffect(() => {
    if (!waitingForPandit) {
      setWaitingElapsedSeconds(0);
      return;
    }
    setWaitingElapsedSeconds(0);
    const id = setInterval(() => {
      setWaitingElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [waitingForPandit]);

  useEffect(() => {
    waitingForStartRef.current = waitingForStart;
  }, [waitingForStart]);

  const handleSessionEndedRef = useRef(handleSessionEnded);
  const handleRefundCompleteRef = useRef(handleRefundComplete);
  const setConnectionStatusSafeRef = useRef(setConnectionStatusSafe);
  const clearStartCountdownIntervalRef = useRef(clearStartCountdownInterval);
  const startStartCountdownIntervalRef = useRef(startStartCountdownInterval);
  const startGraceIntervalRef = useRef(startGraceInterval);

  useEffect(() => {
    handleSessionEndedRef.current = handleSessionEnded;
    handleRefundCompleteRef.current = handleRefundComplete;
    setConnectionStatusSafeRef.current = setConnectionStatusSafe;
    clearStartCountdownIntervalRef.current = clearStartCountdownInterval;
    startStartCountdownIntervalRef.current = startStartCountdownInterval;
    startGraceIntervalRef.current = startGraceInterval;
  }, [
    handleSessionEnded,
    handleRefundComplete,
    setConnectionStatusSafe,
    clearStartCountdownInterval,
    startStartCountdownInterval,
    startGraceInterval,
  ]);

  const loginRedirectedRef = useRef(false);

  useEffect(() => {
    if (!canJoinAvSessions()) return;
    if (!authHydrated) return;
    if (!accessToken) {
      if (loginRedirectedRef.current) return;
      loginRedirectedRef.current = true;
      Alert.alert('Sign in required', 'Please log in to join the video session.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
      return;
    }
    if (!bookingId) return;

    let cancelled = false;

    chimeVideo.setTilesChangedHandler(({ localTileId: local, remoteTileId: remote }) => {
      if (!cancelled) {
        setLocalTileId(local);
        setRemoteTileId(remote);
      }
    });

    chimeVideo.setErrorHandler((message) => {
      if (cancelled) return;
      setInitError(message);
    });

    void (async () => {
      try {
        const res = await axios.post(
          `${getApiBase()}/sessions/video/create`,
          { bookingId },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (cancelled) return;
        await chimeVideo.startVideoSession(res.data.meeting, res.data.attendee);
        if (cancelled) return;

        setIsInitializing(false);
        setIsCameraOn(chimeVideo.isCameraOn());
        setIsMuted(true);

        chatSocket.connect(accessToken);
        chatSocket.joinVideoSession(
          bookingId,
          accessToken,
          () => {
            if (mediaLockedRef.current) return;
            waitingForPanditRef.current = true;
            waitingForStartRef.current = false;
            sessionActiveRef.current = false;
            setSessionMediaActive(false);
            setWaitingForPandit(true);
            setWaitingForStart(false);
            setStartsAt(null);
            startTimeMsRef.current = null;
            clearStartCountdownIntervalRef.current();
            setConnectionStatusSafeRef.current('Waiting for pandit to join…');
            chimeVideo.enterWaitingRoomMode();
          },
          ({ startsAt: startsAtIso }) => {
            if (mediaLockedRef.current) return;
            const startMs = Date.parse(startsAtIso);
            waitingForPanditRef.current = false;
            waitingForStartRef.current = true;
            sessionActiveRef.current = false;
            setSessionMediaActive(false);
            startTimeMsRef.current = Number.isNaN(startMs) ? null : startMs;
            setWaitingForPandit(false);
            setWaitingForStart(true);
            setStartsAt(startsAtIso);
            setConnectionStatusSafeRef.current('Pandit is ready — waiting for start time');
            chimeVideo.enterWaitingRoomMode();
            setStartCountdownSeconds(
              startTimeMsRef.current === null
                ? 0
                : Math.max(0, Math.floor((startTimeMsRef.current - Date.now()) / 1000)),
            );
            startStartCountdownIntervalRef.current();
          },
          ({ endTime, startedAt }) => {
            waitingForPanditRef.current = false;
            waitingForStartRef.current = false;
            sessionActiveRef.current = true;
            setWaitingForStart(false);
            setStartsAt(null);
            startTimeMsRef.current = null;
            clearStartCountdownIntervalRef.current();
            setWaitingForPandit(false);
            setSecondsRemaining(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));

            if (mediaLockedRef.current) {
              setConnectionStatusSafeRef.current('Connected');
              return;
            }

            mediaLockedRef.current = true;
            setSessionMediaActive(true);
            const startedMs =
              typeof startedAt === 'number'
                ? startedAt
                : typeof startedAt === 'string'
                  ? Date.parse(startedAt)
                  : Date.now();
            sessionStartedAtRef.current = Number.isNaN(startedMs) ? Date.now() : startedMs;
            setConnectionStatusSafeRef.current('Connected');
            chimeVideo.enableSessionMedia();
            setIsMuted(!chimeVideo.toggleMute(false));
            startGraceIntervalRef.current();
          },
          (seconds) => {
            if (!waitingForPanditRef.current && !waitingForStartRef.current) {
              setSecondsRemaining(seconds);
            }
          },
          // Last five minutes: offer the next session without leaving this call.
          () => {
            setShowExtendOffer(true);
          },
          () => {
            void handleSessionEndedRef.current().catch(() => {});
          },
          () => {
            void handleSessionEndedRef.current().catch(() => {});
          },
          () => {
            setPanditCameraOn(null);
            if (mediaLockedRef.current) {
              setConnectionStatusSafeRef.current(
                'They dropped off. Your paid time keeps running until they rejoin or the session ends.',
              );
              return;
            }
            if (sessionActiveRef.current) {
              setConnectionStatusSafeRef.current(
                'They dropped off. Your paid time keeps running until they rejoin or the session ends.',
              );
              return;
            }
            setWaitingForPandit(true);
            setConnectionStatusSafeRef.current('Waiting for pandit to join…');
            chimeVideo.enterWaitingRoomMode();
          },
          () => {
            setConnectionStatusSafeRef.current('Connected');
          },
          ({ coinsRefunded, message }) => {
            handleRefundCompleteRef.current(message, coinsRefunded);
          },
          (message) => {
            if (!sessionEndedRef.current) {
              handleRefundCompleteRef.current(message, 0);
            }
          },
          (message) => {
            Alert.alert('Session error', message);
          },
          (cameraOn) => {
            setPanditCameraOn(cameraOn);
          },
        );
      } catch (err) {
        if (cancelled) return;
        const message = formatApiConnectionError(err, getApiBase());
        setInitError(message);
        setIsInitializing(false);
        if (isMediaPermissionDeniedError(err)) {
          alertOpenSettingsForPermission(err.kind, () => {
            allowNextRemove();
            router.back();
          });
        } else {
          Alert.alert('Video session error', message, [
            {
              text: 'OK',
              onPress: () => {
                allowNextRemove();
                router.back();
              },
            },
          ]);
        }
      }
    })();

    return () => {
      cancelled = true;
      chimeVideo.setTilesChangedHandler(null);
      chimeVideo.setErrorHandler(null);
      if (bookingId && !sessionEndedRef.current) {
        try {
          chatSocket.leaveVideoSession(bookingId);
        } catch {
          // ignore leave errors during unmount
        }
      }
      try {
        chatSocket.removeAllListeners();
      } catch {
        // ignore
      }
      void chimeVideo.stopVideoSession().catch(() => {});
    };
  }, [accessToken, allowNextRemove, authHydrated, bookingId, router]);

  if (!authHydrated) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  if (!bookingId) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>Missing booking ID.</Text>
      </View>
    );
  }

  const mainIsLocal = focusedView === 'local';
  const pipPos = pipPosition ?? cornerOffsets(pipCorner, screenW, bottomPanelHeight);
  const callActive = sessionMediaActive && !waitingForPandit && !waitingForStart && !isInitializing;
  const remotePicture = remoteVideoPlaceholder(remoteTileId !== null, panditCameraOn);
  const remoteCameraOff = callActive && remotePicture === 'camera-off';
  const remoteVideoReconnecting = callActive && remotePicture === 'reconnecting';
  const showRemoteFallback =
    !mainIsLocal && !callActive && sessionMediaActive && remoteTileId === null && !isInitializing;
  const showLocalSlot = callActive || isCameraOn || localTileId !== null;
  const showLocalInPip = !mainIsLocal && showLocalSlot;
  const showRemoteInPip = mainIsLocal && (callActive || remoteTileId !== null);
  const hasPip = showLocalInPip || showRemoteInPip;
  const timerRunning = callActive && !waitingForPandit;
  const feedLabels = videoFeedLabels(mainIsLocal, panditName);
  const showConnectionStatus =
    isInitializing ||
    waitingForStart ||
    waitingForPandit ||
    connectionStatus !== 'Connected';

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.videoArea}>
        {sessionMediaActive && graceSecondsRemaining > 0 ? (
          <View style={styles.graceOverlay} pointerEvents="box-none">
            <GraceRefundLink
              pending={graceRefundPending}
              secondsLabel={formatMmSs(graceSecondsRemaining)}
              onPress={confirmGraceRefund}
              disabled={sessionEnded}
              tone="onVideo"
            />
          </View>
        ) : null}
        {remoteTileId !== null && sessionMediaActive ? (
          <VideoSurface
            tileId={remoteTileId}
            style={mainIsLocal ? [styles.localPip, { top: pipPos.top, left: pipPos.left }] : styles.remoteVideo}
          />
        ) : !mainIsLocal ? (
          remoteCameraOff ? (
            <View style={styles.cameraOffFull}>
              <Ionicons name="videocam-off" size={48} color={GREY_LABEL} />
              <Text style={styles.cameraOffLabel}>Camera off</Text>
            </View>
          ) : remoteVideoReconnecting ? (
            <View style={styles.cameraOffFull}>
              <Ionicons name="refresh" size={48} color={GREY_LABEL} />
              <Text style={styles.cameraOffLabel}>Reconnecting video…</Text>
            </View>
          ) : (
            <View style={styles.remoteFallback}>
              <View style={styles.avatarWrap}>
                <PulseRing visible={waitingForStart && !isInitializing} size={112} />
                <View style={styles.avatarRing}>
                  <View style={styles.avatarInner}>
                    <Text style={styles.avatarInitials}>{initialsFromName(panditName)}</Text>
                  </View>
                </View>
              </View>
              {showRemoteFallback || waitingForPandit || waitingForStart || isInitializing ? (
                waitingForPandit ? (
                  <WaitingForPanditStatus
                    elapsedSeconds={waitingElapsedSeconds}
                    headlineStyle={styles.waitingText}
                    detailStyle={styles.waitingDetail}
                  />
                ) : (
                  <Text style={styles.waitingText}>
                    {waitingForStart ? connectionStatus : 'Waiting for pandit video…'}
                  </Text>
                )
              ) : null}
            </View>
          )
        ) : remoteCameraOff ? (
          <View style={[styles.localPip, styles.cameraOffPip, { top: pipPos.top, left: pipPos.left }]}>
            <Ionicons name="videocam-off" size={28} color={GREY_LABEL} />
          </View>
        ) : remoteVideoReconnecting ? (
          <View style={[styles.localPip, styles.cameraOffPip, { top: pipPos.top, left: pipPos.left }]}>
            <Ionicons name="refresh" size={28} color={GREY_LABEL} />
          </View>
        ) : null}

        {localTileId !== null && isCameraOn ? (
          <VideoSurface
            tileId={localTileId}
            mirror
            style={mainIsLocal ? styles.remoteVideo : [styles.localPip, { top: pipPos.top, left: pipPos.left }]}
          />
        ) : !isCameraOn && showLocalSlot ? (
          mainIsLocal ? (
            <View style={styles.cameraOffFull}>
              <Ionicons name="videocam-off" size={48} color={GREY_LABEL} />
              <Text style={styles.cameraOffLabel}>Camera off</Text>
            </View>
          ) : (
            <View style={[styles.localPip, styles.cameraOffPip, { top: pipPos.top, left: pipPos.left }]}>
              <Ionicons name="videocam-off" size={28} color={GREY_LABEL} />
            </View>
          )
        ) : null}

        {hasPip ? (
          <View
            style={[styles.pipTapOverlay, { top: pipPos.top, left: pipPos.left }]}
            {...pipPanResponder.panHandlers}
            accessibilityRole="button"
            accessibilityLabel={
              mainIsLocal
                ? `Small picture of ${feedLabels.pip}. Tap to swap with the large view.`
                : 'Small picture of you. Tap to swap with the large view.'
            }
            accessibilityHint="Drag to move the small picture"
          />
        ) : null}

        {hasPip && showSwapHint ? (
          <View style={styles.swapHint} pointerEvents="none">
            <Text style={styles.swapHintText}>Tap the small picture to swap</Text>
          </View>
        ) : null}

        <View style={styles.mainName} pointerEvents="none">
          <Text style={styles.feedName} numberOfLines={1}>
            {feedLabels.main}
          </Text>
        </View>
        {hasPip ? (
          <View
            pointerEvents="none"
            style={[
              styles.pipName,
              { top: pipPos.top + PIP_HEIGHT - 28, left: pipPos.left + 6 },
            ]}
          >
            <Text style={styles.feedNamePip} numberOfLines={1}>
              {feedLabels.pip}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.bottomPanel, { height: bottomPanelHeight }]}>
        <View style={styles.resizeHandle} {...resizePanResponder.panHandlers}>
          <View style={styles.resizeHandleBar} />
        </View>

        <View style={styles.header}>
          <Text style={styles.panditName} numberOfLines={1}>
            {panditName}
          </Text>

          {isInitializing ? (
            <ActivityIndicator color={GOLD} style={styles.loader} />
          ) : waitingForStart && startsAt ? (
            <>
              <Text style={styles.sessionBeginsText}>
                Session begins at {formatStartTimeIst(startsAt)} IST
              </Text>
              <Text style={styles.timer}>{formatMmSs(startCountdownSeconds)}</Text>
              {showConnectionStatus ? (
                <Text style={styles.waitingText}>{connectionStatus}</Text>
              ) : null}
            </>
          ) : (
            <>
              {timerRunning ? (
                <Text style={styles.timer}>{formatMmSs(secondsRemaining)}</Text>
              ) : null}
              {showConnectionStatus ? (
                <Text style={styles.waitingText}>{connectionStatus}</Text>
              ) : null}
              <CallConnectionBanner
                active={sessionMediaActive && !waitingForPandit && !waitingForStart}
              />
            </>
          )}

          {initError ? <Text style={styles.errorText}>{initError}</Text> : null}
        </View>

        {showExtendOffer && !sessionEnded ? (
          <ExtendSessionOffer bookingId={bookingId} panditName={panditName} tone="dark" />
        ) : null}

        <View style={styles.controls}>
          <View style={styles.controlItem}>
            <TouchableOpacity
              style={[styles.controlBtn, !sessionMediaActive && styles.controlBtnDisabled]}
              onPress={toggleMute}
              disabled={isInitializing || sessionEnded || !sessionMediaActive}
              accessibilityRole="button"
              accessibilityState={{ disabled: !sessionMediaActive, selected: isMuted }}
              accessibilityLabel={isMuted ? 'Microphone off. Turn microphone on' : 'Microphone on. Mute microphone'}
            >
              <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={28} color={WHITE} />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>{isMuted ? 'Muted' : 'Mic'}</Text>
          </View>

          <View style={styles.controlItem}>
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={toggleCamera}
              disabled={isInitializing || sessionEnded}
              accessibilityRole="button"
              accessibilityState={{ selected: isCameraOn }}
              accessibilityLabel={isCameraOn ? 'Camera on. Turn camera off' : 'Camera off. Turn camera on'}
            >
              <Ionicons name={isCameraOn ? 'videocam' : 'videocam-off'} size={28} color={WHITE} />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>{isCameraOn ? 'Camera' : 'Camera off'}</Text>
          </View>

          <View style={styles.controlItem}>
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={handleFlipCamera}
              disabled={isInitializing || sessionEnded || !isCameraOn}
              accessibilityRole="button"
              accessibilityLabel="Flip camera"
            >
              <Ionicons name="camera-reverse" size={28} color={WHITE} />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>Flip</Text>
          </View>

          <View style={styles.controlItem}>
            <TouchableOpacity
              style={styles.endCallBtn}
              onPress={handleLeave}
              disabled={isInitializing || sessionEnded}
              accessibilityRole="button"
              accessibilityLabel="Leave call"
              accessibilityHint={leaveCallPrompt.message}
            >
              <Ionicons name="call" size={28} color={WHITE} style={styles.endCallIcon} />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>Leave</Text>
          </View>
        </View>
      </View>

      {sessionEnded ? (
        <View style={styles.endedOverlay}>
          <View style={styles.endedCard}>
            <Text style={styles.endedTitle}>Session ended</Text>
            {bookingId ? <PostCallRating bookingId={bookingId} /> : null}
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                allowNextRemove();
                router.replace('/(tabs)/home');
              }}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <Modal visible={refundMessage !== null} transparent animationType="fade">
        <View style={styles.endedOverlay}>
          <View style={styles.endedCard}>
            <Text style={styles.endedTitle}>Refund Issued</Text>
            <Text style={styles.refundMessage}>{refundMessage}</Text>
            {refundCoins > 0 ? (
              <Text style={styles.refundCoins}>{refundCoins} coins refunded</Text>
            ) : null}
            <TouchableOpacity
              style={styles.refundOkBtn}
              onPress={() => router.replace('/(tabs)/experts')}
            >
              <Text style={styles.refundOkText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VIDEO_BG,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoArea: {
    flex: 1,
    backgroundColor: VIDEO_BG,
    position: 'relative',
  },
  graceOverlay: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 5,
    alignItems: 'center',
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  remoteFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: SESSION_BG,
  },
  localPip: {
    position: 'absolute',
    width: PIP_WIDTH,
    height: PIP_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: GOLD,
    backgroundColor: SESSION_BG,
    zIndex: 2,
  },
  pipTapOverlay: {
    position: 'absolute',
    width: PIP_WIDTH,
    height: PIP_HEIGHT,
    zIndex: 3,
  },
  swapHint: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4,
  },
  swapHintText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.55)',
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mainName: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    zIndex: 4,
    maxWidth: '70%',
  },
  pipName: {
    position: 'absolute',
    zIndex: 4,
    maxWidth: PIP_WIDTH - 12,
  },
  feedName: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.55)',
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  feedNamePip: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.55)',
    overflow: 'hidden',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pipTouchable: {
    flex: 1,
  },
  localVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bottomPanel: {
    backgroundColor: SESSION_BG,
    flexShrink: 0,
  },
  resizeHandle: {
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SESSION_SURFACE,
  },
  resizeHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: SESSION_PANEL,
  },
  header: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panditName: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
    textAlign: 'center',
  },
  cameraOffFull: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SESSION_BG,
    gap: 12,
  },
  cameraOffLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: GREY_LABEL,
  },
  cameraOffPip: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  avatarWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: SESSION_CARD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '700',
    color: GOLD,
  },
  sessionBeginsText: {
    fontSize: 13,
    fontWeight: '600',
    color: WHITE,
    opacity: 0.9,
    marginBottom: 6,
    textAlign: 'center',
  },
  timer: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD,
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  loader: {
    marginVertical: 8,
  },
  waitingText: {
    fontSize: 13,
    color: GREY_LABEL,
    marginTop: 4,
    textAlign: 'center',
  },
  waitingDetail: {
    fontSize: 12,
    color: GREY_LABEL,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12,
  },
  errorText: {
    fontSize: 13,
    color: SESSION_RED,
    marginTop: 4,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },
  controlItem: {
    alignItems: 'center',
    minWidth: 64,
  },
  controlLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: WHITE,
    textAlign: 'center',
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnDisabled: {
    opacity: 0.45,
  },
  endCallBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: SESSION_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endCallIcon: {
    transform: [{ rotate: '135deg' }],
  },
  endedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SCRIM_BLACK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endedCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 32,
    minWidth: 200,
    alignItems: 'center',
  },
  endedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 8,
  },
  doneBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  doneBtnText: {
    color: TEXT_PRIMARY_DARK,
    fontSize: 15,
    fontWeight: '700',
  },
  refundMessage: {
    fontSize: 14,
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  refundCoins: {
    fontSize: 15,
    fontWeight: '700',
    color: GOLD,
    marginBottom: 16,
  },
  refundOkBtn: {
    backgroundColor: SESSION_BG,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  refundOkText: {
    color: WHITE,
    fontWeight: '600',
  },
});
