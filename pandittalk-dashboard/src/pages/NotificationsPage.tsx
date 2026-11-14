import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { NotificationTypeIcon } from '../components/NotificationIcons';
import {
  filterNotifications,
  type NotificationFilterTab,
} from '../lib/notificationFilters';
import { formatRelativeTime } from '../lib/formatRelativeTime';
import {
  getNotifications,
  markAllNotificationsRead,
} from '../lib/notificationApi';
import { useNotificationStore } from '../store/useNotificationStore';
import type { Notification } from '../types';
import styles from './NotificationsPage.module.css';

const TABS: { id: NotificationFilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'messages', label: 'Messages' },
  { id: 'updates', label: 'Updates' },
];

function routeForNotification(notification: Notification): string {
  if (!notification.bookingId) return '/dashboard';
  if (
    notification.type === 'new_message' ||
    notification.type === 'chat_now_accepted'
  ) {
    return `/session/${notification.bookingId}`;
  }
  return '/dashboard';
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<NotificationFilterTab>('all');
  const [loading, setLoading] = useState(true);

  const notifications = useNotificationStore((s) => s.notifications);
  const mergeServerNotifications = useNotificationStore(
    (s) => s.mergeServerNotifications,
  );
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const setServerUnreadCount = useNotificationStore(
    (s) => s.setServerUnreadCount,
  );

  const filtered = useMemo(
    () => filterNotifications(notifications, tab),
    [notifications, tab],
  );

  const unreadTotal = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const unreadByTab = useMemo(() => {
    return {
      all: unreadTotal,
      messages: filterNotifications(notifications, 'messages').filter(
        (n) => !n.isRead,
      ).length,
      updates: filterNotifications(notifications, 'updates').filter(
        (n) => !n.isRead,
      ).length,
    } satisfies Record<NotificationFilterTab, number>;
  }, [notifications, unreadTotal]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const serverList = await getNotifications();
      mergeServerNotifications(serverList);
    } catch {
      // Keep existing list on failure.
    } finally {
      setLoading(false);
    }
  }, [mergeServerNotifications]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

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

  return (
    <AppShell>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Notifications</h1>
            <p className={styles.subtitle}>
              Session alerts and account updates in one place.
            </p>
          </div>
          <button
            type="button"
            className={`btn btnSecondary ${styles.markAllBtn}`}
            onClick={handleMarkAllRead}
            disabled={unreadTotal === 0}
          >
            Mark all read
          </button>
        </header>

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
              {unreadByTab[item.id] > 0 ? (
                <span className={styles.tabCount}>{unreadByTab[item.id]}</span>
              ) : null}
            </button>
          ))}
        </div>

        {loading && filtered.length === 0 ? (
          <div className={styles.skeletonStack} aria-hidden>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>You&apos;re all caught up</h2>
            <p className={styles.empty}>
              New session requests and updates will show up here. Stay online so
              seekers can reach you.
            </p>
          </div>
        ) : (
          <ul className={styles.list}>
            {filtered.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  className={`${styles.row} ${
                    notification.isRead ? styles.rowRead : styles.rowUnread
                  }`}
                  onClick={() => navigate(routeForNotification(notification))}
                >
                  <div className={styles.rowIcon}>
                    <NotificationTypeIcon
                      type={notification.type}
                      className={styles.typeIcon}
                    />
                  </div>
                  <div className={styles.rowBody}>
                    <div className={styles.rowTop}>
                      <span className={styles.rowTitle}>{notification.title}</span>
                      {!notification.isRead && (
                        <span className={styles.unreadDot} aria-label="Unread" />
                      )}
                    </div>
                    <p className={styles.rowText}>{notification.body}</p>
                    <time
                      className={styles.rowTime}
                      dateTime={notification.createdAt}
                    >
                      {formatRelativeTime(notification.createdAt)}
                    </time>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
