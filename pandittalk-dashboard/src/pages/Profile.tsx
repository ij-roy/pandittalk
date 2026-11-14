import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { usePanditStore } from '../store/usePanditStore';
import {
  applyTheme,
  DAY_LABELS,
  formatOnlineDuration,
  loadWorkspacePrefs,
  saveWorkspacePrefs,
  tickOnlineSeconds,
  type DayKey,
  type WorkspacePrefs,
} from '../lib/workspacePrefs';
import { getISTYmd } from '../lib/format';
import styles from './Profile.module.css';

export function Profile() {
  const panditName = usePanditStore((s) => s.panditName);
  const isOnline = usePanditStore((s) => s.isOnline);
  const panditId = usePanditStore((s) => s.panditId);
  const [prefs, setPrefs] = useState<WorkspacePrefs>(() => loadWorkspacePrefs());
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    applyTheme(prefs.theme);
  }, [prefs.theme]);

  useEffect(() => {
    const ymd = getISTYmd();
    setPrefs((prev) => {
      const next = tickOnlineSeconds(prev, ymd);
      if (isOnline && !next.onlineStartedAt) {
        return { ...next, onlineStartedAt: Date.now() };
      }
      if (!isOnline && next.onlineStartedAt) {
        const closed = tickOnlineSeconds(
          { ...next, onlineStartedAt: next.onlineStartedAt },
          ymd,
        );
        return { ...closed, onlineStartedAt: null };
      }
      return next;
    });
  }, [isOnline]);

  function updatePrefs(patch: Partial<WorkspacePrefs>) {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveWorkspacePrefs(next);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1200);
      return next;
    });
  }

  function updateDay(key: DayKey, patch: Partial<WorkspacePrefs['hours'][DayKey]>) {
    setPrefs((prev) => {
      const next = {
        ...prev,
        hours: {
          ...prev.hours,
          [key]: { ...prev.hours[key], ...patch },
        },
      };
      saveWorkspacePrefs(next);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1200);
      return next;
    });
  }

  return (
    <AppShell>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Profile &amp; availability</h1>
            <p className={styles.subtitle}>
              Shape how you show up for seekers. Hours stay on this device until
              server sync ships.
            </p>
          </div>
          {savedFlash ? <p className={styles.saved}>Saved</p> : null}
        </header>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Account</h2>
          <dl className={styles.fields}>
            <div>
              <dt>Display name</dt>
              <dd>{panditName || '—'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd className={isOnline ? styles.online : styles.offline}>
                {isOnline ? 'Online for bookings' : 'Offline'}
              </dd>
            </div>
            <div>
              <dt>Presence today</dt>
              <dd>{formatOnlineDuration(prefs.onlineSecondsToday)}</dd>
            </div>
            <div>
              <dt>Pandit ID</dt>
              <dd className={styles.mono}>{panditId || '—'}</dd>
            </div>
          </dl>
          <p className={styles.hint}>
            Manage clients on the{' '}
            <Link to="/clients" className={styles.link}>
              Clients
            </Link>{' '}
            page.
          </p>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Weekly hours</h2>
          <p className={styles.hint}>
            Set the windows you intend to take sessions — like Acuity availability.
          </p>
          <div className={styles.hoursList}>
            {DAY_LABELS.map(({ key, label }) => {
              const day = prefs.hours[key];
              return (
                <div key={key} className={styles.hourRow}>
                  <label className={styles.dayToggle}>
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={(e) =>
                        updateDay(key, { enabled: e.target.checked })
                      }
                    />
                    <span>{label}</span>
                  </label>
                  <input
                    type="time"
                    className={styles.time}
                    value={day.start}
                    disabled={!day.enabled}
                    onChange={(e) => updateDay(key, { start: e.target.value })}
                  />
                  <span className={styles.to}>to</span>
                  <input
                    type="time"
                    className={styles.time}
                    value={day.end}
                    disabled={!day.enabled}
                    onChange={(e) => updateDay(key, { end: e.target.value })}
                  />
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Buffers &amp; time away</h2>
          <label className={styles.fieldLabel}>
            Buffer after each session
            <select
              className={styles.select}
              value={prefs.bufferMinutes}
              onChange={(e) =>
                updatePrefs({ bufferMinutes: Number(e.target.value) })
              }
            >
              {[0, 5, 10, 15, 20, 30].map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? 'No buffer' : `${m} minutes`}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.awayRow}>
            <label className={styles.fieldLabel}>
              Away from
              <input
                type="date"
                className={styles.select}
                value={prefs.awayFrom}
                onChange={(e) => updatePrefs({ awayFrom: e.target.value })}
              />
            </label>
            <label className={styles.fieldLabel}>
              Away until
              <input
                type="date"
                className={styles.select}
                value={prefs.awayTo}
                onChange={(e) => updatePrefs({ awayTo: e.target.value })}
              />
            </label>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Reminders &amp; alerts</h2>
          <label className={styles.fieldLabel}>
            Reminder lead time
            <select
              className={styles.select}
              value={prefs.reminderLeadMinutes}
              onChange={(e) =>
                updatePrefs({ reminderLeadMinutes: Number(e.target.value) })
              }
            >
              {[5, 10, 15, 30].map((m) => (
                <option key={m} value={m}>
                  {m} minutes before
                </option>
              ))}
            </select>
          </label>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={prefs.soundAlerts}
              onChange={(e) => updatePrefs({ soundAlerts: e.target.checked })}
            />
            Play a soft sound for new session requests
          </label>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Appearance</h2>
          <div className={styles.themeRow}>
            <button
              type="button"
              className={`${styles.themeBtn} ${
                prefs.theme === 'light' ? styles.themeActive : ''
              }`}
              onClick={() => updatePrefs({ theme: 'light' })}
            >
              Light
            </button>
            <button
              type="button"
              className={`${styles.themeBtn} ${
                prefs.theme === 'dark' ? styles.themeActive : ''
              }`}
              onClick={() => updatePrefs({ theme: 'dark' })}
            >
              Dark
            </button>
          </div>
        </section>

        <p className={styles.footerLinks}>
          <Link to="/privacy-policy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/contact">Contact</Link>
        </p>
      </main>
    </AppShell>
  );
}
