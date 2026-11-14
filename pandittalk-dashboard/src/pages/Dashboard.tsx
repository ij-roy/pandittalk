import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Toast } from '../components/Toast';
import {
  setBookingRefreshHandler,
  setNotificationToastHandler,
} from '../lib/notificationEvents';
import {
  fetchPanditBookings,
  fetchPanditMe,
  getErrorMessage,
  getSharedContextForBooking,
  getUserDetailsForBooking,
  logoutSession,
  cancelBookingAsPandit,
  updatePresence,
  type SharedBookingContext,
} from '../lib/api';
import { chatSocket } from '../lib/chatSocket';
import {
  capitalize,
  formatDateOfBirth,
  formatDayHeader,
  formatTimeIST,
  formatWeekRange,
  getISTYmd,
  getWeekDaysIST,
  isFutureDayIST,
  isPastDayIST,
  isTodayYmdIST,
} from '../lib/format';
import { usePanditStore } from '../store/usePanditStore';
import type { BookingListItem, BookingUserDetails } from '../types';
import {
  applyTheme,
  formatOnlineDuration,
  loadWorkspacePrefs,
  saveWorkspacePrefs,
  tickOnlineSeconds,
} from '../lib/workspacePrefs';
import styles from './Dashboard.module.css';

const REFRESH_INTERVAL_MS = 15_000;
const NOW_TICK_MS = 60_000;
const BOOKING_ALERT_MS = 5_000;
const PANDIT_SHARE = 0.7;

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}

function canJoinChat(booking: BookingListItem, now: number): boolean {
  if (booking.format !== 'chat' || booking.status !== 'confirmed') return false;

  const start = new Date(booking.startTime).getTime();
  const end = start + booking.durationMinutes * 60_000;
  const windowStart = start - 15 * 60_000;

  return now >= windowStart && now < end;
}

function getBookingEndTime(booking: BookingListItem): Date {
  const withEnd = booking as BookingListItem & { endTime?: string };
  if (withEnd.endTime) return new Date(withEnd.endTime);
  return new Date(
    new Date(booking.startTime).getTime() + booking.durationMinutes * 60 * 1000,
  );
}

function canJoinCall(booking: BookingListItem): boolean {
  const now = new Date();
  const windowStart = new Date(
    new Date(booking.startTime).getTime() - 15 * 60 * 1000,
  );
  const windowEnd = getBookingEndTime(booking);
  return (
    (booking.format === 'audio' || booking.format === 'video') &&
    booking.status === 'confirmed' &&
    now >= windowStart &&
    now <= windowEnd
  );
}

function getCallRoute(booking: BookingListItem): string {
  return booking.format === 'video' ? '/session/video/' : '/session/audio/';
}

function isCallScheduled(booking: BookingListItem): boolean {
  if (booking.format !== 'audio' && booking.format !== 'video') return false;
  if (booking.status !== 'confirmed') return false;
  const now = new Date();
  const windowStart = new Date(
    new Date(booking.startTime).getTime() - 30 * 60 * 1000,
  );
  return now < windowStart;
}

function getStatusClass(status: string): string {
  if (status === 'confirmed') return styles.statusConfirmed;
  if (status === 'completed') return styles.statusCompleted;
  if (status === 'cancelled') return styles.statusCancelled;
  return '';
}

function getFormatClass(format: string): string {
  if (format === 'chat') return styles.formatChat;
  if (format === 'audio') return styles.formatAudio;
  if (format === 'video') return styles.formatVideo;
  return '';
}

