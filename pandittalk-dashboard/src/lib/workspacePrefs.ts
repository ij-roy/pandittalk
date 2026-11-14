const PREFS_KEY = 'pt-workspace-prefs-v1';

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type DayHours = {
  enabled: boolean;
  start: string;
  end: string;
};

export type WorkspacePrefs = {
  hours: Record<DayKey, DayHours>;
  bufferMinutes: number;
  awayFrom: string;
  awayTo: string;
  reminderLeadMinutes: number;
  theme: 'light' | 'dark';
  onlineStartedAt: number | null;
  onlineSecondsToday: number;
  onlineDayYmd: string;
  soundAlerts: boolean;
  celebratedMilestones: number[];
  noShowBookingIds: string[];
};

const DEFAULT_HOURS: DayHours = {
  enabled: true,
  start: '09:00',
  end: '18:00',
};

export const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

function defaultPrefs(): WorkspacePrefs {
  const hours = Object.fromEntries(
    DAY_LABELS.map(({ key }) => [
      key,
      {
        ...DEFAULT_HOURS,
        enabled: key !== 'sun',
      },
    ]),
  ) as Record<DayKey, DayHours>;

  return {
    hours,
    bufferMinutes: 10,
    awayFrom: '',
    awayTo: '',
    reminderLeadMinutes: 10,
    theme: 'light',
    onlineStartedAt: null,
    onlineSecondsToday: 0,
    onlineDayYmd: '',
    soundAlerts: true,
    celebratedMilestones: [],
    noShowBookingIds: [],
  };
}

export function loadWorkspacePrefs(): WorkspacePrefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs();
    return { ...defaultPrefs(), ...(JSON.parse(raw) as Partial<WorkspacePrefs>) };
  } catch {
    return defaultPrefs();
  }
}

export function saveWorkspacePrefs(prefs: WorkspacePrefs): void {
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.dataset.theme = theme;
}

export function tickOnlineSeconds(prefs: WorkspacePrefs, ymd: string, now = Date.now()): WorkspacePrefs {
  let next = { ...prefs };
  if (next.onlineDayYmd !== ymd) {
    next = {
      ...next,
      onlineDayYmd: ymd,
      onlineSecondsToday: 0,
      onlineStartedAt: next.onlineStartedAt ? now : null,
    };
  }
  if (next.onlineStartedAt) {
    const delta = Math.max(0, Math.floor((now - next.onlineStartedAt) / 1000));
    next = {
      ...next,
      onlineSecondsToday: next.onlineSecondsToday + delta,
      onlineStartedAt: now,
    };
  }
  return next;
}

export function formatOnlineDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h <= 0) return `${m}m online today`;
  return `${h}h ${m}m online today`;
}
