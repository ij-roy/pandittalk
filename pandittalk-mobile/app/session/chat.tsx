import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AndroidSoftInputModes,
  KeyboardController,
  KeyboardEvents,
  KeyboardStickyView,
  useKeyboardState,
} from 'react-native-keyboard-controller';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ChatPanditCard } from '@/components/session/ChatPanditCard';
import { ExtendSessionOffer } from '@/components/session/ExtendSessionOffer';
import { PostCallRating } from '@/components/session/PostCallRating';
import { GraceRefundLink } from '@/components/session/GraceRefundLink';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AVAILABLE_GREEN,
  BG,
  DEEP_GREY,
  GOLD,
  GREY_LABEL,
  HEADER_RULE_GREY,
  MUTED_GREY,
  SCRIM_BLACK,
  SESSION_RED,
  SHADOW_BLACK,
  SOFT_YELLOW,
  TEXT_PRIMARY_DARK,
  WARNING_BANNER_BG,
  WHITE,
} from '@/constants/Colors';
import { WaitingForPanditStatus } from '@/components/session/WaitingForPanditStatus';
import { getBookingById } from '@/lib/bookingApi';
import { blockPandit } from '@/lib/blockedPandits';
import { useSessionLeaveGuard } from '@/hooks/useSessionLeaveGuard';
import { isJoinableChatBooking } from '@/lib/chatBookingStatus';
import { chatSocket, type ChatMessage, type ConnectionStatus } from '@/lib/chatSocket';
import { chatEndSummary } from '@/lib/chatEndSummary';
import { ownMessageStatus } from '@/lib/messageStatus';
import { mergeEarlierMessages } from '@/lib/chatHistory';
import { formatCoins } from '@/lib/bookingPricing';
import { EntertainmentDisclaimer } from '@/components/EntertainmentDisclaimer';
import { reportPandit, reportChatMessage } from '@/lib/supportApi';
import { formatElapsedMmSs } from '@/lib/waitingRoomEta';
import { shouldEmitTyping, TYPING_HIDE_AFTER_MS } from '@/lib/typingIndicator';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveChatViewStore } from '@/store/useActiveChatViewStore';

const DISCONNECT_WAIT_SECONDS = 60;

const QUICK_REPLIES = [
  'What should I focus on first?',
  'Can you explain that more simply?',
  'What should I do this week?',
  'Is there a remedy for this?',
] as const;
const GRACE_PERIOD_SECONDS = 90;
const WARNING_SECONDS = 300;
/** Room for composer above last message in FlatList. */
const COMPOSER_CLEARANCE = 72;

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

function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

type TypingDotsProps = {
  visible: boolean;
  panditName: string;
};

function TypingDots({ visible, panditName }: TypingDotsProps) {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    if (!visible) return;
    const pulse = (value: SharedValue<number>, delay: number) => {
      value.value = withDelay(
        delay,
        withRepeat(
          withSequence(withTiming(1, { duration: 280 }), withTiming(0.3, { duration: 280 })),
          -1,
          false,
        ),
      );
    };
    pulse(dot1, 0);
    pulse(dot2, 140);
    pulse(dot3, 280);
  }, [visible, dot1, dot2, dot3]);

  const style1 = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const style2 = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const style3 = useAnimatedStyle(() => ({ opacity: dot3.value }));

  if (!visible) return null;

  return (
    <View style={styles.typingRow}>
      <View style={styles.typingBubble}>
        <Text style={styles.typingLabel}>{panditName} is typing</Text>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.typingDot, style1]} />
          <Animated.View style={[styles.typingDot, style2]} />
          <Animated.View style={[styles.typingDot, style3]} />
        </View>
      </View>
    </View>
  );
}

type RefundInfo = {
  coinsRefunded: number;
  message: string;
};

type RefundModalProps = {
  visible: boolean;
  refundInfo: RefundInfo;
  onBackToHome: () => void;
};

