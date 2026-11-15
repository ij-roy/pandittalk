import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logoutSession } from "../lib/api";
import styles from "./AdminShell.module.css";

const links = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/pandits", label: "Pandits" },
  { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/applications", label: "Applications" },
  { to: "/admin/articles", label: "Articles" },
  { to: "/admin/notifications", label: "Notifications" },
  { to: "/admin/transactions", label: "Transactions" },
  { to: "/admin/reports", label: "Reports" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logoutSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar} aria-label="Admin workspace">
        <div className={styles.brandBlock}>
          <p className={styles.brand}>PanditTalk</p>
          <p className={styles.workspaceLabel}>Admin workspace</p>
        </div>
        <nav className={styles.nav} aria-label="Admin navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                isActive
                  ? `${styles.navLink} ${styles.navLinkActive}`
                  : styles.navLink
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button
          className={styles.logout}
          type="button"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
        >
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </aside>
      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>Operations</p>
            <h1 className={styles.title}>PanditTalk control room</h1>
          </div>
          <button
            className="btn btnSecondary"
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
          >
            Sign out
          </button>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
