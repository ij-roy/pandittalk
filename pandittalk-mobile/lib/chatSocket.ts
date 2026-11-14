import { io, type Socket } from 'socket.io-client';

import { nextReconnectDelayMs, shouldResetReconnectAttempt } from '@/lib/socketReconnect';
import { getApiBase, isNgrokApiBase } from '@/lib/authApi';
import { historyHasMore } from '@/lib/chatHistory';
import { normalizeNotificationPayload } from '@/lib/notificationApi';
import type { Notification } from '@/store/useNotificationStore';

export type ChatMessage = {
  id: string;
  bookingId: string;
  senderId: string;
  senderRole: 'user' | 'pandit';
  senderName?: string;
  text: string;
  createdAt: string;
  pending?: boolean;
};

export type ConnectionStatus = 'connecting' | 'connected' | 'error';

export type SessionStartedPayload = {
  startedAt: string | number;
  endTime: number;
  durationMinutes: number;
};

export type AudioWaitingForStartPayload = {
  startsAt: string;
};

export type VideoWaitingForStartPayload = {
  startsAt: string;
};

export type SessionRefundedPayload = {
  reason?: string;
  coinsRefunded: number;
  message: string;
};

export type SessionEndedWithRefundPayload = {
  coinsRefunded: number;
  message: string;
};

export type SessionExtras = {
  onSessionRefunded?: (payload: SessionRefundedPayload) => void;
  onPanditDisconnected?: (reconnectSeconds: number) => void;
  onSessionEndedWithRefund?: (payload: SessionEndedWithRefundPayload) => void;
  onSessionGraceEnded?: (payload: { bookingId: string; message: string }) => void;
  onEarlierMessages?: (messages: ChatMessage[], hasMore: boolean) => void;
  onError?: (message: string) => void;
};

type SessionListener = {
  event: string;
  handler: (...args: unknown[]) => void;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return fallback;
}

function normalizeSenderRole(v: unknown): 'user' | 'pandit' | null {
  const role = str(v).toLowerCase();
  if (role === 'user' || role === 'pandit') return role;
  return null;
}

function createdAtFromPayload(o: Record<string, unknown>): string {
  const ts = o.timestamp;
  if (typeof ts === 'number' && Number.isFinite(ts)) {
    return new Date(ts).toISOString();
  }
  const fromStr = str(o.created_at ?? o.createdAt);
  if (fromStr) return fromStr;
  return new Date().toISOString();
}

function normalizeChatMessage(raw: unknown, bookingIdFallback = ''): ChatMessage | null {
  const o = asRecord(raw);
  if (!o) return null;

  const bookingId = str(o.booking_id ?? o.bookingId ?? o.sessionId, bookingIdFallback);
  const senderId = str(o.sender_id ?? o.senderId);
  const senderRole = normalizeSenderRole(o.sender_role ?? o.senderRole);
  const text = str(o.text ?? o.message ?? o.content);
  const timestamp =
    typeof o.timestamp === 'number' && Number.isFinite(o.timestamp) ? o.timestamp : Date.now();
  const id = str(o.id) || `${bookingId}-${timestamp}-${senderId}`;
  const createdAt = createdAtFromPayload(o);

  if (!bookingId || !senderId || !senderRole || !text) return null;

  const senderNameRaw = o.sender_name ?? o.senderName;
  const senderName = typeof senderNameRaw === 'string' && senderNameRaw.trim() ? senderNameRaw.trim() : undefined;

  return {
    id,
    bookingId,
    senderId,
    senderRole,
    senderName,
    text,
    createdAt,
  };
}

function normalizeHistory(raw: unknown, bookingIdFallback = ''): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeChatMessage(item, bookingIdFallback))
    .filter((item): item is ChatMessage => item !== null);
}

function extractHistoryFromPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) return payload;
  const o = asRecord(payload);
  if (!o) return payload;
  return o.history ?? o.messages ?? payload;
}

