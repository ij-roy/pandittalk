import { io, type Socket } from 'socket.io-client';
import type {
  ChatMessage,
  NewBookingCreatedPayload,
  Notification,
  SenderRole,
  SessionJoinedPayload,
  SessionStartedPayload,
  SocketErrorPayload,
  TimeRemainingPayload,
  TypingIndicatorPayload,
} from '../types';
import { getApiBase } from './api';
import { normalizeNotificationPayload } from './notificationApi';
import { getStoredToken } from '../store/usePanditStore';

type SessionListener = {
  event: string;
  handler: (...args: unknown[]) => void;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeSenderRole(value: unknown): SenderRole | null {
  if (value === 'user' || value === 'pandit') return value;
  return null;
}

function parseEndTimeMs(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value) {
    const ms = new Date(value).getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

function parseAudioWaitingForStart(
  raw: unknown,
): { startsAt: string } | null {
  const record = asRecord(raw);
  if (!record) return null;

  const startsAt =
    typeof record.startsAt === 'string'
      ? record.startsAt
      : typeof record.starts_at === 'string'
        ? record.starts_at
        : '';
  if (!startsAt) return null;

  return { startsAt };
}

function parseTimeRemainingSeconds(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(0, Math.floor(raw));
  }
  const record = asRecord(raw);
  if (!record) return null;
  const secondsRaw =
    record.secondsLeft ??
    record.seconds ??
    record.remainingSeconds ??
    record.timeRemaining ??
    record.time_remaining;
  if (typeof secondsRaw === 'number' && Number.isFinite(secondsRaw)) {
    return Math.max(0, Math.floor(secondsRaw));
  }
  if (typeof secondsRaw === 'string' && secondsRaw.trim()) {
    const parsed = Number(secondsRaw);
    if (Number.isFinite(parsed)) return Math.max(0, Math.floor(parsed));
  }
  return null;
}

function normalizeMessage(
  raw: unknown,
  bookingIdFallback = '',
): ChatMessage | null {
  const record = asRecord(raw);
  if (!record) return null;

  const senderId =
    typeof record.senderId === 'string' ? record.senderId : '';
  const senderRole = normalizeSenderRole(record.senderRole);
  const text =
    typeof record.message === 'string'
      ? record.message
      : typeof record.text === 'string'
        ? record.text
        : '';
  const timestamp =
    typeof record.timestamp === 'number' ? record.timestamp : Date.now();

  if (!senderId || !senderRole || !text.trim()) return null;

  const bookingId =
    typeof record.sessionId === 'string'
      ? record.sessionId
      : typeof record.bookingId === 'string'
        ? record.bookingId
        : bookingIdFallback;

  return {
    id: `${timestamp}-${senderId}-${bookingId}`,
    senderId,
    senderRole,
    text: text.trim(),
    timestamp,
  };
}

let socket: Socket | null = null;
let sessionListeners: SessionListener[] = [];
let dashboardListeners: SessionListener[] = [];
let activeBookingId: string | null = null;
let activeAudioBookingId: string | null = null;
let activeAudioToken: string | null = null;
let activeVideoBookingId: string | null = null;
let activeVideoToken: string | null = null;
let hasConnectedOnce = false;
let pendingDashboardJoin = false;
let onWaitingForStartHandler:
  | ((payload: { bookingId: string; startsAt: string }) => void)
  | null = null;

function parseNewBookingCreated(raw: unknown): NewBookingCreatedPayload | null {
  const record = asRecord(raw);
  if (!record) return null;

  const bookingId =
    typeof record.bookingId === 'string' ? record.bookingId : '';
  const panditId =
    typeof record.panditId === 'string' ? record.panditId : '';
  const area = typeof record.area === 'string' ? record.area : '';
  if (!bookingId || !panditId) return null;

  return { bookingId, panditId, area };
}

function emitJoinPanditDashboard(activeSocket: Socket): void {
  if (!pendingDashboardJoin) return;
  const token = getStoredToken();
  if (!token) return;
  activeSocket.emit('joinPanditDashboard', { token });
}

function ensureSocket(accessToken: string): Socket {
  if (socket) {
    socket.auth = { token: accessToken };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(`${getApiBase()}/chat`, {
    auth: { token: accessToken },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => {
    emitJoinPanditDashboard(socket!);
    if (activeAudioBookingId && activeAudioToken && hasConnectedOnce) {
      socket?.emit('joinAudioSession', {
        bookingId: activeAudioBookingId,
        token: activeAudioToken,
      });
    }
    if (activeVideoBookingId && activeVideoToken && hasConnectedOnce) {
      socket?.emit('joinVideoSession', {
        bookingId: activeVideoBookingId,
        token: activeVideoToken,
      });
    }
    hasConnectedOnce = true;
  });

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

function addSessionListener(
  event: string,
  handler: (...args: unknown[]) => void,
): void {
  if (!socket) return;
  socket.on(event, handler);
  sessionListeners.push({ event, handler });
}

function clearDashboardListeners(): void {
  if (!socket) {
    dashboardListeners = [];
    return;
  }
  for (const { event, handler } of dashboardListeners) {
    socket.off(event, handler);
  }
  dashboardListeners = [];
}

function addDashboardListener(
  event: string,
  handler: (...args: unknown[]) => void,
): void {
  if (!socket) return;
  socket.on(event, handler);
  dashboardListeners.push({ event, handler });
}

export const chatSocket = {
  connect(accessToken: string): void {
    ensureSocket(accessToken);
  },

  joinPanditDashboard(): void {
    pendingDashboardJoin = true;
    const token = getStoredToken();
    if (!token) return;
    const activeSocket = ensureSocket(token);
    if (activeSocket.connected) {
      emitJoinPanditDashboard(activeSocket);
    }
  },

  setOnWaitingForStart(
    handler: ((payload: { bookingId: string; startsAt: string }) => void) | null,
  ): void {
    onWaitingForStartHandler = handler;
  },

  disconnect(): void {
    clearSessionListeners();
    clearDashboardListeners();
    activeBookingId = null;
    activeAudioBookingId = null;
    activeAudioToken = null;
    activeVideoBookingId = null;
    activeVideoToken = null;
    pendingDashboardJoin = false;
    onWaitingForStartHandler = null;
    socket?.disconnect();
    socket = null;
  },

  onNewNotification(
    handler: (notification: Notification) => void,
  ): () => void {
    const token = getStoredToken();
    if (!token) {
      return () => {};
    }

    ensureSocket(token);

    const wrapped = (raw: unknown) => {
      const notification = normalizeNotificationPayload(raw);
      if (notification) handler(notification);
    };

    addDashboardListener('newNotification', wrapped);

    return () => {
      if (!socket) return;
      socket.off('newNotification', wrapped);
      dashboardListeners = dashboardListeners.filter(
        (l) => l.event !== 'newNotification' || l.handler !== wrapped,
      );
    };
  },

  onNewBookingCreated(
    handler: (payload: NewBookingCreatedPayload) => void,
  ): () => void {
    const token = getStoredToken();
    if (!token) {
      return () => {};
    }

    ensureSocket(token);

    const wrapped = (raw: unknown) => {
      const payload = parseNewBookingCreated(raw);
      if (payload) handler(payload);
    };

    addDashboardListener('newBookingCreated', wrapped);

    return () => {
      if (!socket) return;
      socket.off('newBookingCreated', wrapped);
      dashboardListeners = dashboardListeners.filter(
        (l) => l.event !== 'newBookingCreated' || l.handler !== wrapped,
      );
    };
  },

  getActiveBookingId(): string | null {
    return activeBookingId ?? activeAudioBookingId ?? activeVideoBookingId;
  },

  joinSession(
    bookingId: string,
    handlers: {
      onJoined: (payload: SessionJoinedPayload) => void;
      onMessage: (message: ChatMessage) => void;
      onTyping: (payload: TypingIndicatorPayload) => void;
      onTimeRemaining?: (payload: TimeRemainingPayload) => void;
      onWaitingForPandit?: () => void;
      onSessionStarted?: (payload: SessionStartedPayload) => void;
      onSessionEnded: () => void;
      onSessionGraceEnded?: (payload: { bookingId: string; message: string }) => void;
      onError: (message: string) => void;
    },
  ): void {
    const token = getStoredToken();
    if (!token) {
      handlers.onError('Not authenticated');
      return;
    }

    const activeSocket = ensureSocket(token);
    clearSessionListeners();
    activeBookingId = bookingId;

    const handleSessionJoined = (payload: unknown) => {
      const record = asRecord(payload);
      if (!record) return;

      const messagesRaw = record.messages;
      const messages = Array.isArray(messagesRaw)
        ? messagesRaw
            .map((item) => normalizeMessage(item, bookingId))
            .filter((item): item is ChatMessage => item !== null)
        : [];

      const durationMinutes =
        typeof record.durationMinutes === 'number'
          ? record.durationMinutes
          : 0;
      const endTime =
        typeof record.endTime === 'string' ? record.endTime : '';
      const joinedBookingId =
        typeof record.bookingId === 'string' ? record.bookingId : bookingId;

      handlers.onJoined({
        bookingId: joinedBookingId,
        messages: messages.map((msg) => ({
          sessionId: bookingId,
          senderId: msg.senderId,
          senderRole: msg.senderRole,
          message: msg.text,
          timestamp: msg.timestamp,
        })),
        durationMinutes,
        endTime,
      });

      for (const msg of messages) {
        handlers.onMessage(msg);
      }
    };

    const handleNewMessage = (payload: unknown) => {
      const message = normalizeMessage(payload, bookingId);
      if (message) handlers.onMessage(message);
    };

    const handleTyping = (payload: unknown) => {
      const record = asRecord(payload);
      if (!record) return;
      const typedBookingId =
        typeof record.bookingId === 'string' ? record.bookingId : bookingId;
      const userId =
        typeof record.userId === 'string' ? record.userId : '';
      if (typedBookingId && userId) {
        handlers.onTyping({ bookingId: typedBookingId, userId });
      }
    };

    const handleTimeRemaining = (payload: unknown) => {
      const remainingSeconds = parseTimeRemainingSeconds(payload);
      if (remainingSeconds === null) return;
      const record = asRecord(payload);
      const typedBookingId =
        record && typeof record.bookingId === 'string' ? record.bookingId : bookingId;
      handlers.onTimeRemaining?.({ bookingId: typedBookingId, remainingSeconds });
    };

    const handleWaitingForPandit = () => {
      handlers.onWaitingForPandit?.();
    };

    const handleSessionStarted = (payload: unknown) => {
      const record = asRecord(payload);
      if (!record) return;

      const endTimeMs = parseEndTimeMs(record.endTime);
      if (endTimeMs === null) return;

      const startedAt =
        typeof record.startedAt === 'string' || typeof record.startedAt === 'number'
          ? record.startedAt
          : Date.now();
      const durationMinutes =
        typeof record.durationMinutes === 'number' ? record.durationMinutes : 0;

      handlers.onSessionStarted?.({
        startedAt,
        endTime: endTimeMs,
        durationMinutes,
      });
    };

    const handleSessionEnded = () => {
      handlers.onSessionEnded();
    };

    const handleSessionGraceEnded = (payload: unknown) => {
      const record = asRecord(payload);
      const typedBookingId =
        record && typeof record.bookingId === 'string' ? record.bookingId : bookingId;
      const message =
        record && typeof record.message === 'string'
          ? record.message
          : 'Session ended with refund.';
      handlers.onSessionGraceEnded?.({ bookingId: typedBookingId, message });
    };

    const handleError = (payload: unknown) => {
      const record = asRecord(payload) as SocketErrorPayload | null;
      handlers.onError(record?.message ?? 'Chat error');
    };

    addSessionListener('sessionJoined', handleSessionJoined);
    addSessionListener('newMessage', handleNewMessage);
    addSessionListener('typingIndicator', handleTyping);
    addSessionListener('timeRemaining', handleTimeRemaining);
    addSessionListener('waitingForPandit', handleWaitingForPandit);
    addSessionListener('sessionStarted', handleSessionStarted);
    addSessionListener('sessionEnded', handleSessionEnded);
    addSessionListener('sessionTimeUp', handleSessionEnded);
    addSessionListener('sessionGraceEnded', handleSessionGraceEnded);
    addSessionListener('error', handleError);

    const emitJoin = () => {
      activeSocket.emit('joinSession', { bookingId });
    };

    if (activeSocket.connected) {
      emitJoin();
    } else {
      activeSocket.once('connect', emitJoin);
    }
  },

  sendMessage(bookingId: string, message: string): void {
    socket?.emit('sendMessage', { bookingId, message });
  },

  sendTyping(bookingId: string): void {
    socket?.emit('typing', { bookingId });
  },

  endSession(bookingId: string): void {
    socket?.emit('endSession', { bookingId });
  },

  leaveSession(bookingId: string): void {
    socket?.emit('leaveSession', { bookingId });
    if (activeBookingId === bookingId) {
      activeBookingId = null;
    }
  },

  joinAudioSession(
    bookingId: string,
    token: string,
    handlers: {
      onWaitingForOther: () => void;
      onWaitingForStart?: (payload: { startsAt: string }) => void;
      onSessionStarted: (payload: SessionStartedPayload) => void;
      onTimeRemaining?: (seconds: number) => void;
      onWarning?: () => void;
      onSessionTimeUp: () => void;
      onSessionEnded: () => void;
      onParticipantLeft?: () => void;
      onParticipantRejoined?: () => void;
      onSessionGraceEnded?: (payload: { bookingId: string; message: string }) => void;
      onError: (message: string) => void;
    },
  ): void {
    const activeSocket = ensureSocket(token);
    clearSessionListeners();
    activeAudioBookingId = bookingId;
    activeAudioToken = token;

    const handleWaitingForOther = () => {
      handlers.onWaitingForOther();
    };

    const handleWaitingForStart = (payload: unknown) => {
      const parsed = parseAudioWaitingForStart(payload);
      if (!parsed) return;
      onWaitingForStartHandler?.({
        bookingId,
        startsAt: parsed.startsAt,
      });
      handlers.onWaitingForStart?.(parsed);
    };

    const handleSessionStarted = (payload: unknown) => {
      const record = asRecord(payload);
      if (!record) return;

      const endTimeMs = parseEndTimeMs(record.endTime);
      if (endTimeMs === null) return;

      const startedAt =
        typeof record.startedAt === 'string' ||
        typeof record.startedAt === 'number'
          ? record.startedAt
          : Date.now();
      const durationMinutes =
        typeof record.durationMinutes === 'number'
          ? record.durationMinutes
          : 0;

      handlers.onSessionStarted({
        startedAt,
        endTime: endTimeMs,
        durationMinutes,
      });
    };

    const handleTimeRemaining = (payload: unknown) => {
      const seconds = parseTimeRemainingSeconds(payload);
      if (seconds !== null) handlers.onTimeRemaining?.(seconds);
    };

    const handleWarning = () => {
      handlers.onWarning?.();
    };

    const handleSessionTimeUp = () => {
      handlers.onSessionTimeUp();
    };

    const handleSessionEnded = () => {
      handlers.onSessionEnded();
    };

    const handleParticipantLeft = () => {
      handlers.onParticipantLeft?.();
    };

    const handleParticipantRejoined = () => {
      handlers.onParticipantRejoined?.();
    };

    const handleSessionGraceEnded = (payload: unknown) => {
      const record = asRecord(payload);
      if (!record) return;
      const id = typeof record.bookingId === 'string' ? record.bookingId : bookingId;
      const message =
        typeof record.message === 'string'
          ? record.message
          : 'The user ended this session during the trial period.';
      handlers.onSessionGraceEnded?.({ bookingId: id, message });
    };

    const handleError = (payload: unknown) => {
      const record = asRecord(payload) as SocketErrorPayload | null;
      handlers.onError(record?.message ?? 'Audio session error');
    };

    const emitJoin = () => {
      addSessionListener('audioWaitingForOther', handleWaitingForOther);
      addSessionListener('audioWaitingForStart', handleWaitingForStart);
      addSessionListener('audioSessionStarted', handleSessionStarted);
      addSessionListener('timeRemaining', handleTimeRemaining);
      addSessionListener('warningFiveMinutes', handleWarning);
      addSessionListener('audioSessionTimeUp', handleSessionTimeUp);
      addSessionListener('audioSessionEnded', handleSessionEnded);
      addSessionListener('audioParticipantLeft', handleParticipantLeft);
      addSessionListener('audioParticipantRejoined', handleParticipantRejoined);
      addSessionListener('sessionGraceEnded', handleSessionGraceEnded);
      addSessionListener('error', handleError);
      activeSocket.emit('joinAudioSession', { bookingId, token });
    };

    if (activeSocket.connected) {
      emitJoin();
    } else {
      activeSocket.once('connect', emitJoin);
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
    handlers: {
      onWaitingForOther: () => void;
      onWaitingForStart?: (payload: { startsAt: string }) => void;
      onSessionStarted: (payload: SessionStartedPayload) => void;
      onTimeRemaining?: (seconds: number) => void;
      onWarning?: () => void;
      onSessionTimeUp: () => void;
      onSessionEnded: () => void;
      onParticipantLeft?: () => void;
      onParticipantRejoined?: () => void;
      onSessionGraceEnded?: (payload: { bookingId: string; message: string }) => void;
      onVideoCameraState?: (payload: {
        bookingId: string;
        cameraOn: boolean;
        senderRole?: 'user' | 'pandit';
      }) => void;
      onError: (message: string) => void;
    },
  ): void {
    const activeSocket = ensureSocket(token);
    clearSessionListeners();
    activeVideoBookingId = bookingId;
    activeVideoToken = token;

    const handleWaitingForOther = () => {
      handlers.onWaitingForOther();
    };

    const handleWaitingForStart = (payload: unknown) => {
      const parsed = parseAudioWaitingForStart(payload);
      if (!parsed) return;
      onWaitingForStartHandler?.({
        bookingId,
        startsAt: parsed.startsAt,
      });
      handlers.onWaitingForStart?.(parsed);
    };

    const handleSessionStarted = (payload: unknown) => {
      const record = asRecord(payload);
      if (!record) return;

      const endTimeMs = parseEndTimeMs(record.endTime);
      if (endTimeMs === null) return;

      const startedAt =
        typeof record.startedAt === 'string' ||
        typeof record.startedAt === 'number'
          ? record.startedAt
          : Date.now();
      const durationMinutes =
        typeof record.durationMinutes === 'number'
          ? record.durationMinutes
          : 0;

      handlers.onSessionStarted({
        startedAt,
        endTime: endTimeMs,
        durationMinutes,
      });
    };

    const handleTimeRemaining = (payload: unknown) => {
      const seconds = parseTimeRemainingSeconds(payload);
      if (seconds !== null) handlers.onTimeRemaining?.(seconds);
    };

    const handleWarning = () => {
      handlers.onWarning?.();
    };

    const handleSessionTimeUp = () => {
      handlers.onSessionTimeUp();
    };

    const handleSessionEnded = () => {
      handlers.onSessionEnded();
    };

    const handleParticipantLeft = () => {
      handlers.onParticipantLeft?.();
    };

    const handleParticipantRejoined = () => {
      handlers.onParticipantRejoined?.();
    };

    const handleSessionGraceEnded = (payload: unknown) => {
      const record = asRecord(payload);
      if (!record) return;
      const id = typeof record.bookingId === 'string' ? record.bookingId : bookingId;
      const message =
        typeof record.message === 'string'
          ? record.message
          : 'The user ended this session during the trial period.';
      handlers.onSessionGraceEnded?.({ bookingId: id, message });
    };

    const handleVideoCameraState = (payload: unknown) => {
      const record = asRecord(payload);
      if (!record) return;
      if (typeof record.cameraOn !== 'boolean') return;
      const senderRole =
        record.senderRole === 'pandit' || record.senderRole === 'user'
          ? record.senderRole
          : undefined;
      handlers.onVideoCameraState?.({
        bookingId:
          typeof record.bookingId === 'string' ? record.bookingId : bookingId,
        cameraOn: record.cameraOn,
        senderRole,
      });
    };

    const handleError = (payload: unknown) => {
      const record = asRecord(payload) as SocketErrorPayload | null;
      handlers.onError(record?.message ?? 'Video session error');
    };

    const emitJoin = () => {
      addSessionListener('videoWaitingForOther', handleWaitingForOther);
      addSessionListener('videoWaitingForStart', handleWaitingForStart);
      addSessionListener('videoSessionStarted', handleSessionStarted);
      addSessionListener('timeRemaining', handleTimeRemaining);
      addSessionListener('warningFiveMinutes', handleWarning);
      addSessionListener('videoSessionTimeUp', handleSessionTimeUp);
      addSessionListener('videoSessionEnded', handleSessionEnded);
      addSessionListener('videoParticipantLeft', handleParticipantLeft);
      addSessionListener('videoParticipantRejoined', handleParticipantRejoined);
      addSessionListener('sessionGraceEnded', handleSessionGraceEnded);
      addSessionListener('videoCameraState', handleVideoCameraState);
      addSessionListener('error', handleError);
      activeSocket.emit('joinVideoSession', { bookingId, token });
    };

    if (activeSocket.connected) {
      emitJoin();
    } else {
      activeSocket.once('connect', emitJoin);
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

  emitVideoCameraState(bookingId: string, cameraOn: boolean): void {
    socket?.emit('videoCameraState', { bookingId, cameraOn });
  },

  removeAllListeners(): void {
    clearSessionListeners();
    activeBookingId = null;
    activeAudioBookingId = null;
    activeAudioToken = null;
    activeVideoBookingId = null;
    activeVideoToken = null;
  },
};
