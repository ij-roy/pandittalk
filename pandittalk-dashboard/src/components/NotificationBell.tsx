import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../lib/formatRelativeTime';
import {
  filterNotifications,
  type NotificationFilterTab,
} from '../lib/notificationFilters';
import {
  getNotifications,
  markAllNotificationsRead,
} from '../lib/notificationApi';
import {
  getTotalUnreadCount,
  useNotificationStore,
} from '../store/useNotificationStore';
import type { Notification } from '../types';
import { BellIcon, NotificationTypeIcon } from './NotificationIcons';
import styles from './NotificationBell.module.css';

const DISPLAY_LIMIT = 20;

const TABS: { id: NotificationFilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'messages', label: 'Messages' },
  { id: 'updates', label: 'Updates' },
];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<NotificationFilterTab>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const serverUnreadCount = useNotificationStore((s) => s.serverUnreadCount);
  const localUnreadCount = useNotificationStore((s) => s.localUnreadCount);
  const mergeServerNotifications = useNotificationStore(
    (s) => s.mergeServerNotifications,
  );
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const setServerUnreadCount = useNotificationStore(
    (s) => s.setServerUnreadCount,
  );

  const unreadCount = serverUnreadCount + localUnreadCount;

  const displayNotifications = useMemo(
    () => filterNotifications(notifications, tab).slice(0, DISPLAY_LIMIT),
    [notifications, tab],
  );

  const loadDropdown = useCallback(async () => {
    setLoading(true);
    try {
      await markAllNotificationsRead();
      setServerUnreadCount(0);
      markAllRead();
      const serverList = await getNotifications();
      mergeServerNotifications(serverList);
    } catch {
      // Keep existing list on failure.
    } finally {
      setLoading(false);
    }
  }, [markAllRead, mergeServerNotifications, setServerUnreadCount]);

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        void loadDropdown();
      }
      return next;
    });
  }, [loadDropdown]);

  const handleMarkAllRead = useCallback(() => {
    void (async () => {
      try {
        await markAllNotificationsRead();
        setServerUnreadCount(0);
        markAllRead();
      } catch {
        markAllRead();
        setServerUnreadCount(0);
      }
    })();
  }, [markAllRead, setServerUnreadCount]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <button
        type="button"
        className={styles.bellBtn}
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <BellIcon className={styles.bellIcon} />
        {unreadCount > 0 && (
          <span className={styles.badge} aria-hidden>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownHeader}>
            <h2 className={styles.dropdownTitle}>Notifications</h2>
            <button
              type="button"
              className={styles.markAllBtn}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </button>
          </div>

          <div className={styles.tabs} role="tablist">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`${styles.tab} ${tab === item.id ? styles.tabActive : ''}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading && displayNotifications.length === 0 ? (
            <p className={styles.empty}>Loading...</p>
          ) : displayNotifications.length === 0 ? (
            <p className={styles.empty}>No notifications in this category</p>
          ) : (
            <ul className={styles.list}>
              {displayNotifications.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} />
              ))}
            </ul>
          )}

          <div className={styles.dropdownFooter}>
            <Link
              to="/notifications"
              className={styles.viewAllLink}
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  return (
    <li
      className={`${styles.row} ${notification.isRead ? styles.rowRead : styles.rowUnread}`}
    >
      <div className={styles.rowIcon}>
        <NotificationTypeIcon type={notification.type} className={styles.typeIcon} />
      </div>
      <div className={styles.rowBody}>
        <div className={styles.rowTop}>
          <span className={styles.rowTitle}>{notification.title}</span>
          {!notification.isRead && (
            <span className={styles.unreadDot} aria-label="Unread" />
          )}
        </div>
        <p className={styles.rowText}>{notification.body}</p>
        <time className={styles.rowTime} dateTime={notification.createdAt}>
          {formatRelativeTime(notification.createdAt)}
        </time>
      </div>
    </li>
  );
}

export { getTotalUnreadCount };
