import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import {
  fetchPanditBookings,
  getErrorMessage,
  getUserDetailsForBooking,
} from '../lib/api';
import { formatTimeIST, getISTYmd } from '../lib/format';
import type { BookingListItem, BookingUserDetails } from '../types';
import styles from './Clients.module.css';

type ClientRow = {
  key: string;
  name: string;
  sessions: number;
  lastBooking: BookingListItem;
  notes: string[];
};

export function Clients() {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [details, setDetails] = useState<Record<string, BookingUserDetails>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchPanditBookings();
        if (cancelled) return;
        setBookings(list);
        const sample = list
          .slice()
          .sort(
            (a, b) =>
              new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
          )
          .slice(0, 40);
        const entries = await Promise.all(
          sample.map(async (b) => {
            try {
              const d = await getUserDetailsForBooking(b.id);
              return [b.id, d] as const;
            } catch {
              return null;
            }
          }),
        );
        if (cancelled) return;
        const map: Record<string, BookingUserDetails> = {};
        for (const entry of entries) {
          if (entry) map[entry[0]] = entry[1];
        }
        setDetails(map);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const clients = useMemo(() => {
    const byKey = new Map<string, ClientRow>();
    const sorted = [...bookings].sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
    for (const booking of sorted) {
      const d = details[booking.id];
      const key = d?.userId || booking.id;
      const existing = byKey.get(key);
      const note = booking.notes?.trim();
      if (!existing) {
        byKey.set(key, {
          key,
          name: d?.userName?.trim() || 'Seeking guidance',
          sessions: 1,
          lastBooking: booking,
          notes: note ? [note] : [],
        });
      } else {
        existing.sessions += 1;
        if (note && existing.notes.length < 3 && !existing.notes.includes(note)) {
          existing.notes.push(note);
        }
      }
    }
    return Array.from(byKey.values()).sort((a, b) => b.sessions - a.sessions);
  }, [bookings, details]);

  const filtered = clients.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.notes.some((n) => n.toLowerCase().includes(q))
    );
  });

  return (
    <AppShell>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Clients</h1>
            <p className={styles.subtitle}>
              People you have guided — history and recent concerns in one place.
            </p>
          </div>
          <input
            className={styles.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or notes"
            aria-label="Search clients"
          />
        </header>

        {error ? <p className={styles.error}>{error}</p> : null}
        {loading ? <p className={styles.muted}>Loading clients…</p> : null}

        {!loading && filtered.length === 0 ? (
          <div className={styles.empty}>
            <h2>No clients yet</h2>
            <p>
              As sessions complete, seekers will appear here with their history
              and notes.
            </p>
          </div>
        ) : null}

        <ul className={styles.list}>
          {filtered.map((client) => (
            <li key={client.key} className={styles.card}>
              <div className={styles.top}>
                <span className={styles.avatar} aria-hidden>
                  {client.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? '')
                    .join('') || 'S'}
                </span>
                <div className={styles.identity}>
                  <h2 className={styles.name}>{client.name}</h2>
                  <p className={styles.meta}>
                    {client.sessions} session{client.sessions === 1 ? '' : 's'} ·
                    Last {getISTYmd(new Date(client.lastBooking.startTime))} ·{' '}
                    {formatTimeIST(client.lastBooking.startTime)}
                  </p>
                </div>
              </div>
              {client.notes.length > 0 ? (
                <div className={styles.notes}>
                  {client.notes.map((note) => (
                    <p key={note} className={styles.note}>
                      “{note}”
                    </p>
                  ))}
                </div>
              ) : (
                <p className={styles.mutedInline}>No concern notes yet</p>
              )}
            </li>
          ))}
        </ul>
      </main>
    </AppShell>
  );
}