function RefundModal({ visible, refundInfo, onBackToHome }: RefundModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onBackToHome}>
      <View style={styles.endedOverlay}>
        <View style={styles.endedCard}>
          <View style={styles.refundIconWrap}>
            <Text style={styles.refundIconText}>₹</Text>
          </View>
          <Text style={styles.endedTitle}>Session Ended</Text>
          <Text style={styles.endedSubtitle}>{refundInfo.message}</Text>
          <Text style={styles.refundCoinsText}>
            {formatCoins(refundInfo.coinsRefunded)} coins refunded
          </Text>
          <TouchableOpacity style={styles.rateBtn} onPress={onBackToHome} activeOpacity={0.85}>
            <Text style={styles.rateBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

type MessageBubbleProps = {
  message: ChatMessage;
  panditName: string;
  isUser: boolean;
  onLongPress: () => void;
};

function MessageBubble({ message, panditName, isUser, onLongPress }: MessageBubbleProps) {
  const status = isUser ? ownMessageStatus(message.pending === true) : null;
  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="text"
      accessibilityLabel={status ? `${status}. ${message.text}` : message.text}
      accessibilityHint="Long press to copy or report"
      style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowPandit]}
    >
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubblePandit]}>
        {!isUser ? (
          <Text style={styles.senderName}>{message.senderName ?? panditName}</Text>
        ) : null}
        <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextPandit]}>
          {message.text}
        </Text>
        <Text style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampPandit]}>
          {status === 'Sending'
            ? 'Sending'
            : status === 'Sent'
              ? `Sent · ${formatMessageTime(message.createdAt)}`
              : formatMessageTime(message.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ChatSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const authHydrated = useAuthStore((s) => s.authHydrated);
  const setWalletBalance = useAuthStore((s) => s.setWalletBalance);

  const raw = useLocalSearchParams<{
    bookingId: string;
    panditName: string;
    panditId: string;
    durationMinutes: string;
    area: string;
    format: string;
  }>();

  const bookingId = paramString(raw.bookingId);
  const panditName = paramString(raw.panditName) || 'Pandit';
  const panditId = paramString(raw.panditId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasEarlier, setHasEarlier] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [waitingForPandit, setWaitingForPandit] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showWarningBanner, setShowWarningBanner] = useState(false);
  const [isPanditTyping, setIsPanditTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [draft, setDraft] = useState('');
  const [refundInfo, setRefundInfo] = useState<RefundInfo | null>(null);
  const [panditDisconnected, setPanditDisconnected] = useState(false);
  const [disconnectCountdown, setDisconnectCountdown] = useState(DISCONNECT_WAIT_SECONDS);
  const [waitingElapsedSeconds, setWaitingElapsedSeconds] = useState(0);
  const [graceSecondsRemaining, setGraceSecondsRemaining] = useState(0);
  const [graceRefundPending, setGraceRefundPending] = useState(false);
  const [bookingGate, setBookingGate] = useState<'pending' | 'joinable' | 'ended'>('pending');
  const [profileOpen, setProfileOpen] = useState(false);

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitAtRef = useRef<number | null>(null);
  const skipNextScrollRef = useRef(false);
  const sessionEndedRef = useRef(false);
  const endTimeRef = useRef<number | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const graceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const disconnectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waitingElapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waitingForPanditRef = useRef(true);
  const graceEndedFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearGraceEndedFallback = useCallback(() => {
    if (graceEndedFallbackRef.current) {
      clearTimeout(graceEndedFallbackRef.current);
      graceEndedFallbackRef.current = null;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const handleSessionEnded = useCallback(() => {
    if (sessionEndedRef.current) return;
    sessionEndedRef.current = true;
    setSessionEnded(true);
    setIsPanditTyping(false);
    if (bookingId) {
      chatSocket.clearBackgroundBooking(bookingId);
    }
  }, [bookingId]);

  const clearDisconnectInterval = useCallback(() => {
    if (disconnectIntervalRef.current) {
      clearInterval(disconnectIntervalRef.current);
      disconnectIntervalRef.current = null;
    }
  }, []);

  const clearWaitingElapsedInterval = useCallback(() => {
    if (waitingElapsedIntervalRef.current) {
      clearInterval(waitingElapsedIntervalRef.current);
      waitingElapsedIntervalRef.current = null;
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
      if (remaining === 0) {
        clearGraceInterval();
      }
    };
    tick();
    graceIntervalRef.current = setInterval(tick, 1000);
  }, [clearGraceInterval]);

  const clearDisconnectBanner = useCallback(() => {
    clearDisconnectInterval();
    setPanditDisconnected(false);
    setDisconnectCountdown(DISCONNECT_WAIT_SECONDS);
  }, [clearDisconnectInterval]);

  const handleRefund = useCallback(
    (coinsRefunded: number, message: string) => {
      if (sessionEndedRef.current) return;
      try {
        clearGraceEndedFallback();
        clearDisconnectBanner();
        clearGraceInterval();
        setRefundInfo({ coinsRefunded, message });
        handleSessionEnded();
        const currentBalance = useAuthStore.getState().walletBalance ?? 0;
        setWalletBalance(currentBalance + coinsRefunded);
        chatSocket.removeAllListeners();
        chatSocket.disconnect();
        router.replace('/(tabs)/home');
      } catch {
        try {
          chatSocket.disconnect();
        } catch {
          // ignore
        }
        router.replace('/(tabs)/home');
      }
    },
    [clearDisconnectBanner, clearGraceEndedFallback, clearGraceInterval, handleSessionEnded, router, setWalletBalance],
  );

  const handlePanditDisconnected = useCallback((reconnectSeconds = DISCONNECT_WAIT_SECONDS) => {
    setPanditDisconnected(true);
    setDisconnectCountdown(reconnectSeconds);
    clearDisconnectInterval();
    disconnectIntervalRef.current = setInterval(() => {
      setDisconnectCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
  }, [clearDisconnectInterval]);

  const handleRefundRef = useRef(handleRefund);
  const handleSessionEndedRef = useRef(handleSessionEnded);
  const handlePanditDisconnectedRef = useRef(handlePanditDisconnected);
  const startGraceIntervalRef = useRef(startGraceInterval);
  const clearGraceIntervalRef = useRef(clearGraceInterval);
  const clearWaitingElapsedIntervalRef = useRef(clearWaitingElapsedInterval);

  useEffect(() => {
    handleRefundRef.current = handleRefund;
    handleSessionEndedRef.current = handleSessionEnded;
    handlePanditDisconnectedRef.current = handlePanditDisconnected;
    startGraceIntervalRef.current = startGraceInterval;
    clearGraceIntervalRef.current = clearGraceInterval;
    clearWaitingElapsedIntervalRef.current = clearWaitingElapsedInterval;
  }, [
    handleRefund,
    handleSessionEnded,
    handlePanditDisconnected,
    startGraceInterval,
    clearGraceInterval,
    clearWaitingElapsedInterval,
  ]);

  const { allowNextRemove } = useSessionLeaveGuard({
    enabled: !sessionEnded,
    title: leaveChatPrompt.title,
    message: leaveChatPrompt.message,
    confirmLabel: leaveChatPrompt.leave,
    onConfirmLeave: async () => {
      if (bookingId && !sessionEndedRef.current) {
        chatSocket.leaveSession(bookingId);
      }
    },
  });

  const backgroundChatSession = useCallback(() => {
    if (!bookingId || sessionEndedRef.current) return;
    chatSocket.leaveSession(bookingId);
    allowNextRemove();
    router.replace('/(tabs)/home');
  }, [allowNextRemove, bookingId, router]);

  const handleBackPress = useCallback(() => {
    if (sessionEndedRef.current) {
      allowNextRemove();
      router.back();
      return;
    }
    backgroundChatSession();
  }, [allowNextRemove, backgroundChatSession, router]);

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
              } catch {
                chatSocket.endSession(bookingId);
              } finally {
                setGraceRefundPending(false);
              }
            })();
          },
        },
      ],
    );
  }, [bookingId, graceRefundPending]);

  const confirmEndSession = useCallback(() => {
    if (waitingForPanditRef.current) {
      Alert.alert(
        'Are you sure?',
        "If pandit hasn't joined, you'll receive a full refund.",
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            style: 'destructive',
            onPress: () => {
              chatSocket.endSession(bookingId);
            },
          },
        ],
      );
      return;
    }

    Alert.alert(endChatPrompt.title, endChatPrompt.message, [
      { text: endChatPrompt.cancel, style: 'cancel' },
      {
        text: endChatPrompt.end,
        style: 'destructive',
        onPress: () => {
          chatSocket.endSession(bookingId);
        },
      },
    ]);
  }, [bookingId]);

  useEffect(() => {
    sessionEndedRef.current = sessionEnded;
  }, [sessionEnded]);

  useEffect(() => {
    waitingForPanditRef.current = waitingForPandit;
  }, [waitingForPandit]);

  useEffect(() => {
    if (!waitingForPandit) {
      clearWaitingElapsedInterval();
      return;
    }

    setWaitingElapsedSeconds(0);
    clearWaitingElapsedInterval();
    waitingElapsedIntervalRef.current = setInterval(() => {
      setWaitingElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearWaitingElapsedInterval();
    };
  }, [clearWaitingElapsedInterval, waitingForPandit]);

  const loginRedirectedRef = useRef(false);

  useEffect(() => {
    if (!authHydrated) return;
    if (!bookingId || !accessToken) return;
    let cancelled = false;
    void getBookingById(bookingId)
      .then((booking) => {
        if (cancelled) return;
        if (!isJoinableChatBooking(booking)) {
          handleSessionEnded();
          setBookingGate('ended');
        } else {
          setBookingGate('joinable');
        }
      })
      .catch(() => {
        if (cancelled) return;
        handleSessionEnded();
        setBookingGate('ended');
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, authHydrated, bookingId, handleSessionEnded]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      KeyboardController.setInputMode(AndroidSoftInputModes.SOFT_INPUT_ADJUST_NOTHING);
      return () => {
        KeyboardController.setDefaultMode();
      };
    }, []),
  );

  useEffect(() => {
    const showSub = KeyboardEvents.addListener('keyboardDidShow', scrollToBottom);
    return () => showSub.remove();
  }, [scrollToBottom]);

  useEffect(() => {
    if (!authHydrated) return;
    if (!accessToken) {
      if (loginRedirectedRef.current) return;
      loginRedirectedRef.current = true;
      Alert.alert('Sign in required', 'Please log in to join the chat session.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
      return;
    }
    if (!bookingId || bookingGate !== 'joinable') return;

    chatSocket.setConnectionStatusHandler(setConnectionStatus);
    chatSocket.connect(accessToken);
    chatSocket.joinSession(
      bookingId,
      (history, hasMore) => {
        setHasEarlier(hasMore === true);
        setLoadingEarlier(false);
        setMessages((prev) => {
          const pending = prev.filter((message) => message.pending);
          const stillPending = pending.filter(
            (message) =>
              !history.some(
                (saved) => saved.senderRole === 'user' && saved.text === message.text,
              ),
          );
          return [...history, ...stillPending];
        });
        listRef.current?.scrollToEnd({ animated: true });
      },
      (message) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          const withoutMatch = prev.filter(
            (item) =>
              !(item.pending && item.senderRole === message.senderRole && item.text === message.text),
          );
          return [...withoutMatch, message];
        });
        if (message.senderRole === 'pandit') {
          setIsPanditTyping(false);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
        }
        listRef.current?.scrollToEnd({ animated: true });
      },
      () => {
        setIsPanditTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsPanditTyping(false);
        }, TYPING_HIDE_AFTER_MS);
      },
      (seconds) => {
        if (!waitingForPanditRef.current) {
          setSecondsRemaining(seconds);
        }
      },
      () => {
        setShowWarningBanner(true);
      },
      () => {
        handleSessionEndedRef.current();
      },
      () => {
        waitingForPanditRef.current = true;
        setWaitingForPandit(true);
        endTimeRef.current = null;
        setShowWarningBanner(false);
        setWaitingElapsedSeconds(0);
      },
      ({ endTime, startedAt }) => {
        waitingForPanditRef.current = false;
        endTimeRef.current = endTime;
        const startedAtMs =
          typeof startedAt === 'number'
            ? startedAt
            : Date.parse(String(startedAt));
        sessionStartedAtRef.current = Number.isFinite(startedAtMs) ? startedAtMs : Date.now();
        setWaitingForPandit(false);
        setSecondsRemaining(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
        clearWaitingElapsedIntervalRef.current();
        startGraceIntervalRef.current();
      },
      {
        onSessionRefunded: ({ coinsRefunded, message }) => {
          clearGraceEndedFallback();
          handleRefundRef.current(coinsRefunded, message);
        },
        onPanditDisconnected: () => {
          handlePanditDisconnectedRef.current();
        },
        onSessionEndedWithRefund: ({ coinsRefunded, message }) => {
          clearGraceEndedFallback();
          handleRefundRef.current(coinsRefunded, message);
        },
        onSessionGraceEnded: ({ message }) => {
          clearGraceIntervalRef.current();
          if (sessionEndedRef.current) return;
          clearGraceEndedFallback();
          graceEndedFallbackRef.current = setTimeout(() => {
            if (!sessionEndedRef.current) {
              handleRefundRef.current(0, message);
            }
          }, 2500);
        },
        onEarlierMessages: (older, hasMore) => {
          skipNextScrollRef.current = true;
          setLoadingEarlier(false);
          setHasEarlier(hasMore);
          setMessages((prev) => mergeEarlierMessages(older, prev));
        },
        onError: (message) => {
          setLoadingEarlier(false);
          Alert.alert('Session error', message);
        },
      },
    );

    return () => {
      chatSocket.setConnectionStatusHandler(null);
      try {
        if (!sessionEndedRef.current && bookingId) {
          chatSocket.leaveSession(bookingId);
        } else {
          chatSocket.removeAllListeners();
        }
      } catch {
        // ignore leave/listener errors during unmount
      }
      clearDisconnectInterval();
      clearWaitingElapsedInterval();
      clearGraceInterval();
      clearGraceEndedFallback();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [accessToken, authHydrated, bookingGate, bookingId, clearDisconnectInterval, clearGraceEndedFallback, clearGraceInterval, clearWaitingElapsedInterval]);

  useEffect(() => {
    return () => {
      clearDisconnectInterval();
      clearWaitingElapsedInterval();
      clearGraceInterval();
    };
  }, [clearDisconnectInterval, clearGraceInterval, clearWaitingElapsedInterval]);

  useFocusEffect(
    useCallback(() => {
      if (!bookingId) return;
      useActiveChatViewStore.getState().setFocusedBookingId(bookingId);
      return () => {
        useActiveChatViewStore.getState().setFocusedBookingId(null);
      };
    }, [bookingId]),
  );

  const onDraftChange = useCallback(
    (text: string) => {
      setDraft(text);
      if (sessionEndedRef.current || !bookingId || !text.trim()) return;
      const now = Date.now();
      if (!shouldEmitTyping(lastTypingEmitAtRef.current, now)) return;
      lastTypingEmitAtRef.current = now;
      chatSocket.sendTyping(bookingId);
    },
    [bookingId],
  );

  const onSend = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || sessionEndedRef.current || !bookingId) return;
    chatSocket.sendMessage(bookingId, trimmed);
    setMessages((prev) => [
      ...prev,
      {
        id: `pending-${Date.now()}`,
        bookingId,
        senderId: 'me',
        senderRole: 'user',
        text: trimmed,
        createdAt: new Date().toISOString(),
        pending: true,
      },
    ]);
    setDraft('');
  }, [bookingId, draft]);

  const onMessageLongPress = useCallback(
    (message: ChatMessage) => {
      const isUser = message.senderRole === 'user';
      const sendReport = (reason: string) => {
        if (!accessToken || !panditId || !bookingId) return;
        void reportChatMessage(accessToken, {
          panditId,
          panditName,
          bookingId,
          messageId: message.id,
          text: message.text,
          reason,
        })
          .then(() => {
            Alert.alert('Report sent', 'We will review this message.');
          })
          .catch(() => {
            Alert.alert('Could not send the report', 'Try again in a moment.');
          });
      };
      const buttons: {
        text: string;
        style?: 'cancel' | 'destructive';
        onPress?: () => void;
      }[] = [
        {
          text: 'Copy',
          onPress: () => {
            void Clipboard.setStringAsync(message.text)
              .then(() => {
                Alert.alert('Copied', 'The message is on the clipboard.');
              })
              .catch(() => {
                Alert.alert('Could not copy', 'Try again in a moment.');
              });
          },
        },
      ];
      if (!isUser && !message.pending && accessToken && panditId) {
        buttons.push({
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Report message', 'Why are you reporting this message?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Harassment', onPress: () => sendReport('Harassment') },
              { text: 'Inappropriate', onPress: () => sendReport('Inappropriate') },
              { text: 'Spam', onPress: () => sendReport('Spam') },
            ]);
          },
        });
      }
      buttons.push({ text: 'Cancel', style: 'cancel' });
      Alert.alert('Message', undefined, buttons);
    },
    [accessToken, bookingId, panditId, panditName],
  );

  const onLoadEarlier = useCallback(() => {
    if (!bookingId || loadingEarlier) return;
    const oldest = messages.find((message) => !message.pending);
    const before = oldest ? Date.parse(oldest.createdAt) : Number.NaN;
    if (!Number.isFinite(before)) return;
    setLoadingEarlier(true);
    chatSocket.loadEarlierMessages(bookingId, before);
  }, [bookingId, loadingEarlier, messages]);

  const endSummary = useMemo(
    () =>
      chatEndSummary({
        panditName,
        startedAtMs: sessionStartedAtRef.current,
        endedAtMs: Date.now(),
        messageCount: messages.length,
      }),
    [messages.length, panditName, sessionEnded],
  );

  const onBookAgain = useCallback(() => {
    allowNextRemove();
    if (panditId) {
      router.replace(`/experts/${panditId}`);
      return;
    }
    router.replace('/(tabs)/experts');
  }, [allowNextRemove, panditId, router]);

  const onSessionDone = useCallback(() => {
    allowNextRemove();
    router.replace('/(tabs)/home');
  }, [allowNextRemove, router]);

  const onSafetyPress = useCallback(() => {
    if (!accessToken || !panditId) {
      Alert.alert('Unavailable', 'Safety actions need a signed-in session.');
      return;
    }
    Alert.alert('Safety', 'Report or block this pandit.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        onPress: () => {
          Alert.alert('Report pandit', 'Why are you reporting?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Inappropriate',
              onPress: () => {
                void reportPandit(
                  accessToken,
                  panditId,
                  panditName,
                  'Inappropriate behaviour',
                  bookingId || undefined,
                )
                  .then(() => Alert.alert('Reported', 'Thanks. Our team will review this.'))
                  .catch((err) =>
                    Alert.alert(
                      'Could not report',
                      err instanceof Error ? err.message : 'Please try again.',
                    ),
                  );
              },
            },
            {
              text: 'Spam / scam',
              onPress: () => {
                void reportPandit(
                  accessToken,
                  panditId,
                  panditName,
                  'Spam or scam',
                  bookingId || undefined,
                )
                  .then(() => Alert.alert('Reported', 'Thanks. Our team will review this.'))
                  .catch((err) =>
                    Alert.alert(
                      'Could not report',
                      err instanceof Error ? err.message : 'Please try again.',
                    ),
                  );
              },
            },
          ]);
        },
      },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await blockPandit(panditId, accessToken);
              await reportPandit(
                accessToken,
                panditId,
                panditName,
                'User blocked this pandit',
                bookingId || undefined,
              ).catch(() => undefined);
              Alert.alert('Blocked', 'You will not see this pandit in your recommendations.');
            } catch (err) {
              Alert.alert(
                'Could not block',
                err instanceof Error ? err.message : 'Please try again.',
              );
            }
          })();
        },
      },
    ]);
  }, [accessToken, bookingId, panditId, panditName]);

  const onBackToHome = useCallback(() => {
    router.replace('/(tabs)/home');
  }, [router]);

  const timerLabel = waitingForPandit
    ? formatElapsedMmSs(waitingElapsedSeconds)
    : formatMmSs(secondsRemaining);
  const timerColor = waitingForPandit
    ? GREY_LABEL
    : secondsRemaining < WARNING_SECONDS
      ? SESSION_RED
      : GOLD;

  const inputSafePad = Math.max(insets.bottom, 12);
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
  const composerBottomPad = isKeyboardVisible ? 0 : inputSafePad;
  const listBottomPad = COMPOSER_CLEARANCE + inputSafePad;

  if (!authHydrated) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  if (!bookingId) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.fallbackText}>Invalid chat session link.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ChatPanditCard
        visible={profileOpen}
        panditId={panditId}
        panditName={panditName}
        onClose={() => setProfileOpen(false)}
      />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity onPress={handleBackPress} style={styles.headerSide} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={WHITE} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => setProfileOpen(true)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={`About ${panditName}`}
          accessibilityHint="Opens a short profile without leaving the chat"
        >
          <View style={styles.headerTitleRow}>
            <View
              style={[
                styles.connectionDot,
                connectionStatus === 'connected' ? styles.connectionDotOn : styles.connectionDotOff,
              ]}
            />
            <Text style={styles.headerTitle} numberOfLines={1}>
              {panditName}
            </Text>
          </View>
          <Text style={[styles.timerText, { color: timerColor }]}>{timerLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSafetyPress}
          style={styles.headerSide}
          activeOpacity={0.7}
          accessibilityLabel="Report or block"
        >
          <Ionicons name="flag-outline" size={20} color={WHITE} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={confirmEndSession}
          style={styles.endBtn}
          activeOpacity={0.85}
          disabled={sessionEnded}
        >
          <Text style={[styles.endBtnText, sessionEnded && styles.endBtnTextDisabled]}>End Session</Text>
        </TouchableOpacity>
      </View>

      {connectionStatus === 'error' ? (
        <View style={styles.connectionErrorBanner}>
          <Text style={styles.connectionErrorText}>Connection failed - check network</Text>
        </View>
      ) : null}

      <View style={styles.disclaimerWrap}>
        <EntertainmentDisclaimer compact />
      </View>

      {!waitingForPandit && !sessionEnded && graceSecondsRemaining > 0 ? (
        <View style={styles.graceRow}>
          <GraceRefundLink
            pending={graceRefundPending}
            secondsLabel={formatMmSs(graceSecondsRemaining)}
            onPress={confirmGraceRefund}
            disabled={sessionEnded}
            tone="onLight"
          />
        </View>
      ) : null}

      {showWarningBanner && !waitingForPandit ? (
        <ExtendSessionOffer
          bookingId={bookingId}
          panditId={panditId}
          panditName={panditName}
          tone="light"
        />
      ) : null}

      {panditDisconnected && !refundInfo ? (
        <View style={styles.disconnectBanner}>
          <Text style={styles.disconnectBannerTitle}>
            Your pandit dropped off. They have {disconnectCountdown}s to reconnect.
          </Text>
          <Text style={styles.disconnectBannerCountdown}>
            If they do not return, unused time goes back to your wallet.
          </Text>
        </View>
      ) : null}

      <View style={styles.listWrap}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPad }]}
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          onContentSizeChange={() => {
            if (skipNextScrollRef.current) {
              skipNextScrollRef.current = false;
              return;
            }
            scrollToBottom();
          }}
          ListHeaderComponent={
            hasEarlier ? (
              <TouchableOpacity
                style={styles.earlierBtn}
                onPress={onLoadEarlier}
                disabled={loadingEarlier}
                accessibilityRole="button"
                accessibilityLabel="Load earlier messages"
              >
                <Text style={styles.earlierBtnText}>
                  {loadingEarlier ? 'Loading earlier messages…' : 'Load earlier messages'}
                </Text>
              </TouchableOpacity>
            ) : null
          }
          ListFooterComponent={<TypingDots visible={isPanditTyping} panditName={panditName} />}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              panditName={panditName}
              isUser={item.senderRole === 'user'}
              onLongPress={() => onMessageLongPress(item)}
            />
          )}
        />
        {waitingForPandit ? (
          <View style={styles.waitingOverlay} pointerEvents="none">
            <WaitingForPanditStatus elapsedSeconds={waitingElapsedSeconds} />
          </View>
        ) : null}

        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
          {isKeyboardVisible && !sessionEnded ? (
            <View
              style={[
                styles.keyboardTimerChip,
                secondsRemaining < WARNING_SECONDS && !waitingForPandit
                  ? styles.keyboardTimerChipWarn
                  : null,
              ]}
              accessibilityLiveRegion="polite"
              accessibilityLabel={`Time remaining ${timerLabel}`}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={
                  secondsRemaining < WARNING_SECONDS && !waitingForPandit ? WHITE : DEEP_GREY
                }
              />
              <Text
                style={[
                  styles.keyboardTimerText,
                  secondsRemaining < WARNING_SECONDS && !waitingForPandit
                    ? styles.keyboardTimerTextWarn
                    : null,
                ]}
              >
                {waitingForPandit ? `Waiting · ${timerLabel}` : `Paid time · ${timerLabel}`}
              </Text>
            </View>
          ) : null}
          <View style={[styles.inputBar, { paddingBottom: composerBottomPad }]}>
            {!sessionEnded && !waitingForPandit ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={styles.quickReplyScroll}
                contentContainerStyle={styles.quickReplyContent}
              >
                {QUICK_REPLIES.map((reply) => (
                  <TouchableOpacity
                    key={reply}
                    style={styles.quickReplyChip}
                    onPress={() => setDraft(reply)}
                    accessibilityRole="button"
                    accessibilityLabel={`Use quick reply: ${reply}`}
                  >
                    <Text style={styles.quickReplyText}>{reply}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}
            <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, sessionEnded && styles.inputDisabled]}
              value={draft}
              onChangeText={onDraftChange}
              placeholder={sessionEnded ? 'Session ended' : 'Type a message…'}
              placeholderTextColor={GREY_LABEL}
              editable={!sessionEnded}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, sessionEnded && styles.sendBtnDisabled]}
              onPress={onSend}
              activeOpacity={0.85}
              disabled={sessionEnded}
            >
              <Ionicons name="send" size={18} color={WHITE} />
            </TouchableOpacity>
            </View>
          </View>
        </KeyboardStickyView>
      </View>

      {sessionEnded && !refundInfo ? (
        <View style={styles.endedOverlay}>
          <View style={styles.endedCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={GOLD} />
            <Text style={styles.endedTitle}>{endSummary.title}</Text>
            {endSummary.lines.map((line) => (
              <Text key={line} style={styles.endedSubtitle}>
                {line}
              </Text>
            ))}
            {bookingId ? <PostCallRating bookingId={bookingId} /> : null}
            <TouchableOpacity
              style={styles.endedSecondaryBtn}
              onPress={onBookAgain}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Book again"
            >
              <Text style={styles.endedSecondaryText}>Book again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.endedTextBtn}
              onPress={onSessionDone}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={styles.endedTextBtnLabel}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {refundInfo ? (
        <RefundModal visible refundInfo={refundInfo} onBackToHome={onBackToHome} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    marginTop: 40,
    textAlign: 'center',
    color: GREY_LABEL,
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DEEP_GREY,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HEADER_RULE_GREY,
  },
  headerSide: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minHeight: 44,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionDotOn: {
    backgroundColor: AVAILABLE_GREEN,
  },
  connectionDotOff: {
    backgroundColor: MUTED_GREY,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
    flexShrink: 1,
  },
  timerText: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  endBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 72,
    alignItems: 'flex-end',
  },
  endBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: SESSION_RED,
  },
  endBtnTextDisabled: {
    opacity: 0.45,
  },
  connectionErrorBanner: {
    backgroundColor: SESSION_RED,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  connectionErrorText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  disclaimerWrap: {
    paddingHorizontal: 12,
    backgroundColor: '#0B0B0B',
  },
  disconnectBanner: {
    backgroundColor: WARNING_BANNER_BG,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SOFT_YELLOW,
  },
  disconnectBannerTitle: {
    color: TEXT_PRIMARY_DARK,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  disconnectBannerCountdown: {
    marginTop: 4,
    color: TEXT_PRIMARY_DARK,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listWrap: {
    flex: 1,
  },
  waitingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 15,
    fontWeight: '600',
    color: GREY_LABEL,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  waitingRefundNote: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: GREY_LABEL,
    textAlign: 'center',
    paddingHorizontal: 28,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    flexGrow: 1,
  },
  earlierBtn: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  earlierBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
  },
  messageRow: {
    marginBottom: 10,
    maxWidth: '82%',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
  },
  messageRowPandit: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: GOLD,
    borderBottomRightRadius: 4,
  },
  bubblePandit: {
    backgroundColor: WHITE,
    borderBottomLeftRadius: 4,
    shadowColor: SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageTextUser: {
    color: WHITE,
  },
  messageTextPandit: {
    color: TEXT_PRIMARY_DARK,
  },
  timestamp: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
  },
  timestampUser: {
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'right',
  },
  timestampPandit: {
    color: GREY_LABEL,
  },
  typingRow: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  typingLabel: {
    fontSize: 12,
    color: GREY_LABEL,
    marginBottom: 6,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: GREY_LABEL,
  },
  keyboardTimerChip: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: WHITE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HEADER_RULE_GREY,
    shadowColor: SHADOW_BLACK,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  keyboardTimerChipWarn: {
    backgroundColor: SESSION_RED,
    borderColor: SESSION_RED,
  },
  keyboardTimerText: {
    fontSize: 13,
    fontWeight: '700',
    color: DEEP_GREY,
    fontVariant: ['tabular-nums'],
  },
  keyboardTimerTextWarn: {
    color: WHITE,
  },
  graceRow: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  inputBar: {
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HEADER_RULE_GREY,
    backgroundColor: WHITE,
  },
  quickReplyScroll: {
    flexGrow: 0,
  },
  quickReplyContent: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 8,
  },
  quickReplyChip: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickReplyText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 2,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: HEADER_RULE_GREY,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: TEXT_PRIMARY_DARK,
    backgroundColor: BG,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  endedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SCRIM_BLACK,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  endedCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  endedTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  endedSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    lineHeight: 20,
  },
  refundIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: SOFT_YELLOW,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refundIconText: {
    fontSize: 28,
    fontWeight: '700',
    color: GOLD,
  },
  refundCoinsText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
  },
  rateBtn: {
    marginTop: 20,
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
  },
  endedSecondaryBtn: {
    marginTop: 10,
    width: '100%',
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endedSecondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD,
  },
  endedTextBtn: {
    marginTop: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  endedTextBtnLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: GREY_LABEL,
  },
});