function parseTimeRemainingSeconds(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(0, Math.floor(raw));
  const o = asRecord(raw);
  if (!o) return null;
  const secondsRaw =
    o.secondsLeft ?? o.seconds ?? o.remainingSeconds ?? o.timeRemaining ?? o.time_remaining;
  if (typeof secondsRaw === 'number' && Number.isFinite(secondsRaw)) {
    return Math.max(0, Math.floor(secondsRaw));
  }
  if (typeof secondsRaw === 'string' && secondsRaw.trim()) {
    const parsed = Number(secondsRaw);
    if (Number.isFinite(parsed)) return Math.max(0, Math.floor(parsed));
  }
  return null;
}

function parseCoinsRefunded(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(0, Math.floor(raw));
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return Math.max(0, Math.floor(parsed));
  }
  return null;
}

function parseSessionRefunded(raw: unknown): SessionRefundedPayload | null {
  const o = asRecord(raw);
  if (!o) return null;

  const coinsRefunded = parseCoinsRefunded(o.coinsRefunded ?? o.coins_refunded);
  const message = str(o.message);
  if (coinsRefunded === null || !message) return null;

  const reasonRaw = o.reason;
  const reason = typeof reasonRaw === 'string' && reasonRaw.trim() ? reasonRaw.trim() : undefined;

  return { reason, coinsRefunded, message };
}

function parseSessionEndedWithRefund(raw: unknown): SessionEndedWithRefundPayload | null {
  const o = asRecord(raw);
  if (!o) return null;

  const coinsRefunded = parseCoinsRefunded(o.coinsRefunded ?? o.coins_refunded);
  const message = str(o.message);
  if (coinsRefunded === null || !message) return null;

  return { coinsRefunded, message };
}

function parseSessionStarted(raw: unknown): SessionStartedPayload | null {
  const o = asRecord(raw);
  if (!o) return null;

  const endTimeRaw = o.endTime ?? o.end_time;
  if (typeof endTimeRaw !== 'number' || !Number.isFinite(endTimeRaw)) return null;

  const durationRaw = o.durationMinutes ?? o.duration_minutes;
  if (typeof durationRaw !== 'number' || !Number.isFinite(durationRaw)) return null;

  const startedAtRaw = o.startedAt ?? o.started_at;
  if (typeof startedAtRaw !== 'string' && typeof startedAtRaw !== 'number') return null;

  return {
    startedAt: startedAtRaw,
    endTime: endTimeRaw,
    durationMinutes: durationRaw,
  };
}

function parseAudioWaitingForStart(raw: unknown): AudioWaitingForStartPayload | null {
  const o = asRecord(raw);
  if (!o) return null;

  const startsAt = str(o.startsAt ?? o.starts_at);
  if (!startsAt) return null;

  return { startsAt };
}

function parseVideoWaitingForStart(raw: unknown): VideoWaitingForStartPayload | null {
  const o = asRecord(raw);
  if (!o) return null;

  const startsAt = str(o.startsAt ?? o.starts_at);
  if (!startsAt) return null;

  return { startsAt };
}

let socket: Socket | null = null;
const outboundQueue: { bookingId: string; message: string }[] = [];

function flushOutbound(bookingId: string): void {
  if (!socket?.connected) return;
  const ready: { bookingId: string; message: string }[] = [];
  for (let i = outboundQueue.length - 1; i >= 0; i -= 1) {
    if (outboundQueue[i].bookingId !== bookingId) continue;
    ready.unshift(outboundQueue[i]);
    outboundQueue.splice(i, 1);
  }
  for (const item of ready) {
    socket.emit('sendMessage', item);
  }
}