function greetingForHour(date: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false,
    }).format(date),
  );
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatCountdown(startMs: number, now: number): string | null {
  const diff = startMs - now;
  if (diff <= 0) return 'Live now';
  const mins = Math.ceil(diff / 60_000);
  if (mins < 60) return `Starts in ${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `Starts in ${hours}h` : `Starts in ${hours}h ${rem}m`;
}

function formatRelativeSync(ts: number | null, now: number): string {
  if (!ts) return 'Not synced yet';
  const secs = Math.max(0, Math.round((now - ts) / 1000));
  if (secs < 15) return 'Updated just now';
  if (secs < 60) return `Updated ${secs}s ago`;
  const mins = Math.floor(secs / 60);
  return `Updated ${mins}m ago`;
}

function humanizeError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Connection issue. Check your internet and try again.';
  }
  if (lower.includes('401') || lower.includes('unauthorized')) {
    return 'Your session expired. Please sign in again.';
  }
  if (lower.includes('timeout')) {
    return 'That took too long. Please try again.';
  }
  return message;
}

function statusGlyph(status: string): string {
  if (status === 'confirmed') return '●';
  if (status === 'completed') return '✓';
  if (status === 'cancelled') return '—';
  return '·';
}

interface UserDetailsPanelProps {
  booking: BookingListItem;
  details: BookingUserDetails | undefined;
  loading: boolean;
  error: boolean;
  sharedContexts: SharedBookingContext[] | undefined;
  contextsLoading: boolean;
}

function UserDetailsPanel({
  booking,
  details,
  loading,
  error,
  sharedContexts,
  contextsLoading,
}: UserDetailsPanelProps) {
  if (loading) {
    return (
      <div className={`${styles.userDetailsPanel} ${styles.detailsReveal}`}>
        <p className={styles.userDetailsStatus}>Loading...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className={`${styles.userDetailsPanel} ${styles.detailsReveal}`}>
        <p className={styles.userDetailsStatus}>
          Couldn&apos;t load this profile. Try again in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className={`${styles.userDetailsPanel} ${styles.detailsReveal}`}>
      <h4 className={styles.userDetailsTitle}>User Profile</h4>
      <div className={styles.userDetailsGrid}>
        {details.userName && (
          <div className={styles.userDetailsField}>
            <span className={styles.userDetailsLabel}>Name</span>
            <span className={styles.userDetailsValue}>{details.userName}</span>
          </div>
        )}
        {details.dob && (
          <div className={styles.userDetailsField}>
            <span className={styles.userDetailsLabel}>Date of Birth</span>
            <span className={styles.userDetailsValue}>
              {formatDateOfBirth(details.dob)}
            </span>
          </div>
        )}
        {details.placeOfBirth && (
          <div className={styles.userDetailsField}>
            <span className={styles.userDetailsLabel}>Place of Birth</span>
            <span className={styles.userDetailsValue}>
              {details.placeOfBirth}
            </span>
          </div>
        )}
        {details.zodiacSign && (
          <div className={styles.userDetailsField}>
            <span className={styles.userDetailsLabel}>Zodiac Sign</span>
            <span className={styles.userDetailsValue}>
              {capitalize(details.zodiacSign)}
            </span>
          </div>
        )}
        {details.maritalStatus && (
          <div className={styles.userDetailsField}>
            <span className={styles.userDetailsLabel}>Marital Status</span>
            <span className={styles.userDetailsValue}>
              {capitalize(details.maritalStatus)}
            </span>
          </div>
        )}
        {details.gender && (
          <div className={styles.userDetailsField}>
            <span className={styles.userDetailsLabel}>Gender</span>
            <span className={styles.userDetailsValue}>
              {capitalize(details.gender)}
            </span>
          </div>
        )}
      </div>
      {booking.notes && (
        <p className={styles.userConcern}>
          User&apos;s Concern: &quot;{booking.notes}&quot;
        </p>
      )}
      <div className={styles.intakeBlock}>
        <h5 className={styles.intakeTitle}>Shared intake</h5>
        {contextsLoading ? (
          <p className={styles.userDetailsStatus}>Loading intake…</p>
        ) : sharedContexts && sharedContexts.length > 0 ? (
          <ul className={styles.intakeList}>
            {sharedContexts.map((ctx) => (
              <li key={ctx.id}>{ctx.text}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.userDetailsStatus}>
            No shared context yet for this session.
          </p>
        )}
      </div>
    </div>
  );
}

interface BookingCardProps {
  booking: BookingListItem;
  now: number;
  expanded: boolean;
  details: BookingUserDetails | undefined;
  detailsLoading: boolean;
  detailsError: boolean;
  sharedContexts: SharedBookingContext[] | undefined;
  contextsLoading: boolean;
  joining: boolean;
  cancelling: boolean;
  isNoShow: boolean;
  onToggleDetails: (bookingId: string) => void;
  onJoin: (bookingId: string) => void;
  onJoinCall: (booking: BookingListItem) => void;
  onCancel: (booking: BookingListItem) => void;
  onToggleNoShow: (booking: BookingListItem) => void;
}

function BookingCard({
  booking,
  now,
  expanded,
  details,
  detailsLoading,
  detailsError,
  sharedContexts,
  contextsLoading,
  joining,
  cancelling,
  isNoShow,
  onToggleDetails,
  onJoin,
  onJoinCall,
  onCancel,
  onToggleNoShow,
}: BookingCardProps) {
  const startMs = new Date(booking.startTime).getTime();
  const endMs = getBookingEndTime(booking).getTime();
  const inWaitingRoom = now < startMs;
  const joinableChat = canJoinChat(booking, now);
  const joinableCall = canJoinCall(booking);
  const joinable = joinableChat || joinableCall;
  const countdown =
    booking.status === 'confirmed' ? formatCountdown(startMs, now) : null;
  const displayName = details?.userName?.trim() || null;
  const initials = displayName
    ? displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('') || 'U'
    : booking.area.charAt(0).toUpperCase();
  const canCancel =
    booking.status === 'confirmed' && now < startMs;
  const canMarkNoShow =
    booking.status === 'confirmed' && now >= endMs;

  return (
    <article
      className={`${styles.bookingCard} ${
        booking.status === 'cancelled' ? styles.bookingCardCancelled : ''
      } ${joinable ? styles.bookingCardJoinable : ''} ${
        isNoShow ? styles.bookingCardNoShow : ''
      }`}
    >
      {booking.status === 'cancelled' ? (
        <span className={styles.cancelledRibbon}>Cancelled</span>
      ) : null}
      {isNoShow ? (
        <span className={styles.noShowRibbon}>No-show</span>
      ) : null}
      <div className={styles.bookingCardTop}>
        <div className={styles.bookingIdentity}>
          <span className={styles.clientAvatar} aria-hidden>
            {initials}
          </span>
          <div>
            <div className={styles.bookingArea}>
              {displayName ||
                booking.area.charAt(0).toUpperCase() + booking.area.slice(1)}
            </div>
            <div className={styles.bookingMeta} style={{ marginTop: '0.15rem' }}>
              <span>
                {booking.area.charAt(0).toUpperCase() + booking.area.slice(1)}
              </span>
            </div>
          </div>
        </div>
        <span
          className={`${styles.formatBadge} ${getFormatClass(booking.format)}`}
        >
          {capitalize(booking.format)}
        </span>
      </div>
      <div className={styles.bookingMeta}>
        <span>
          {booking.durationMinutes} min · {capitalize(booking.depth)}
        </span>
        <span>{formatTimeIST(booking.startTime)}</span>
        <span
          className={`${styles.statusPill} ${getStatusClass(booking.status)}`}
        >
          <span aria-hidden>{statusGlyph(booking.status)}</span>{' '}
          {capitalize(booking.status)}
        </span>
      </div>
      {countdown && booking.status === 'confirmed' ? (
        <p className={styles.countdown}>
          {countdown === 'Live now' ? 'Live now — join when ready' : countdown}
        </p>
      ) : null}
      {booking.notes && !expanded && (
        <p className={styles.bookingConcern}>
          Concern: &quot;{booking.notes}&quot;
        </p>
      )}
      <div className={styles.bookingActions}>
        <button
          type="button"
          className={styles.viewDetailsBtn}
          onClick={() => onToggleDetails(booking.id)}
          aria-expanded={expanded}
        >
          <span className={styles.detailsChevron} aria-hidden>
            {expanded ? '▾' : '▸'}
          </span>
          {expanded ? 'Hide details' : 'Details'}
        </button>
        {joinableChat && (
          <button
            type="button"
            className={`btn btnPrimary ${styles.joinBtn}`}
            onClick={() => onJoin(booking.id)}
            disabled={joining}
          >
            {joining
              ? 'Joining…'
              : inWaitingRoom
                ? 'Enter waiting room'
                : 'Join chat'}
          </button>
        )}
        {joinableCall && (
          <button
            type="button"
            className={`btn btnPrimary ${styles.joinBtn}`}
            onClick={() => onJoinCall(booking)}
            disabled={joining}
          >
            {joining
              ? 'Joining…'
              : inWaitingRoom
                ? 'Join waiting room'
                : booking.format === 'audio'
                  ? 'Join audio call'
                  : 'Join video call'}
          </button>
        )}
        {canCancel ? (
          <button
            type="button"
            className={styles.dangerBtn}
            onClick={() => onCancel(booking)}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        ) : null}
        {canMarkNoShow ? (
          <button
            type="button"
            className={styles.viewDetailsBtn}
            onClick={() => onToggleNoShow(booking)}
          >
            {isNoShow ? 'Clear no-show' : 'Mark no-show'}
          </button>
        ) : null}
        {isCallScheduled(booking) && (
          <span className={styles.userDetailsStatus}>
            Scheduled {booking.format === 'audio' ? 'audio' : 'video'} —{' '}
            {formatTimeIST(booking.startTime)}
          </span>
        )}
      </div>
      {expanded && (
        <UserDetailsPanel
          booking={booking}
          details={details}
          loading={detailsLoading}
          error={detailsError}
          sharedContexts={sharedContexts}
          contextsLoading={contextsLoading}
        />
      )}
    </article>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const accessToken = usePanditStore((state) => state.accessToken);
  const panditId = usePanditStore((state) => state.panditId);
  const isOnline = usePanditStore((state) => state.isOnline);
  const bookings = usePanditStore((state) => state.bookings);
  const setPanditInfo = usePanditStore((state) => state.setPanditInfo);
  const setOnline = usePanditStore((state) => state.setOnline);
  const setBookings = usePanditStore((state) => state.setBookings);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [bookingAlert, setBookingAlert] = useState<{
    bookingId: string;
    format: string;
    area: string;
  } | null>(null);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(
    null,
  );
  const [detailsCache, setDetailsCache] = useState<
    Record<string, BookingUserDetails>
  >({});
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
  const [detailsErrorId, setDetailsErrorId] = useState<string | null>(null);
  const [expandedPastDays, setExpandedPastDays] = useState<Set<string>>(
    () => new Set(),
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [formatFilter, setFormatFilter] = useState<
    'all' | 'chat' | 'audio' | 'video'
  >('all');
  const [weekOffset, setWeekOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [failStreak, setFailStreak] = useState(0);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [noShowIds, setNoShowIds] = useState<string[]>(() => {
    try {
      return loadWorkspacePrefs().noShowBookingIds ?? [];
    } catch {
      return [];
    }
  });
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [scheduleView, setScheduleView] = useState<'day' | 'week'>('week');
  const [contextCache, setContextCache] = useState<
    Record<string, SharedBookingContext[]>
  >({});
  const [loadingContextId, setLoadingContextId] = useState<string | null>(null);
  const [onlineLabel, setOnlineLabel] = useState('Tracking presence…');
  const [milestone, setMilestone] = useState<string | null>(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    try {
      return window.localStorage.getItem('pt-onboarding-dismissed') === '1';
    } catch {
      return false;
    }
  });

  const knownBookingIdsRef = useRef<Set<string>>(new Set());
  const now = useNow(NOW_TICK_MS);
  const nowDate = useMemo(() => new Date(now), [now]);
  const panditName = usePanditStore((state) => state.panditName);

  const applyBookings = useCallback(
    (bookingList: BookingListItem[]) => {
      const prevIds = knownBookingIdsRef.current;
      if (prevIds.size > 0) {
        const newChatBooking = bookingList.find(
          (b) => b.format === 'chat' && !prevIds.has(b.id),
        );
        if (newChatBooking) {
          setBookingAlert({
            bookingId: newChatBooking.id,
            format: newChatBooking.format,
            area: newChatBooking.area,
          });
          try {
            const prefs = loadWorkspacePrefs();
            if (prefs.soundAlerts) {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.value = 880;
              gain.gain.value = 0.04;
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.18);
            }
          } catch {
            // Audio optional.
          }
        }
      }
      knownBookingIdsRef.current = new Set(bookingList.map((b) => b.id));
      setBookings(bookingList);
      setLastSyncedAt(Date.now());
    },
    [setBookings],
  );

  const loadBookings = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const bookingList = await fetchPanditBookings();
      applyBookings(bookingList);
      setError(null);
      setFailStreak(0);
    } catch (err) {
      setFailStreak((n) => n + 1);
      setError(humanizeError(getErrorMessage(err)));
    } finally {
      if (manual) setRefreshing(false);
    }
  }, [applyBookings]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [pandit, bookingList] = await Promise.all([
          fetchPanditMe(),
          fetchPanditBookings(),
        ]);
        if (cancelled) return;
        setPanditInfo(pandit.id, pandit.name, pandit.isOnline);
        knownBookingIdsRef.current = new Set(bookingList.map((b) => b.id));
        setBookings(bookingList);
        setLastSyncedAt(Date.now());
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const message = getErrorMessage(err);
        if (message.includes('No pandit profile linked')) {
          chatSocket.disconnect();
          void logoutSession().then(() => {
            navigate('/login', { replace: true });
          });
          return;
        }
        setError(humanizeError(message));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const interval = window.setInterval(() => {
      void loadBookings();
    }, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [loadBookings, navigate, setBookings, setPanditInfo]);

  useEffect(() => {
    setNotificationToastHandler((message, type = 'success') => {
      setToast({ message, type });
    });
    setBookingRefreshHandler(() => {
      void loadBookings();
    });
    return () => {
      setNotificationToastHandler(null);
      setBookingRefreshHandler(null);
    };
  }, [loadBookings]);

  useEffect(() => {
    if (!bookingAlert) return;
    const timer = window.setTimeout(() => {
      setBookingAlert(null);
    }, BOOKING_ALERT_MS);
    return () => window.clearTimeout(timer);
  }, [bookingAlert]);

  const weekDays = useMemo(
    () => getWeekDaysIST(nowDate, weekOffset),
    [nowDate, weekOffset],
  );

  const orderedWeekDays = useMemo(() => {
    const upcoming = weekDays.filter((d) => !isPastDayIST(d.ymd, nowDate));
    const past = weekDays.filter((d) => isPastDayIST(d.ymd, nowDate));
    const ordered = [...upcoming, ...past];
    if (scheduleView === 'day') {
      const today = ordered.find((d) => isTodayYmdIST(d.ymd, nowDate));
      return today ? [today] : ordered.slice(0, 1);
    }
    return ordered;
  }, [weekDays, nowDate, scheduleView]);

  useEffect(() => {
    const prefs = loadWorkspacePrefs();
    applyTheme(prefs.theme);
    const ymd = getISTYmd(nowDate);
    const next = tickOnlineSeconds(prefs, ymd);
    if (isOnline && !next.onlineStartedAt) {
      next.onlineStartedAt = Date.now();
    }
    saveWorkspacePrefs(next);
    setOnlineLabel(formatOnlineDuration(next.onlineSecondsToday));
  }, [isOnline, nowDate]);

  useEffect(() => {
    const done = searchParams.get('sessionCompleted');
    const coins = searchParams.get('earned');
    if (done) {
      setToast({
        message: coins
          ? `Session complete · about ₹${coins} estimated share`
          : 'Session complete. Nice work.',
        type: 'success',
      });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const weekBookings = useMemo(
    () =>
      bookings
        .filter((b) => {
          const ymd = getISTYmd(new Date(b.startTime));
          const inWeek = ymd >= weekDays[0].ymd && ymd <= weekDays[6].ymd;
          const formatOk =
            formatFilter === 'all' ? true : b.format === formatFilter;
          if (!inWeek || !formatOk) return false;
          const q = scheduleSearch.trim().toLowerCase();
          if (!q) return true;
          const details = detailsCache[b.id];
          const hay = [
            b.area,
            b.format,
            b.notes ?? '',
            details?.userName ?? '',
          ]
            .join(' ')
            .toLowerCase();
          return hay.includes(q);
        })
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
    [bookings, weekDays, formatFilter, scheduleSearch, detailsCache],
  );

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, BookingListItem[]>();
    for (const day of weekDays) {
      map.set(day.ymd, []);
    }
    for (const booking of weekBookings) {
      const ymd = getISTYmd(new Date(booking.startTime));
      map.get(ymd)?.push(booking);
    }
    return map;
  }, [weekBookings, weekDays]);

  const completedBookings = useMemo(
    () => bookings.filter((b) => b.status === 'completed'),
    [bookings],
  );

  const todayYmd = useMemo(() => getISTYmd(nowDate), [nowDate]);

  const todayBookings = useMemo(
    () =>
      bookings.filter(
        (b) => getISTYmd(new Date(b.startTime)) === todayYmd,
      ),
    [bookings, todayYmd],
  );

  const todayCompleted = useMemo(
    () => todayBookings.filter((b) => b.status === 'completed'),
    [todayBookings],
  );

  const weekCompleted = useMemo(
    () => weekBookings.filter((b) => b.status === 'completed'),
    [weekBookings],
  );

  const estimatedEarnings = useMemo(
    () =>
      completedBookings.reduce(
        (sum, b) => sum + b.coinsDeducted * PANDIT_SHARE,
        0,
      ),
    [completedBookings],
  );

  const weekEarnings = useMemo(
    () =>
      weekCompleted.reduce(
        (sum, b) => sum + b.coinsDeducted * PANDIT_SHARE,
        0,
      ),
    [weekCompleted],
  );

  const nextPayoutEstimate = useMemo(() => {
    const pending = Math.round(weekEarnings);
    const nowD = nowDate;
    const day = nowD.getDay();
    const daysUntilMonday = (8 - day) % 7 || 7;
    const next = new Date(nowD);
    next.setDate(nowD.getDate() + daysUntilMonday);
    return {
      pending,
      label: next.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
    };
  }, [weekEarnings, nowDate]);

  useEffect(() => {
    const count = completedBookings.length;
    const prefs = loadWorkspacePrefs();
    const thresholds = [10, 25, 50, 100];
    for (const t of thresholds) {
      if (count >= t && !prefs.celebratedMilestones.includes(t)) {
        setMilestone(`${t} sessions completed — beautiful consistency.`);
        saveWorkspacePrefs({
          ...prefs,
          celebratedMilestones: [...prefs.celebratedMilestones, t],
        });
        break;
      }
    }
  }, [completedBookings.length]);

  const todayEarnings = useMemo(
    () =>
      todayCompleted.reduce(
        (sum, b) => sum + b.coinsDeducted * PANDIT_SHARE,
        0,
      ),
    [todayCompleted],
  );

  const noShowCount = useMemo(
    () => noShowIds.filter((id) => bookings.some((b) => b.id === id)).length,
    [noShowIds, bookings],
  );

  const opsMetrics = useMemo(() => {
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    const completed = completedBookings.length;
    const settled = completed + cancelled + noShowCount;
    const completionRate =
      settled > 0 ? Math.round((completed / settled) * 100) : null;
    const cancelRate =
      settled > 0 ? Math.round((cancelled / settled) * 100) : null;
    const leadHours = bookings
      .filter((b) => b.status === 'completed' || b.status === 'confirmed')
      .map((b) => {
        const created = new Date(b.createdAt).getTime();
        const start = new Date(b.startTime).getTime();
        return (start - created) / 3_600_000;
      })
      .filter((h) => Number.isFinite(h) && h >= 0)
      .sort((a, b) => a - b);
    const medianLead =
      leadHours.length === 0
        ? null
        : leadHours[Math.floor(leadHours.length / 2)];
    return {
      completionRate,
      cancelRate,
      noShowCount,
      medianLeadHours: medianLead,
    };
  }, [bookings, completedBookings.length, noShowCount]);

  const nextUp = useMemo(() => {
    const candidates = bookings
      .filter((b) => b.status === 'confirmed')
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
    const joinable = candidates.find(
      (b) => canJoinChat(b, now) || canJoinCall(b),
    );
    if (joinable) return joinable;
    return (
      candidates.find((b) => new Date(b.startTime).getTime() >= now - 60_000) ??
      null
    );
  }, [bookings, now]);

  const firstName = useMemo(() => {
    const name = panditName?.trim();
    if (!name) return null;
    return name.split(/\s+/)[0];
  }, [panditName]);

  const sparkPoints = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(nowDate);
      d.setDate(d.getDate() - (6 - i));
      return getISTYmd(d);
    });
    return days.map((ymd) => {
      const count = completedBookings.filter(
        (b) => getISTYmd(new Date(b.startTime)) === ymd,
      ).length;
      return { ymd, count };
    });
  }, [completedBookings, nowDate]);

  const showOnboarding =
    !onboardingDismissed &&
    !loading &&
    todayBookings.length === 0 &&
    completedBookings.length < 3;

  function exportEarningsCsv() {
    const rows = [
      ['bookingId', 'startTime', 'format', 'area', 'coins', 'estimatedShareINR'],
      ...completedBookings.map((b) => [
        b.id,
        b.startTime,
        b.format,
        b.area,
        String(b.coinsDeducted),
        String(Math.round(b.coinsDeducted * PANDIT_SHARE)),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pandittalk-earnings-${getISTYmd(nowDate)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function dismissOnboarding() {
    setOnboardingDismissed(true);
    try {
      window.localStorage.setItem('pt-onboarding-dismissed', '1');
    } catch {
      // ignore
    }
  }

  async function handleToggleDetails(bookingId: string) {
    if (expandedBookingId === bookingId) {
      setExpandedBookingId(null);
      return;
    }

    setExpandedBookingId(bookingId);
    setDetailsErrorId(null);

    if (!detailsCache[bookingId]) {
      setLoadingDetailsId(bookingId);
      try {
        const details = await getUserDetailsForBooking(bookingId);
        setDetailsCache((prev) => ({ ...prev, [bookingId]: details }));
      } catch {
        setDetailsErrorId(bookingId);
      } finally {
        setLoadingDetailsId(null);
      }
    }

    if (!contextCache[bookingId]) {
      setLoadingContextId(bookingId);
      try {
        const contexts = await getSharedContextForBooking(bookingId);
        setContextCache((prev) => ({ ...prev, [bookingId]: contexts }));
      } catch {
        setContextCache((prev) => ({ ...prev, [bookingId]: [] }));
      } finally {
        setLoadingContextId(null);
      }
    }
  }

  useEffect(() => {
    if (loading || !panditId || !isOnline) return;
    const beat = () => {
      void updatePresence(panditId, true).catch(() => {});
    };
    beat();
    const timer = window.setInterval(beat, 45_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') beat();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loading, panditId, isOnline]);

  async function handleTogglePresence() {
    if (!panditId || toggling) return;

    const nextOnline = !isOnline;
    setOnline(nextOnline);
    setToggling(true);

    try {
      await updatePresence(panditId, nextOnline);
      const prefs = loadWorkspacePrefs();
      const ymd = getISTYmd();
      let nextPrefs = tickOnlineSeconds(prefs, ymd);
      if (nextOnline) {
        nextPrefs = { ...nextPrefs, onlineStartedAt: Date.now() };
      } else {
        nextPrefs = tickOnlineSeconds(
          { ...nextPrefs, onlineStartedAt: nextPrefs.onlineStartedAt },
          ymd,
        );
        nextPrefs = { ...nextPrefs, onlineStartedAt: null };
      }
      saveWorkspacePrefs(nextPrefs);
      setOnlineLabel(formatOnlineDuration(nextPrefs.onlineSecondsToday));
      setToast({
        message: nextOnline ? 'You are now online' : 'You are now offline',
        type: 'success',
      });
    } catch (err) {
      setOnline(!nextOnline);
      setToast({
        message: humanizeError(getErrorMessage(err)),
        type: 'error',
      });
    } finally {
      setToggling(false);
    }
  }

  function togglePastDay(ymd: string) {
    setExpandedPastDays((prev) => {
      const next = new Set(prev);
      if (next.has(ymd)) {
        next.delete(ymd);
      } else {
        next.add(ymd);
      }
      return next;
    });
  }

  async function handleCancelBooking(booking: BookingListItem) {
    const name =
      detailsCache[booking.id]?.userName?.trim() ||
      capitalize(booking.format);
    const ok = window.confirm(
      `Cancel session with ${name} on ${formatTimeIST(booking.startTime)}?\n\nThe seeker will receive a full wallet refund.`,
    );
    if (!ok) return;
    setCancellingId(booking.id);
    try {
      await cancelBookingAsPandit(booking.id);
      const list = await fetchPanditBookings();
      applyBookings(list);
      setToast({ message: 'Session cancelled. Seeker refunded.', type: 'success' });
    } catch (err) {
      setToast({
        message: getErrorMessage(err),
        type: 'error',
      });
    } finally {
      setCancellingId(null);
    }
  }

  function handleToggleNoShow(booking: BookingListItem) {
    const prefs = loadWorkspacePrefs();
    const has = prefs.noShowBookingIds.includes(booking.id);
    const nextIds = has
      ? prefs.noShowBookingIds.filter((id) => id !== booking.id)
      : [...prefs.noShowBookingIds, booking.id];
    saveWorkspacePrefs({ ...prefs, noShowBookingIds: nextIds });
    setNoShowIds(nextIds);
    setToast({
      message: has ? 'No-show cleared' : 'Marked as no-show',
      type: 'success',
    });
  }

  function renderBookingCard(booking: BookingListItem) {
    return (
      <BookingCard
        key={booking.id}
        booking={booking}
        now={now}
        expanded={expandedBookingId === booking.id}
        details={detailsCache[booking.id]}
        detailsLoading={loadingDetailsId === booking.id}
        detailsError={detailsErrorId === booking.id}
        sharedContexts={contextCache[booking.id]}
        contextsLoading={loadingContextId === booking.id}
        joining={joiningId === booking.id}
        cancelling={cancellingId === booking.id}
        isNoShow={noShowIds.includes(booking.id)}
        onToggleDetails={handleToggleDetails}
        onJoin={(id) => {
          setJoiningId(id);
          navigate(`/session/${id}`);
        }}
        onJoinCall={(b) => {
          setJoiningId(b.id);
          navigate(`${getCallRoute(b)}${b.id}`);
        }}
        onCancel={handleCancelBooking}
        onToggleNoShow={handleToggleNoShow}
      />
    );
  }

  const prefetchAttemptedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const ids: string[] = [];
    if (nextUp) ids.push(nextUp.id);
    for (const b of todayBookings) {
      if (b.status === 'confirmed') ids.push(b.id);
    }
    for (const id of ids) {
      if (prefetchAttemptedRef.current.has(id)) continue;
      if (detailsCache[id]) {
        prefetchAttemptedRef.current.add(id);
        continue;
      }
      prefetchAttemptedRef.current.add(id);
      void getUserDetailsForBooking(id)
        .then((details) => {
          setDetailsCache((prev) =>
            prev[id] ? prev : { ...prev, [id]: details },
          );
        })
        .catch(() => {
          // Expand still retries on demand.
        });
    }
  }, [nextUp, todayBookings, detailsCache]);

  if (!accessToken) {
    return null;
  }

  return (
    <AppShell>
      <main className={styles.main}>
        <div className={styles.primaryColumn}>
          <header className={styles.pageHeader}>
            <div>
              <h1 className={styles.greeting}>
                {greetingForHour(nowDate)}
                {firstName ? `, ${firstName}` : ''}
              </h1>
              <p className={styles.greetingSub}>
                Your sessions, availability, and earnings — in one calm place.
              </p>
            </div>
            <div className={styles.headerMeta}>
              <p className={styles.syncMeta}>
                {formatRelativeSync(lastSyncedAt, now)}
              </p>
              <button
                type="button"
                className="btn btnSecondary"
                onClick={() => void loadBookings(true)}
                disabled={refreshing}
              >
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </header>

          {failStreak >= 2 ? (
            <div className={styles.offlineBanner} role="alert">
              Having trouble reaching the server. Showing the last known
              schedule — tap Refresh to try again.
            </div>
          ) : null}

          {showOnboarding ? (
            <section className={styles.onboarding} aria-label="Getting started">
              <div className={styles.onboardingTop}>
                <h2 className={styles.sectionTitle}>Getting started</h2>
                <button
                  type="button"
                  className={styles.pagerToday}
                  onClick={dismissOnboarding}
                >
                  Dismiss
                </button>
              </div>
              <ol className={styles.onboardingSteps}>
                <li className={isOnline ? styles.stepDone : undefined}>
                  Go online so seekers can book you
                </li>
                <li>Review today&apos;s schedule when sessions appear</li>
                <li>
                  <button
                    type="button"
                    className={styles.inlineAction}
                    onClick={() => navigate('/articles')}
                  >
                    Write your first article
                  </button>
                </li>
              </ol>
            </section>
          ) : null}

          <div className={styles.kpiStrip}>
            <div className={styles.kpi}>
              <div className={styles.kpiValue}>{todayBookings.length}</div>
              <div className={styles.kpiLabel}>Sessions today</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiValue}>{weekBookings.length}</div>
              <div className={styles.kpiLabel}>This week</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiValue}>₹{Math.round(weekEarnings)}</div>
              <div className={styles.kpiLabel}>Week earnings (est.)</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiValue}>
                {opsMetrics.completionRate != null
                  ? `${opsMetrics.completionRate}%`
                  : '—'}
              </div>
              <div className={styles.kpiLabel}>Completion rate</div>
            </div>
          </div>

          {nextUp ? (
            <section className={styles.nextCard} aria-label="Next session">
              <p className={styles.nextEyebrow}>Up next</p>
              <h2 className={styles.nextTitle}>
                {detailsCache[nextUp.id]?.userName?.trim() ||
                  `${capitalize(nextUp.format)} · ${
                    nextUp.area.charAt(0).toUpperCase() + nextUp.area.slice(1)
                  }`}
              </h2>
              <div className={styles.nextMeta}>
                <span>{capitalize(nextUp.format)}</span>
                <span>{formatTimeIST(nextUp.startTime)}</span>
                <span>{nextUp.durationMinutes} min</span>
                <span>
                  {formatCountdown(new Date(nextUp.startTime).getTime(), now)}
                </span>
              </div>
              <div className={styles.nextActions}>
                {(canJoinChat(nextUp, now) || canJoinCall(nextUp)) && (
                  <button
                    type="button"
                    className="btn btnPrimary"
                    disabled={joiningId === nextUp.id}
                    onClick={() => {
                      setJoiningId(nextUp.id);
                      if (canJoinChat(nextUp, now)) {
                        navigate(`/session/${nextUp.id}`);
                      } else {
                        navigate(`${getCallRoute(nextUp)}${nextUp.id}`);
                      }
                    }}
                  >
                    {joiningId === nextUp.id
                      ? 'Joining…'
                      : new Date(nextUp.startTime).getTime() > now
                        ? 'Enter waiting room'
                        : nextUp.format === 'chat'
                          ? 'Join chat'
                          : nextUp.format === 'audio'
                            ? 'Join audio'
                            : 'Join video'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btnSecondary"
                  onClick={() => void handleToggleDetails(nextUp.id)}
                >
                  View details
                </button>
              </div>
            </section>
          ) : (
            <section className={styles.nextCard} aria-label="Next session">
              <p className={styles.nextEyebrow}>Up next</p>
              <h2 className={styles.nextTitle}>No upcoming sessions</h2>
              <p className={styles.sectionHint} style={{ marginBottom: 0 }}>
                Stay online so seekers can book you. Your next confirmed session
                will appear here.
              </p>
            </section>
          )}

          <section className={styles.section}>
            <div className={styles.scheduleHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Schedule</h2>
                <p className={styles.weekRange}>
                  {formatWeekRange(weekDays[0].ymd, weekDays[6].ymd)}
                  {weekOffset === 0 ? ' · This week' : ''}
                </p>
              </div>
              <div className={styles.weekPager}>
                <div className={styles.viewSwitch} role="group" aria-label="Schedule view">
                  <button
                    type="button"
                    className={`${styles.pagerToday} ${
                      scheduleView === 'day' ? styles.viewActive : ''
                    }`}
                    onClick={() => setScheduleView('day')}
                  >
                    Day
                  </button>
                  <button
                    type="button"
                    className={`${styles.pagerToday} ${
                      scheduleView === 'week' ? styles.viewActive : ''
                    }`}
                    onClick={() => setScheduleView('week')}
                  >
                    Week
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.pagerBtn}
                  onClick={() => setWeekOffset((o) => o - 1)}
                  aria-label="Previous week"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className={styles.pagerToday}
                  onClick={() => setWeekOffset(0)}
                  disabled={weekOffset === 0}
                >
                  Today
                </button>
                <button
                  type="button"
                  className={styles.pagerBtn}
                  onClick={() => setWeekOffset((o) => o + 1)}
                  aria-label="Next week"
                >
                  ›
                </button>
              </div>
            </div>
            <div className={styles.filterRow} role="group" aria-label="Filter by format">
              {(
                [
                  ['all', 'All'],
                  ['chat', 'Chat'],
                  ['audio', 'Audio'],
                  ['video', 'Video'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.filterChip} ${
                    formatFilter === id ? styles.filterChipActive : ''
                  }`}
                  onClick={() => setFormatFilter(id)}
                  aria-pressed={formatFilter === id}
                >
                  {label}
                </button>
              ))}
              <input
                className={styles.scheduleSearch}
                value={scheduleSearch}
                onChange={(e) => setScheduleSearch(e.target.value)}
                placeholder="Search name, area, concern…"
                aria-label="Search schedule"
              />
            </div>
            {loading && (
              <div className={styles.skeletonStack} aria-hidden>
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLine} />
              </div>
            )}
            {error && <p className={styles.error}>{error}</p>}
            {!loading && !error && (
              <div className={styles.dayList}>
                {orderedWeekDays.map((day) => {
                  const isToday = isTodayYmdIST(day.ymd, nowDate);
                  const isPast = isPastDayIST(day.ymd, nowDate);
                  const isFuture = isFutureDayIST(day.ymd, nowDate);
                  const dayBookings = bookingsByDay.get(day.ymd) ?? [];
                  const activeBookings = dayBookings.filter(
                    (b) => b.status !== 'completed',
                  );
                  const completedDayBookings = dayBookings.filter(
                    (b) => b.status === 'completed',
                  );
                  const isPastDayExpanded = expandedPastDays.has(day.ymd);
                  const showDayContent = !isPast || isPastDayExpanded;
                  const sessionCountLabel =
                    dayBookings.length === 0
                      ? 'No sessions'
                      : `${dayBookings.length} session${dayBookings.length === 1 ? '' : 's'}`;

                  return (
                    <div
                      key={day.ymd}
                      className={`${styles.daySection} ${
                        isToday
                          ? styles.daySectionToday
                          : isPast
                            ? styles.daySectionPast
                            : isFuture
                              ? styles.daySectionFuture
                              : ''
                      }`}
                    >
                      {isPast ? (
                        <button
                          type="button"
                          className={`${styles.dayHeader} ${styles.dayHeaderToggle}`}
                          onClick={() => togglePastDay(day.ymd)}
                          aria-expanded={isPastDayExpanded}
                        >
                          <span
                            className={`${styles.dayHeaderChevron} ${
                              isPastDayExpanded ? styles.dayHeaderChevronOpen : ''
                            }`}
                            aria-hidden
                          >
                            ›
                          </span>
                          <span>{formatDayHeader(day.ymd)}</span>
                          <span className={styles.daySessionCount}>
                            {sessionCountLabel}
                          </span>
                        </button>
                      ) : (
                        <div
                          className={`${styles.dayHeader} ${
                            isToday ? styles.dayHeaderToday : ''
                          }`}
                        >
                          <span>{formatDayHeader(day.ymd)}</span>
                          {isToday && (
                            <span className={styles.todayBadge}>Today</span>
                          )}
                        </div>
                      )}
                      {showDayContent &&
                        (dayBookings.length === 0 ? (
                          <div>
                            <p className={styles.noSessions}>No sessions</p>
                            {isToday ? (
                              <p className={styles.emptyDayHint}>
                                Go online so new seekers can find you today.
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <>
                            {activeBookings.length > 0 && (
                              <div className={styles.bookingList}>
                                {activeBookings.map(renderBookingCard)}
                              </div>
                            )}
                            {completedDayBookings.length > 0 && (
                              <details className={styles.completedDetails}>
                                <summary className={styles.completedSummary}>
                                  Completed sessions ({completedDayBookings.length})
                                </summary>
                                <div className={styles.bookingList}>
                                  {completedDayBookings.map(renderBookingCard)}
                                </div>
                              </details>
                            )}
                          </>
                        ))}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className={styles.sideRail}>
          <section className={styles.panel}>
            <h2 className={styles.sectionTitle}>Availability</h2>
            <div className={styles.presenceRow}>
              <div className={styles.presenceCopy}>
                <span
                  className={`${styles.statusLabel} ${
                    isOnline ? styles.statusOnline : styles.statusOffline
                  }`}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                <p className={styles.presenceHelp}>
                  {isOnline
                    ? `Seekers can book you right now. ${onlineLabel}.`
                    : 'Turn on when you are ready to take sessions.'}
                </p>
              </div>
              <button
                type="button"
                className={`${styles.toggle} ${
                  isOnline ? styles.toggleOnline : styles.toggleOffline
                } ${toggling ? styles.toggleBusy : ''}`}
                onClick={handleTogglePresence}
                disabled={toggling || !panditId}
                aria-label={isOnline ? 'Go offline' : 'Go online'}
                aria-pressed={isOnline}
              >
                <span
                  className={`${styles.toggleKnob} ${
                    isOnline ? styles.knobOnline : styles.knobOffline
                  }`}
                />
              </button>
            </div>
            <span className="sr-only" aria-live="polite">
              {isOnline ? 'You are online for bookings' : 'You are offline'}
            </span>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.sectionTitle}>Ops pulse</h2>
            <div className={styles.earningsGrid}>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {opsMetrics.completionRate != null
                    ? `${opsMetrics.completionRate}%`
                    : '—'}
                </div>
                <div className={styles.statLabel}>Completed</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {opsMetrics.cancelRate != null
                    ? `${opsMetrics.cancelRate}%`
                    : '—'}
                </div>
                <div className={styles.statLabel}>Cancelled</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{opsMetrics.noShowCount}</div>
                <div className={styles.statLabel}>No-shows</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {opsMetrics.medianLeadHours != null
                    ? `${opsMetrics.medianLeadHours < 1
                        ? `${Math.round(opsMetrics.medianLeadHours * 60)}m`
                        : `${opsMetrics.medianLeadHours.toFixed(1)}h`}`
                    : '—'}
                </div>
                <div className={styles.statLabel}>Median book→start</div>
              </div>
            </div>
            <p className={styles.earningsNote}>
              Derived from your bookings. No-shows are local marks until a
              platform status ships.
            </p>
          </section>

          <section className={styles.panel}>
            <div className={styles.earningsHeader}>
              <h2 className={styles.sectionTitle}>Earnings</h2>
              <button
                type="button"
                className={styles.pagerToday}
                onClick={exportEarningsCsv}
                disabled={completedBookings.length === 0}
              >
                Export CSV
              </button>
            </div>
            <div className={styles.earningsGrid}>
              <div className={styles.stat}>
                <div className={styles.statValue}>₹{Math.round(todayEarnings)}</div>
                <div className={styles.statLabel}>Today (est.)</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>₹{Math.round(weekEarnings)}</div>
                <div className={styles.statLabel}>This week (est.)</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  ₹{Math.round(estimatedEarnings)}
                </div>
                <div className={styles.statLabel}>
                  All completed · {completedBookings.length} sessions
                </div>
              </div>
            </div>
            <div className={styles.sparkBlock} aria-label="Completed sessions last 7 days">
              <p className={styles.sparkLabel}>Completed sessions · last 7 days</p>
              <div className={styles.spark}>
                {sparkPoints.map((p) => {
                  const max = Math.max(1, ...sparkPoints.map((x) => x.count));
                  const height = `${Math.max(8, (p.count / max) * 100)}%`;
                  return (
                    <div key={p.ymd} className={styles.sparkCol} title={`${p.ymd}: ${p.count}`}>
                      <span className={styles.sparkBar} style={{ height }} />
                      <span className={styles.sparkDay}>{p.ymd.slice(8)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className={styles.earningsNote}>
              Estimates use your 70% share of coins deducted per completed
              session. Suggested payout window: ~{nextPayoutEstimate.label} ·
              pending ~₹{nextPayoutEstimate.pending} this week (guide only).
            </p>
            <div className={styles.ratingsCard}>
              <h3 className={styles.sparkLabel}>Ratings</h3>
              <p className={styles.userDetailsStatus}>
                Seeker reviews will appear here once ratings APIs are connected
                for pandits. Keep sessions warm and clear — quality compounds.
              </p>
            </div>
          </section>
        </aside>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {bookingAlert && (
        <div className={styles.bookingAlert} role="status">
          <div className={styles.alertCopy}>
            <strong>New {bookingAlert.format} request</strong>
            <span>
              {bookingAlert.area.charAt(0).toUpperCase() +
                bookingAlert.area.slice(1)}{' '}
              · join when you are ready
            </span>
          </div>
          <button
            type="button"
            className={`btn btnPrimary ${styles.bookingAlertBtn}`}
            onClick={() => navigate(`/session/${bookingAlert.bookingId}`)}
          >
            Join now
          </button>
        </div>
      )}

      {milestone ? (
        <div className={styles.milestone} role="status">
          <span>{milestone}</span>
          <button
            type="button"
            className={styles.pagerToday}
            onClick={() => setMilestone(null)}
          >
            Nice
          </button>
        </div>
      ) : null}

      {nextUp && (canJoinChat(nextUp, now) || canJoinCall(nextUp)) ? (
        <div className={styles.stickyJoinBar}>
          <div className={styles.stickyJoinCopy}>
            <strong>
              {detailsCache[nextUp.id]?.userName?.trim() ||
                capitalize(nextUp.format)}
            </strong>
            <span>{formatTimeIST(nextUp.startTime)}</span>
          </div>
          <button
            type="button"
            className="btn btnPrimary"
            disabled={joiningId === nextUp.id}
            onClick={() => {
              setJoiningId(nextUp.id);
              if (canJoinChat(nextUp, now)) {
                navigate(`/session/${nextUp.id}`);
              } else {
                navigate(`${getCallRoute(nextUp)}${nextUp.id}`);
              }
            }}
          >
            {joiningId === nextUp.id ? 'Joining…' : 'Join now'}
          </button>
        </div>
      ) : null}
    </AppShell>
  );
}
