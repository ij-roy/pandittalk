import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';
import { NotificationBell } from './NotificationBell';
import { logoutSession } from '../lib/api';
import { chatSocket } from '../lib/chatSocket';
import { usePanditStore } from '../store/usePanditStore';
import styles from './AppShell.module.css';

function initialsFromName(name: string | null): string {
  if (!name) return 'P';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'P';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const panditName = usePanditStore((s) => s.panditName);
  const isOnline = usePanditStore((s) => s.isOnline);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const articlesActive =
    location.pathname === '/articles' ||
    (location.pathname.startsWith('/articles/') &&
      location.pathname !== '/articles/performance');

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  function handleLogout() {
    setMenuOpen(false);
    chatSocket.disconnect();
    void logoutSession().then(() => {
      navigate('/login', { replace: true });
    });
  }

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar} aria-label="Workspace">
        <div className={styles.brandBlock}>
          <p className={styles.brand}>PanditTalk</p>
          <p className={styles.workspaceLabel}>Pandit workspace</p>
        </div>

        <nav className={styles.nav} aria-label="Dashboard">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            Sessions
          </NavLink>
          <NavLink
            to="/articles"
            className={() =>
              articlesActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            Articles
          </NavLink>
          <NavLink
            to="/articles/performance"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            Performance
          </NavLink>
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            Notifications
          </NavLink>
          <NavLink
            to="/clients"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            Clients
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            Profile
          </NavLink>
          <Link to="/contact" className={styles.navLink}>
            Help
          </Link>
        </nav>

        <div className={styles.sidebarTools}>
          <NotificationBell />
        </div>

        <div className={styles.sidebarFooter} ref={menuRef}>
          <button
            type="button"
            className={styles.identityBtn}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={styles.avatar} aria-hidden>
              {initialsFromName(panditName)}
            </span>
            <div className={styles.identityText}>
              <p className={styles.identityName}>{panditName || 'Pandit'}</p>
              <p
                className={`${styles.identityStatus} ${
                  isOnline ? styles.identityOnline : styles.identityOffline
                }`}
              >
                {isOnline ? 'Online for bookings' : 'Offline'}
              </p>
            </div>
          </button>
          {menuOpen ? (
            <div className={styles.accountMenu} role="menu">
              <button
                type="button"
                className={styles.accountMenuItem}
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/profile');
                }}
              >
                Profile
              </button>
              <button
                type="button"
                className={styles.accountMenuItem}
                role="menuitem"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <div className={styles.topbarBrand}>
            <p className={styles.brandCompact}>PanditTalk</p>
            {panditName ? <p className={styles.panditName}>{panditName}</p> : null}
          </div>
          <div className={styles.headerActions}>
            <span
              className={`${styles.presenceChip} ${
                isOnline ? styles.presenceOnline : styles.presenceOffline
              }`}
            >
              <span className={styles.presenceDot} aria-hidden />
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <NotificationBell />
            <button
              type="button"
              className={`btn btnGhost ${styles.logoutBtnMobile}`}
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
        <CommandPalette />

        <nav className={styles.mobileNav} aria-label="Mobile">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? `${styles.mobileNavLink} ${styles.mobileNavActive}` : styles.mobileNavLink
            }
          >
            Sessions
          </NavLink>
          <NavLink
            to="/articles"
            className={() =>
              articlesActive
                ? `${styles.mobileNavLink} ${styles.mobileNavActive}`
                : styles.mobileNavLink
            }
          >
            Articles
          </NavLink>
          <NavLink
            to="/articles/performance"
            className={({ isActive }) =>
              isActive ? `${styles.mobileNavLink} ${styles.mobileNavActive}` : styles.mobileNavLink
            }
          >
            Insights
          </NavLink>
          <NavLink
            to="/clients"
            className={({ isActive }) =>
              isActive ? `${styles.mobileNavLink} ${styles.mobileNavActive}` : styles.mobileNavLink
            }
          >
            Clients
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive ? `${styles.mobileNavLink} ${styles.mobileNavActive}` : styles.mobileNavLink
            }
          >
            Profile
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
