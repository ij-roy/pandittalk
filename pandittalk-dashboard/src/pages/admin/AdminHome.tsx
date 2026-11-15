import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "../../components/AdminShell";
import { fetchAdminOverview, type AdminOverview } from "../../lib/adminApi";
import styles from "./AdminPages.module.css";

const cards: Array<{ key: keyof AdminOverview; label: string; to: string }> = [
  { key: "users", label: "Active users", to: "/admin/users" },
  { key: "pandits", label: "Pandits", to: "/admin/pandits" },
  { key: "bookings", label: "Bookings", to: "/admin/bookings" },
  {
    key: "confirmedBookings",
    label: "Confirmed bookings",
    to: "/admin/bookings",
  },
  {
    key: "publishedArticles",
    label: "Published articles",
    to: "/admin/articles",
  },
  { key: "transactions", label: "Transactions", to: "/admin/transactions" },
  {
    key: "pendingApplications",
    label: "Pending applications",
    to: "/admin/applications",
  },
];

export function AdminHome() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAdminOverview()
      .then(setOverview)
      .catch(() => setError("Could not load the admin overview."));
  }, []);

  return (
    <AdminShell>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.kicker}>Live operations</p>
          <h2>Good to see you, Admin</h2>
          <p className={styles.subtle}>
            Review activity across the PanditTalk workspace.
          </p>
        </div>
      </section>
      {error ? <p className={styles.error}>{error}</p> : null}
      <div className={styles.statsGrid}>
        {cards.map((card) => (
          <Link className={styles.statCard} to={card.to} key={card.key}>
            <span>{card.label}</span>
            <strong>{overview ? overview[card.key] : "—"}</strong>
            <small>Open management view →</small>
          </Link>
        ))}
      </div>
      <div className={styles.callout}>
        <div>
          <p className={styles.kicker}>Role-based access</p>
          <h3>This workspace is admin-only.</h3>
          <p className={styles.subtle}>
            Every management request is protected server-side by the ADMIN role.
          </p>
        </div>
        <Link className="btn btnPrimary" to="/admin/bookings">
          Review bookings
        </Link>
      </div>
    </AdminShell>
  );
}
