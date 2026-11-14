import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Toast } from '../components/Toast';
import type { ChatMessage } from '../types';
import { chatSocket } from '../lib/chatSocket';
import { formatTimer } from '../lib/format';
import { useNotificationStore } from '../store/useNotificationStore';
import { usePanditStore } from '../store/usePanditStore';
import styles from './ChatSession.module.css';

const TYPING_DEBOUNCE_MS = 800;
const TYPING_HIDE_MS = 2000;

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export function ChatSession() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const accessToken = usePanditStore((state) => state.accessToken);
  const userId = usePanditStore((state) => state.userId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [timerLabel, setTimerLabel] = useState('--:--');
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTyping, setUserTyping] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const endTimeMsRef = useRef<number | null>(null);
  const sessionActiveRef = useRef(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const hideTypingRef = useRef<number | null>(null);
  const lastTypingEmitRef = useRef(0);
  const joinToastShownRef = useRef(false);
  const sessionEndedRef = useRef(false);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleGraceEnded = useCallback(
    (message: string) => {
      if (sessionEndedRef.current) return;
      sessionEndedRef.current = true;
      window.alert(message);
      chatSocket.removeAllListeners();
      navigate('/dashboard', { replace: true });
    },
    [navigate],
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages, userTyping, scrollToBottom]);

  useEffect(() => {
    if (!bookingId || !accessToken) {
      navigate('/dashboard', { replace: true });
      return;
    }

    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;

      setConnecting(true);
      setError(null);
      chatSocket.connect(accessToken);

      chatSocket.joinSession(bookingId, {
        onJoined: () => {
          if (cancelled) return;
          setConnecting(false);
        },
        onMessage: (message) => {
          if (cancelled) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });
        },
        onTyping: (payload) => {
          if (cancelled || payload.userId === userId) return;
          setUserTyping(true);
          if (hideTypingRef.current) window.clearTimeout(hideTypingRef.current);
          hideTypingRef.current = window.setTimeout(() => {
            setUserTyping(false);
          }, TYPING_HIDE_MS);
        },
        onWaitingForPandit: () => {
          if (cancelled) return;
          sessionActiveRef.current = false;
          endTimeMsRef.current = null;
          setTimerLabel('--:--');
        },
        onSessionStarted: ({ endTime }) => {
          if (cancelled) return;
          sessionActiveRef.current = true;
          endTimeMsRef.current = endTime;
          const secondsLeft = Math.max(
            0,
            Math.floor((endTime - Date.now()) / 1000),
          );
          setTimerLabel(formatTimer(secondsLeft));
          useNotificationStore.getState().prependLocal({
            type: 'session_started',
            title: 'Session started',
            body: 'The user has joined your chat session.',
            bookingId,
            id: `local:session_started:${bookingId}`,
          });
          if (!joinToastShownRef.current) {
            joinToastShownRef.current = true;
            setToast({ message: 'User joined the session', type: 'success' });
          }
        },
        onTimeRemaining: ({ remainingSeconds }) => {
          if (cancelled || !sessionActiveRef.current) return;
          setTimerLabel(formatTimer(remainingSeconds));
        },
        onSessionEnded: () => {
          if (cancelled) return;
          chatSocket.disconnect();
          navigate('/dashboard?sessionCompleted=1', { replace: true });
        },
        onSessionGraceEnded: ({ message }) => {
          if (cancelled) return;
          handleGraceEnded(message);
        },
        onError: (message) => {
          if (cancelled) return;
          setConnecting(false);
          setError(message);
        },
      });
    })();

    return () => {
      cancelled = true;
      chatSocket.removeAllListeners();
      const typingTimeout = typingTimeoutRef;
      const hideTyping = hideTypingRef;
      if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
      if (hideTyping.current) window.clearTimeout(hideTyping.current);
    };
  }, [accessToken, bookingId, handleGraceEnded, navigate, userId]);

  function handleDraftChange(value: string) {
    setDraft(value);
    if (!bookingId) return;

    const now = Date.now();
    if (now - lastTypingEmitRef.current > TYPING_DEBOUNCE_MS) {
      chatSocket.sendTyping(bookingId);
      lastTypingEmitRef.current = now;
    }
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || !bookingId) return;
    chatSocket.sendMessage(bookingId, text);
    setDraft('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleLeave() {
    if (!bookingId) return;
    if (!window.confirm('Leave this session? The seeker stays. Only they can end it.')) return;
    chatSocket.leaveSession(bookingId);
    chatSocket.removeAllListeners();
    navigate('/dashboard', { replace: true });
  }

  if (!bookingId) {
    return null;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Chat Session</h1>
        <span className={styles.timer}>{timerLabel}</span>
        <button
          type="button"
          className={styles.endBtn}
          onClick={handleLeave}
        >
          Leave Session
        </button>
      </header>

      {error && <div className={styles.banner}>{error}</div>}

      {connecting ? (
        <div className={styles.loading}>Connecting to session…</div>
      ) : (
        <>
          <div className={styles.messages}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.messageRow} ${
                  msg.senderRole === 'pandit'
                    ? styles.messageRowPandit
                    : styles.messageRowUser
                }`}
              >
                <div
                  className={`${styles.bubble} ${
                    msg.senderRole === 'pandit'
                      ? styles.bubblePandit
                      : styles.bubbleUser
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.typing}>
            {userTyping ? 'User is typing…' : '\u00a0'}
          </div>

          <footer className={styles.footer}>
            <input
              className={styles.input}
              type="text"
              placeholder="Type a message…"
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!draft.trim()}
            >
              Send
            </button>
          </footer>
        </>
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={dismissToast}
        />
      )}
    </div>
  );
}