let currentToken: string | null = null;
let activeBookingId: string | null = null;
let backgroundBookingId: string | null = null;
let activeSessionDurationMinutes: number | null = null;
let activeAudioBookingId: string | null = null;
let activeAudioToken: string | null = null;
let activeVideoBookingId: string | null = null;
let activeVideoToken: string | null = null;
let hasConnectedOnce = false;
let connectedAt = 0;
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let sessionListeners: SessionListener[] = [];
let persistentListeners: SessionListener[] = [];
let persistentListenersAttached = false;
let onNewNotificationHandler: ((notification: Notification) => void) | null = null;
let onTimeRemainingHandler: ((seconds: number, bookingId: string | null) => void) | null = null;
let onWaitingForStartHandler:
  | ((payload: { bookingId: string; startsAt: string }) => void)
  | null = null;
let connectionStatusHandler: ((status: ConnectionStatus) => void) | null = null;

function resolveActiveBookingId(): string | null {
  return activeBookingId ?? activeAudioBookingId ?? activeVideoBookingId;
}

function clearPersistentListeners(): void {
  if (!socket) {
    persistentListeners = [];
    persistentListenersAttached = false;
    return;
  }
  for (const { event, handler } of persistentListeners) {
    socket.off(event, handler);
  }
  persistentListeners = [];
  persistentListenersAttached = false;
}

function addPersistentListener(event: string, handler: (...args: unknown[]) => void): void {
  if (!socket) return;
  socket.on(event, handler);
  persistentListeners.push({ event, handler });
}

function setupPersistentListeners(): void {
  if (!socket || persistentListenersAttached) return;

  const handleNewNotification = (payload: unknown) => {
    const notification = normalizeNotificationPayload(payload);
    if (notification) {
      onNewNotificationHandler?.(notification);
    }
  };

  const handleTimeRemaining = (payload: unknown) => {
    const seconds = parseTimeRemainingSeconds(payload);
    if (seconds !== null) {
      onTimeRemainingHandler?.(seconds, resolveActiveBookingId());
    }
  };

  addPersistentListener('newNotification', handleNewNotification);
  addPersistentListener('timeRemaining', handleTimeRemaining);
  persistentListenersAttached = true;
}

function clearReconnectTimer(): void {
  if (!reconnectTimer) return;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

function connectWhenAllowed(): void {
  if (!socket || socket.connected || reconnectTimer) return;
  socket.connect();
}

function scheduleReconnect(reason: string): void {
  if (!socket || reconnectTimer || reason === 'io client disconnect') return;
  const stayed = connectedAt > 0 ? Date.now() - connectedAt : 0;
  if (shouldResetReconnectAttempt(stayed)) reconnectAttempt = 0;
  const delay = nextReconnectDelayMs(reconnectAttempt);
  if (!shouldResetReconnectAttempt(stayed)) reconnectAttempt += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (socket && !socket.connected) socket.connect();
  }, delay);
}

function ensureSocket(accessToken: string): Socket {
  if (socket) {
    socket.auth = { token: accessToken };
    if (!socket.connected) {
      connectWhenAllowed();
    }
    return socket;
  }

  const apiBase = getApiBase();
  const ngrokHeaders = isNgrokApiBase(apiBase)
    ? { 'ngrok-skip-browser-warning': 'true' }
    : undefined;

  socket = io(`${apiBase}/chat`, {
    auth: { token: accessToken },
    transports: ['websocket'],
    ...(ngrokHeaders ? { extraHeaders: ngrokHeaders } : {}),
    timeout: 10000,
    autoConnect: true,
    reconnection: false,
  });

  socket.on('connect', () => {
    console.log('[chat] connect');
    connectedAt = Date.now();
    connectionStatusHandler?.('connected');
    if (activeBookingId && hasConnectedOnce) {
      console.log('[ChatSocket] re-joining session on reconnect:', activeBookingId);
      socket?.emit('joinSession', {
        bookingId: activeBookingId,
        token: currentToken ?? undefined,
      });
    }
    if (activeAudioBookingId && activeAudioToken && hasConnectedOnce) {
      console.log('[ChatSocket] re-joining audio session on reconnect:', activeAudioBookingId);
      socket?.emit('joinAudioSession', {
        bookingId: activeAudioBookingId,
        token: activeAudioToken,
      });
    }
    if (activeVideoBookingId && activeVideoToken && hasConnectedOnce) {
      console.log('[ChatSocket] re-joining video session on reconnect:', activeVideoBookingId);
      socket?.emit('joinVideoSession', {
        bookingId: activeVideoBookingId,
        token: activeVideoToken,
      });
    }
    hasConnectedOnce = true;
  });
  socket.on('disconnect', (reason: string) => {
    connectionStatusHandler?.('connecting');
    scheduleReconnect(reason);
  });
  socket.on('connect_error', (err: Error) => {
    console.log('[chat] connect_error', err?.message ?? err);
    connectionStatusHandler?.('error');
  });
  socket.on('error', (err: unknown) => {
    console.log('[chat] error', err);
  });

  setupPersistentListeners();

  return socket;
}

