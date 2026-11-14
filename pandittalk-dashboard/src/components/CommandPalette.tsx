import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePanditStore } from '../store/usePanditStore';
import { updatePresence } from '../lib/api';
import styles from './CommandPalette.module.css';

type Command = {
  id: string;
  label: string;
  hint?: string;
  run: () => void | Promise<void>;
};

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const panditId = usePanditStore((s) => s.panditId);
  const isOnline = usePanditStore((s) => s.isOnline);
  const setOnline = usePanditStore((s) => s.setOnline);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((v) => !v);
        setQuery('');
      }
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const commands = useMemo<Command[]>(
    () => [
      {
        id: 'sessions',
        label: 'Go to Sessions',
        hint: 'Dashboard',
        run: () => navigate('/dashboard'),
      },
      {
        id: 'articles',
        label: 'Go to Articles',
        run: () => navigate('/articles'),
      },
      {
        id: 'performance',
        label: 'Go to Performance',
        run: () => navigate('/articles/performance'),
      },
      {
        id: 'notifications',
        label: 'Go to Notifications',
        run: () => navigate('/notifications'),
      },
      {
        id: 'clients',
        label: 'Go to Clients',
        run: () => navigate('/clients'),
      },
      {
        id: 'profile',
        label: 'Go to Profile',
        run: () => navigate('/profile'),
      },
      {
        id: 'presence',
        label: isOnline ? 'Go offline' : 'Go online',
        hint: 'Availability',
        run: async () => {
          if (!panditId) return;
          const next = !isOnline;
          setOnline(next);
          try {
            await updatePresence(panditId, next);
          } catch {
            setOnline(!next);
          }
        },
      },
    ],
    [navigate, isOnline, panditId, setOnline],
  );

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={() => setOpen(false)}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          className={styles.input}
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Jump to… or toggle availability"
          aria-label="Command search"
        />
        <ul className={styles.list}>
          {filtered.length === 0 ? (
            <li className={styles.empty}>No matching commands</li>
          ) : (
            filtered.map((cmd) => (
              <li key={cmd.id}>
                <button
                  type="button"
                  className={styles.item}
                  onClick={() => {
                    void Promise.resolve(cmd.run()).finally(() => setOpen(false));
                  }}
                >
                  <span>{cmd.label}</span>
                  {cmd.hint ? <span className={styles.hint}>{cmd.hint}</span> : null}
                </button>
              </li>
            ))
          )}
        </ul>
        <p className={styles.footer}>
          <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> to toggle
        </p>
      </div>
    </div>
  );
}
