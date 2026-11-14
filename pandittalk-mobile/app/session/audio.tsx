import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Switch,
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
  SESSION_RED,
  TEXT_PRIMARY_DARK,
  WHITE,
} from '@/constants/Colors';
import { useSessionKeepAwake } from '@/hooks/useSessionKeepAwake';
import { PulseRing } from '@/components/session/PulseRing';
import { WaitingForPanditStatus } from '@/components/session/WaitingForPanditStatus';
import { formatApiConnectionError, getApiBase } from '@/lib/authApi';
import { useSessionLeaveGuard } from '@/hooks/useSessionLeaveGuard';
import { chatSocket } from '@/lib/chatSocket';
import { chimeAudio } from '@/lib/chimeAudio';
import { shouldKeepScreenAwake } from '@/lib/screenAwake';
import { leaveCallPrompt } from '@/lib/sessionLeaveCopy';
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

const IST = 'Asia/Kolkata';
const GRACE_PERIOD_SECONDS = 90;

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

export default function AudioSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const authHydrated = useAuthStore((s) => s.authHydrated);
  const setWalletBalance = useAuthStore((s) => s.setWalletBalance);

  const raw = useLocalSearchParams<{ bookingId: string; panditName: string }>();
  const bookingId = paramString(raw.bookingId);
  const panditName = paramString(raw.panditName) || 'Pandit';

  const [keepScreenOn, setKeepScreenOn] = useState(false);
  const [showExtendOffer, setShowExtendOffer] = useState(false);
  useSessionKeepAwake('audio-session', shouldKeepScreenAwake('audio', keepScreenOn));

  const [waitingForPandit, setWaitingForPandit] = useState(true);
  const [waitingElapsedSeconds, setWaitingElapsedSeconds] = useState(0);
  const [waitingForStart, setWaitingForStart] = useState(false);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [startCountdownSeconds, setStartCountdownSeconds] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [graceSecondsRemaining, setGraceSecondsRemaining] = useState(0);
  const [graceRefundPending, setGraceRefundPending] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionMediaActive, setSessionMediaActive] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [receivingPanditAudio, setReceivingPanditAudio] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting…');
  const [refundMessage, setRefundMessage] = useState<string | null>(null);
  const [refundCoins, setRefundCoins] = useState(0);

  const sessionEndedRef = useRef(false);
  const sessionActiveRef = useRef(false);
  const mediaLockedRef = useRef(false);
  const connectionStatusRef = useRef('Connecting…');
  const sessionStartedAtRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const startTimeMsRef = useRef<number | null>(null);
  const startCountdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const graceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitingForPanditRef = useRef(true);
  const waitingForStartRef = useRef(false);

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

  const clearGraceInterval = useCallback(() => {
    if (graceIntervalRef.current) {
      clearInterval(graceIntervalRef.current);
      graceIntervalRef.current = null;
    }
  }, []);

  const clearNavigateTimeout = useCallback(() => {
    if (navigateTimeoutRef.current) {
      clearTimeout(navigateTimeoutRef.current);
      navigateTimeoutRef.current = null;
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
      if (remaining === 0) {
        clearGraceInterval();
      }
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
      if (next === 0) {
        clearStartCountdownInterval();
      }
    }, 1000);
  }, [clearStartCountdownInterval]);

  const teardownSession = useCallback(
    async (disconnectSocket: boolean) => {
      try {
        clearStartCountdownInterval();
        clearGraceInterval();
        clearNavigateTimeout();
        chimeAudio.setRemoteVolumeHandler(null);
        mediaLockedRef.current = false;
        if (bookingId && !sessionEndedRef.current) {
          chatSocket.leaveAudioSession(bookingId);
        }
        chatSocket.removeAllListeners();
        await chimeAudio.stopSession();
        if (disconnectSocket) {
          chatSocket.disconnect();
        }
      } catch {
        // Never reject during teardown — unhandled rejections can white-screen RN.
        try {
          await chimeAudio.stopSession();
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

  const handleAutoEnd = useCallback(() => {
    if (sessionEndedRef.current) return;
    sessionEndedRef.current = true;
    setSessionEnded(true);
    clearStartCountdownInterval();
    clearGraceInterval();
    void finalizeSession().catch(() => {});
  }, [clearGraceInterval, clearStartCountdownInterval, finalizeSession]);

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

  const toggleMute = useCallback(() => {
    if (!sessionMediaActive) return;
    setIsMuted((prev) => {
      const next = !prev;
      return chimeAudio.setMuted(next) ? next : prev;
    });
  }, [sessionMediaActive]);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => {
      const next = !prev;
      chimeAudio.setSpeakerOn(next);
      return next;
    });
  }, []);

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

  const handleAutoEndRef = useRef(handleAutoEnd);
  const handleRefundCompleteRef = useRef(handleRefundComplete);
  const setConnectionStatusSafeRef = useRef(setConnectionStatusSafe);
  const clearStartCountdownIntervalRef = useRef(clearStartCountdownInterval);
  const startStartCountdownIntervalRef = useRef(startStartCountdownInterval);
  const startGraceIntervalRef = useRef(startGraceInterval);

  useEffect(() => {
    handleAutoEndRef.current = handleAutoEnd;
    handleRefundCompleteRef.current = handleRefundComplete;
    setConnectionStatusSafeRef.current = setConnectionStatusSafe;
    clearStartCountdownIntervalRef.current = clearStartCountdownInterval;
    startStartCountdownIntervalRef.current = startStartCountdownInterval;
    startGraceIntervalRef.current = startGraceInterval;
  }, [
    handleAutoEnd,
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
      Alert.alert('Sign in required', 'Please log in to join the audio session.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
      return;
    }
    if (!bookingId) return;

    let cancelled = false;

    void (async () => {
      try {
        const res = await axios.post(
          `${getApiBase()}/sessions/audio/create`,
          { bookingId },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (cancelled) return;

        chimeAudio.setRemoteVolumeHandler(({ volume, muted }) => {
          if (!cancelled && sessionActiveRef.current) {
            setReceivingPanditAudio(!muted && volume > 0);
          }
        });

        await chimeAudio.startSession(res.data.meeting, res.data.attendee);
        if (cancelled) return;

        setIsInitializing(false);
        setIsMuted(true);

        chatSocket.connect(accessToken);
        chatSocket.joinAudioSession(
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
            endTimeRef.current = null;
            clearStartCountdownIntervalRef.current();
            setConnectionStatusSafeRef.current('Waiting for pandit to join…');
            setReceivingPanditAudio(false);
            chimeAudio.enterWaitingRoomMode();
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
            endTimeRef.current = null;
            setConnectionStatusSafeRef.current('Pandit is ready — waiting for start time');
            setReceivingPanditAudio(false);
            chimeAudio.enterWaitingRoomMode();
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
            endTimeRef.current = endTime;
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
            chimeAudio.enableSessionMedia();
            setIsMuted(!chimeAudio.setMuted(false));
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
            handleAutoEndRef.current();
          },
          () => {
            handleAutoEndRef.current();
          },
          () => {
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
            chimeAudio.enterWaitingRoomMode();
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
          Alert.alert('Audio session error', message, [
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
      chimeAudio.setRemoteVolumeHandler(null);
      if (bookingId && !sessionEndedRef.current) {
        try {
          chatSocket.leaveAudioSession(bookingId);
        } catch {
          // ignore leave errors during unmount
        }
      }
      try {
        chatSocket.removeAllListeners();
      } catch {
        // ignore
      }
      void chimeAudio.stopSession().catch(() => {});
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

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.panditName} numberOfLines={1}>
          {panditName}
        </Text>
        {sessionMediaActive && graceSecondsRemaining > 0 ? (
          <GraceRefundLink
            pending={graceRefundPending}
            secondsLabel={formatMmSs(graceSecondsRemaining)}
            onPress={confirmGraceRefund}
            disabled={sessionEnded}
            tone="onDark"
          />
        ) : null}
      </View>

      <View
        style={styles.mainArea}
        accessibilityRole="summary"
        accessibilityLabel={`Voice session with ${panditName}`}
      >
        <View style={styles.avatarWrap}>
          <PulseRing visible={waitingForStart && !isInitializing} size={132} />
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{initialsFromName(panditName)}</Text>
            </View>
          </View>
        </View>

        {isInitializing ? (
          <ActivityIndicator color={GOLD} style={styles.loader} />
        ) : waitingForStart && startsAt ? (
          <>
            <Text style={styles.sessionBeginsText}>
              Session begins at {formatStartTimeIst(startsAt)} IST
            </Text>
            <Text style={styles.timer}>{formatMmSs(startCountdownSeconds)}</Text>
            {(isInitializing ||
              waitingForStart ||
              waitingForPandit ||
              connectionStatus !== 'Connected') &&
              (waitingForPandit ? (
                <WaitingForPanditStatus
                  elapsedSeconds={waitingElapsedSeconds}
                  headlineStyle={styles.waitingText}
                  detailStyle={styles.waitingDetail}
                />
              ) : (
                <Text style={styles.waitingText}>{connectionStatus}</Text>
              ))}
          </>
        ) : (
          <>
            {!waitingForPandit ? (
              <Text style={styles.timer}>{formatMmSs(secondsRemaining)}</Text>
            ) : null}
            {(isInitializing ||
              waitingForStart ||
              waitingForPandit ||
              connectionStatus !== 'Connected') &&
              (waitingForPandit ? (
                <WaitingForPanditStatus
                  elapsedSeconds={waitingElapsedSeconds}
                  headlineStyle={styles.waitingText}
                  detailStyle={styles.waitingDetail}
                />
              ) : (
                <Text style={styles.waitingText}>{connectionStatus}</Text>
              ))}
            {sessionMediaActive && !waitingForPandit && !waitingForStart && !isInitializing ? (
              <Text style={styles.remoteAudioText}>{remoteAudioStatus(receivingPanditAudio)}</Text>
            ) : null}
            <CallConnectionBanner
              active={sessionMediaActive && !waitingForPandit && !waitingForStart && !isInitializing}
            />
          </>
        )}

        {initError ? <Text style={styles.errorText}>{initError}</Text> : null}
      </View>

      {showExtendOffer && !sessionEnded ? (
        <ExtendSessionOffer bookingId={bookingId} panditName={panditName} tone="dark" />
      ) : null}

      <View style={styles.screenAwakeRow}>
        <View style={styles.screenAwakeCopy}>
          <Text style={styles.screenAwakeLabel}>Keep screen on</Text>
          <Text style={styles.screenAwakeHint}>Off lets the screen dim. The call keeps going.</Text>
        </View>
        <Switch
          value={keepScreenOn}
          onValueChange={setKeepScreenOn}
          accessibilityLabel="Keep screen on"
          accessibilityHint="Off lets the screen dim. The call keeps going."
        />
      </View>

      <View style={styles.controls}>
        <View style={styles.controlItem}>
          <View style={styles.controlSlot}>
            <TouchableOpacity
              style={[styles.controlBtn, !sessionMediaActive && styles.controlBtnDisabled]}
              onPress={toggleMute}
              disabled={isInitializing || sessionEnded || !sessionMediaActive}
              accessibilityRole="button"
              accessibilityLabel={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={28} color={WHITE} />
            </TouchableOpacity>
          </View>
          <Text style={styles.controlLabel}>{isMuted ? 'Muted' : 'Mic'}</Text>
        </View>

        <View style={styles.controlItem}>
          <View style={styles.controlSlot}>
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={toggleSpeaker}
              disabled={isInitializing || sessionEnded}
              accessibilityRole="button"
              accessibilityLabel={isSpeakerOn ? 'Speaker on. Switch to earpiece' : 'Earpiece on. Switch to speaker'}
            >
              <Ionicons
                name={isSpeakerOn ? 'volume-high' : 'ear-outline'}
                size={28}
                color={WHITE}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.controlLabel}>{isSpeakerOn ? 'Speaker' : 'Earpiece'}</Text>
        </View>

        <View style={styles.controlItem}>
          <View style={styles.controlSlot}>
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
          </View>
          <Text style={styles.controlLabel}>Leave</Text>
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
    backgroundColor: SESSION_BG,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mainArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  panditName: {
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
    textAlign: 'center',
  },
  avatarWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: SESSION_CARD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: GOLD,
  },
  sessionBeginsText: {
    fontSize: 15,
    fontWeight: '600',
    color: WHITE,
    opacity: 0.9,
    marginBottom: 12,
    textAlign: 'center',
  },
  timer: {
    fontSize: 40,
    fontWeight: '700',
    color: GOLD,
    fontVariant: ['tabular-nums'],
    marginBottom: 12,
  },
  loader: {
    marginVertical: 16,
  },
  waitingText: {
    fontSize: 15,
    color: GREY_LABEL,
    marginTop: 8,
    textAlign: 'center',
  },
  waitingDetail: {
    fontSize: 12,
    color: GREY_LABEL,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 16,
  },
  remoteAudioText: {
    fontSize: 14,
    color: GREY_LABEL,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: SESSION_RED,
    marginTop: 12,
    textAlign: 'center',
  },
  screenAwakeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  screenAwakeCopy: {
    flex: 1,
  },
  screenAwakeLabel: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '700',
  },
  screenAwakeHint: {
    color: GREY_LABEL,
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-evenly',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  controlItem: {
    alignItems: 'center',
    minWidth: 76,
  },
  controlSlot: {
    height: 64,
    justifyContent: 'center',
  },
  controlLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: WHITE,
    textAlign: 'center',
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnDisabled: {
    opacity: 0.45,
  },
  endCallBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    minWidth: 260,
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