function clearSessionListeners(): void {
  if (!socket) {
    sessionListeners = [];
    return;
  }
  for (const { event, handler } of sessionListeners) {
    socket.off(event, handler);
  }
  sessionListeners = [];
}

function addSessionListener(event: string, handler: (...args: unknown[]) => void): void {
  if (!socket) return;
  socket.on(event, handler);
  sessionListeners.push({ event, handler });
}

export const chatSocket = {
  connect(accessToken: string): void {
    currentToken = accessToken;
    connectionStatusHandler?.('connecting');
    ensureSocket(accessToken);
    if (socket?.connected) {
      connectionStatusHandler?.('connected');
    }
  },

  resumeFromForeground(): void {
    clearReconnectTimer();
    reconnectAttempt = 0;
    connectWhenAllowed();
    if (socket?.connected) {
      connectionStatusHandler?.('connected');
    }
  },

  updateAccessToken(accessToken: string): void {
    currentToken = accessToken;
    if (socket) {
      socket.auth = { token: accessToken };
    }
  },

  disconnect(): void {
    clearSessionListeners();
    clearPersistentListeners();
    socket?.disconnect();
    socket = null;
    currentToken = null;
    activeBookingId = null;
    backgroundBookingId = null;
    activeSessionDurationMinutes = null;
    activeAudioBookingId = null;
    activeAudioToken = null;
    activeVideoBookingId = null;
    activeVideoToken = null;
    hasConnectedOnce = false;
    connectionStatusHandler?.('connecting');
  },

  setConnectionStatusHandler(handler: ((status: ConnectionStatus) => void) | null): void {
    connectionStatusHandler = handler;
    if (!socket) {
      handler?.('connecting');
      return;
    }
    handler?.(socket.connected ? 'connected' : 'connecting');
  },

  setOnNewNotification(handler: ((notification: Notification) => void) | null): void {
    onNewNotificationHandler = handler;
  },

  setOnTimeRemaining(
    handler: ((seconds: number, bookingId: string | null) => void) | null,
  ): void {
    onTimeRemainingHandler = handler;
  },

  setOnWaitingForStart(
    handler: ((payload: { bookingId: string; startsAt: string }) => void) | null,
  ): void {
    onWaitingForStartHandler = handler;
  },

  getActiveBookingId(): string | null {
    return resolveActiveBookingId();
  },

  getBackgroundBookingId(): string | null {
    return backgroundBookingId;
  },

  getActiveSessionDurationMinutes(): number | null {
    return activeSessionDurationMinutes;
  },

  joinSession(
    bookingId: string,
    onHistory: (messages: ChatMessage[], hasMore?: boolean) => void,
    onMessage: (message: ChatMessage) => void,
    onTyping: () => void,
    onTimeRemaining: (seconds: number) => void,
    onWarning: () => void,
    onSessionEnded: () => void,
    onWaitingForPandit: () => void,
    onSessionStarted: (payload: SessionStartedPayload) => void,
    sessionExtras?: SessionExtras,
  ): void {
    if (!socket && currentToken) {
      ensureSocket(currentToken);
    }
    if (!socket) return;

    activeBookingId = bookingId;
    if (backgroundBookingId === bookingId) {
      backgroundBookingId = null;
    }
    clearSessionListeners();

    const handleSessionJoined = (payload: unknown) => {
      console.log('[chat] sessionJoined', payload);
      const historyRaw = extractHistoryFromPayload(payload);
      onHistory(normalizeHistory(historyRaw, bookingId), historyHasMore(payload));
      flushOutbound(bookingId);
    };

    const handleNewMessage = (payload: unknown) => {
      console.log('[chat] newMessage', payload);
      const message = normalizeChatMessage(payload, bookingId);
      if (message) onMessage(message);
    };

    const handleTyping = () => {
      onTyping();
    };

    const handleTimeRemaining = (payload: unknown) => {
      const seconds = parseTimeRemainingSeconds(payload);
      if (seconds !== null) onTimeRemaining(seconds);
    };

    const handleWarning = () => {
      onWarning();
    };

    const handleSessionEnded = () => {
      onSessionEnded();
    };

    const handleWaitingForPandit = () => {
      onWaitingForPandit();
    };

    const handleSessionStarted = (payload: unknown) => {
      const parsed = parseSessionStarted(payload);
      if (parsed) {
        activeSessionDurationMinutes = parsed.durationMinutes;
        onSessionStarted(parsed);
      }
    };

    const emitJoin = () => {
      if (!socket) return;
      console.log('[ChatSocket] emitting joinSession for bookingId:', bookingId);
      addSessionListener('sessionJoined', handleSessionJoined);
      addSessionListener('newMessage', handleNewMessage);
      addSessionListener('typingIndicator', handleTyping);
      addSessionListener('timeRemaining', handleTimeRemaining);
      addSessionListener('warningFiveMinutes', handleWarning);
      addSessionListener('sessionEnded', handleSessionEnded);
      addSessionListener('sessionTimeUp', handleSessionEnded);
      addSessionListener('waitingForPandit', handleWaitingForPandit);
      addSessionListener('sessionStarted', handleSessionStarted);

      if (sessionExtras?.onEarlierMessages) {
        const onEarlierMessages = sessionExtras.onEarlierMessages;
        addSessionListener('earlierMessages', (payload: unknown) => {
          const historyRaw = extractHistoryFromPayload(payload);
          onEarlierMessages(normalizeHistory(historyRaw, bookingId), historyHasMore(payload));
        });
      }

      if (sessionExtras?.onSessionRefunded) {
        const onSessionRefunded = sessionExtras.onSessionRefunded;
        addSessionListener('sessionRefunded', (payload: unknown) => {
          const parsed = parseSessionRefunded(payload);
          if (parsed) onSessionRefunded(parsed);
        });
      }

      if (sessionExtras?.onPanditDisconnected) {
        const onPanditDisconnected = sessionExtras.onPanditDisconnected;
        addSessionListener('panditDisconnected', (payload: unknown) => {
          const record = asRecord(payload);
          const seconds = Number(record?.reconnectSeconds ?? record?.reconnect_seconds);
          onPanditDisconnected(
            Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : 60,
          );
        });
      }

      if (sessionExtras?.onSessionEndedWithRefund) {
        const onSessionEndedWithRefund = sessionExtras.onSessionEndedWithRefund;
        addSessionListener('sessionEndedWithRefund', (payload: unknown) => {
          const parsed = parseSessionEndedWithRefund(payload);
          if (parsed) onSessionEndedWithRefund(parsed);
        });
      }

      if (sessionExtras?.onSessionGraceEnded) {
        const onSessionGraceEnded = sessionExtras.onSessionGraceEnded;
        addSessionListener('sessionGraceEnded', (payload: unknown) => {
          const record = asRecord(payload);
          const typedBookingId = str(record?.bookingId ?? record?.booking_id, bookingId);
          const message = str(record?.message, 'Session ended with refund.');
          onSessionGraceEnded({ bookingId: typedBookingId, message });
        });
      }

      if (sessionExtras?.onError) {
        const onError = sessionExtras.onError;
        addSessionListener('error', (payload: unknown) => {
          const record = asRecord(payload);
          onError(str(record?.message, 'An unexpected error occurred'));
        });
      }

      socket.emit('joinSession', { bookingId, token: currentToken ?? undefined });
    };

    console.log('[ChatSocket] socket.connected:', socket.connected);
    if (socket.connected) {
      emitJoin();
    } else {
      socket.once('connect', emitJoin);
    }
  },

  sendMessage(bookingId: string, message: string): boolean {
    const trimmed = message.trim();
    if (!trimmed) return false;
    if (socket?.connected) {
      socket.emit('sendMessage', { bookingId, message: trimmed });
      return false;
    }
    outboundQueue.push({ bookingId, message: trimmed });
    return true;
  },

  sendTyping(bookingId: string): void {
    socket?.emit('typing', { bookingId });
  },

  loadEarlierMessages(bookingId: string, beforeTimestamp: number): void {
    socket?.emit('loadEarlierMessages', {
      bookingId,
      beforeTimestamp,
      token: currentToken ?? undefined,
    });
  },

  endSession(bookingId: string): void {
    socket?.emit('endSession', { bookingId });
    if (backgroundBookingId === bookingId) {
      backgroundBookingId = null;
    }
  },

  leaveSession(bookingId: string): void {
    socket?.emit('leaveSession', { bookingId });
    if (activeBookingId === bookingId) {
      backgroundBookingId = bookingId;
      activeBookingId = null;
      activeSessionDurationMinutes = null;
    }
  },

  clearBackgroundBooking(bookingId: string): void {
    if (backgroundBookingId === bookingId) {
      backgroundBookingId = null;
    }
  },

  joinAudioSession(
    bookingId: string,
    token: string,
    onWaitingForOther: () => void,
    onWaitingForStart: (payload: AudioWaitingForStartPayload) => void,
    onSessionStarted: (payload: SessionStartedPayload) => void,
    onTimeRemaining: (seconds: number) => void,
    onWarning: () => void,
    onSessionTimeUp: () => void,
    onSessionEnded: () => void,
    onParticipantLeft?: () => void,
    onParticipantRejoined?: () => void,
    onSessionRefunded?: (payload: SessionRefundedPayload) => void,
    onSessionGraceEnded?: (message: string) => void,
    onError?: (message: string) => void,
  ): void {
    if (!socket && currentToken) {
      ensureSocket(currentToken);
    }
    if (!socket) return;

    activeAudioBookingId = bookingId;
    activeAudioToken = token;
    clearSessionListeners();

    const handleWaitingForOther = () => {
      onWaitingForOther();
    };

    const handleWaitingForStart = (payload: unknown) => {
      const parsed = parseAudioWaitingForStart(payload);
      if (!parsed) return;
      onWaitingForStartHandler?.({ bookingId, startsAt: parsed.startsAt });
      onWaitingForStart(parsed);
    };

    const handleSessionStarted = (payload: unknown) => {
      const parsed = parseSessionStarted(payload);
      if (parsed) {
        activeSessionDurationMinutes = parsed.durationMinutes;
        onSessionStarted(parsed);
      }
    };

    const handleTimeRemaining = (payload: unknown) => {
      const seconds = parseTimeRemainingSeconds(payload);
      if (seconds !== null) onTimeRemaining(seconds);
    };

    const handleWarning = () => {
      onWarning();
    };

    const handleSessionTimeUp = () => {
      onSessionTimeUp();
    };

    const handleSessionEnded = () => {
      onSessionEnded();
    };

    const handleParticipantLeft = () => {
      onParticipantLeft?.();
    };

    const handleParticipantRejoined = () => {
      onParticipantRejoined?.();
    };

    const handleSessionRefunded = (payload: unknown) => {
      const parsed = parseSessionRefunded(payload);
      if (parsed) onSessionRefunded?.(parsed);
    };

    const handleSessionGraceEnded = (payload: unknown) => {
      const record = asRecord(payload);
      const message = str(record?.message, 'Session ended with refund.');
      onSessionGraceEnded?.(message);
    };

    const emitJoin = () => {
      if (!socket) return;
      console.log('[ChatSocket] emitting joinAudioSession for bookingId:', bookingId);
      addSessionListener('audioWaitingForOther', handleWaitingForOther);
      addSessionListener('audioWaitingForStart', handleWaitingForStart);
      addSessionListener('audioSessionStarted', handleSessionStarted);
      addSessionListener('timeRemaining', handleTimeRemaining);
      addSessionListener('warningFiveMinutes', handleWarning);
      addSessionListener('audioSessionTimeUp', handleSessionTimeUp);
      addSessionListener('audioSessionEnded', handleSessionEnded);
      addSessionListener('audioParticipantLeft', handleParticipantLeft);
      addSessionListener('audioParticipantRejoined', handleParticipantRejoined);
      addSessionListener('sessionRefunded', handleSessionRefunded);
      addSessionListener('sessionGraceEnded', handleSessionGraceEnded);
      if (onError) {
        addSessionListener('error', (payload: unknown) => {
          const record = asRecord(payload);
          onError(str(record?.message, 'An unexpected error occurred'));
        });
      }
      socket.emit('joinAudioSession', { bookingId, token });
    };

    if (socket.connected) {
      emitJoin();
    } else {
      socket.once('connect', emitJoin);
    }
  },

  leaveAudioSession(bookingId: string): void {
    socket?.emit('leaveAudioSession', { bookingId });
    activeAudioBookingId = null;
    activeAudioToken = null;
  },

  endAudioSession(bookingId: string): void {
    socket?.emit('endAudioSession', { bookingId });
  },

  joinVideoSession(
    bookingId: string,
    token: string,
    onWaitingForOther: () => void,
    onWaitingForStart: (payload: VideoWaitingForStartPayload) => void,
    onSessionStarted: (payload: SessionStartedPayload) => void,
    onTimeRemaining: (seconds: number) => void,
    onWarning: () => void,
    onSessionTimeUp: () => void,
    onSessionEnded: () => void,
    onParticipantLeft?: () => void,
    onParticipantRejoined?: () => void,
    onSessionRefunded?: (payload: SessionRefundedPayload) => void,
    onSessionGraceEnded?: (message: string) => void,
    onError?: (message: string) => void,
    onPanditCamera?: (cameraOn: boolean) => void,
  ): void {
    if (!socket && currentToken) {
      ensureSocket(currentToken);
    }
    if (!socket) return;

    activeVideoBookingId = bookingId;
    activeVideoToken = token;
    clearSessionListeners();

    const handleWaitingForOther = () => {
      onWaitingForOther();
    };

    const handleWaitingForStart = (payload: unknown) => {
      const parsed = parseVideoWaitingForStart(payload);
      if (!parsed) return;
      onWaitingForStartHandler?.({ bookingId, startsAt: parsed.startsAt });
      onWaitingForStart(parsed);
    };

    const handleSessionStarted = (payload: unknown) => {
      const parsed = parseSessionStarted(payload);
      if (parsed) {
        activeSessionDurationMinutes = parsed.durationMinutes;
        onSessionStarted(parsed);
      }
    };

    const handleTimeRemaining = (payload: unknown) => {
      const seconds = parseTimeRemainingSeconds(payload);
      if (seconds !== null) onTimeRemaining(seconds);
    };

    const handleWarning = () => {
      onWarning();
    };

    const handleSessionTimeUp = () => {
      onSessionTimeUp();
    };

    const handleSessionEnded = () => {
      onSessionEnded();
    };

    const handleParticipantLeft = () => {
      onParticipantLeft?.();
    };

    const handleParticipantRejoined = () => {
      onParticipantRejoined?.();
    };

    const handleSessionRefunded = (payload: unknown) => {
      const parsed = parseSessionRefunded(payload);
      if (parsed) onSessionRefunded?.(parsed);
    };

    const handleSessionGraceEnded = (payload: unknown) => {
      const record = asRecord(payload);
      const message = str(record?.message, 'Session ended with refund.');
      onSessionGraceEnded?.(message);
    };

    const handleVideoCameraState = (payload: unknown) => {
      const record = asRecord(payload);
      if (!record || record.senderRole !== 'pandit') return;
      if (typeof record.cameraOn !== 'boolean') return;
      onPanditCamera?.(record.cameraOn);
    };

    const emitJoin = () => {
      if (!socket) return;
      console.log('[ChatSocket] emitting joinVideoSession for bookingId:', bookingId);
      addSessionListener('videoWaitingForOther', handleWaitingForOther);
      addSessionListener('videoWaitingForStart', handleWaitingForStart);
      addSessionListener('videoSessionStarted', handleSessionStarted);
      addSessionListener('timeRemaining', handleTimeRemaining);
      addSessionListener('warningFiveMinutes', handleWarning);
      addSessionListener('videoSessionTimeUp', handleSessionTimeUp);
      addSessionListener('videoSessionEnded', handleSessionEnded);
      addSessionListener('videoParticipantLeft', handleParticipantLeft);
      addSessionListener('videoParticipantRejoined', handleParticipantRejoined);
      addSessionListener('sessionRefunded', handleSessionRefunded);
      addSessionListener('sessionGraceEnded', handleSessionGraceEnded);
      addSessionListener('videoCameraState', handleVideoCameraState);
      if (onError) {
        addSessionListener('error', (payload: unknown) => {
          const record = asRecord(payload);
          onError(str(record?.message, 'An unexpected error occurred'));
        });
      }
      socket.emit('joinVideoSession', { bookingId, token });
    };

    if (socket.connected) {
      emitJoin();
    } else {
      socket.once('connect', emitJoin);
    }
  },

  leaveVideoSession(bookingId: string): void {
    socket?.emit('leaveVideoSession', { bookingId });
    activeVideoBookingId = null;
    activeVideoToken = null;
  },

  endVideoSession(bookingId: string): void {
    socket?.emit('endVideoSession', { bookingId });
  },

  requestGraceRefund(bookingId: string, timeoutMs = 8000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!socket && currentToken) {
        ensureSocket(currentToken);
      }
      if (!socket) {
        reject(new Error('Not connected to chat server'));
        return;
      }

      const cleanup = () => {
        socket?.off('sessionRefunded', onRefunded);
        socket?.off('sessionGraceEnded', onGraceEnded);
        socket?.off('error', onError);
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
      };

      const onRefunded = () => {
        cleanup();
        resolve();
      };

      const onGraceEnded = () => {
        cleanup();
        resolve();
      };

      const onError = (payload: unknown) => {
        cleanup();
        const record = asRecord(payload);
        reject(new Error(str(record?.message, 'Grace refund failed')));
      };

      let timeoutId: ReturnType<typeof setTimeout> | null = setTimeout(() => {
        cleanup();
        reject(new Error('Grace refund timed out'));
      }, timeoutMs);

      const emitRequest = () => {
        socket?.on('sessionRefunded', onRefunded);
        socket?.on('sessionGraceEnded', onGraceEnded);
        socket?.on('error', onError);
        socket?.emit('requestGraceRefund', { bookingId });
      };

      if (socket.connected) {
        emitRequest();
      } else {
        socket.once('connect', emitRequest);
        connectWhenAllowed();
      }
    });
  },

  emitVideoCameraState(bookingId: string, cameraOn: boolean): void {
    socket?.emit('videoCameraState', { bookingId, cameraOn });
  },

  removeAllListeners(): void {
    clearSessionListeners();
    activeBookingId = null;
    backgroundBookingId = null;
    activeSessionDurationMinutes = null;
    activeAudioBookingId = null;
    activeAudioToken = null;
    activeVideoBookingId = null;
    activeVideoToken = null;
  },
};
