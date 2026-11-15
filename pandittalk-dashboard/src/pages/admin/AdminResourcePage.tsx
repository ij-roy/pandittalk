import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchAdminResource,
  updateAdminApplicationStatus,
  updateAdminBookingStatus,
  type AdminResource,
} from "../../lib/adminApi";
import { AdminShell } from "../../components/AdminShell";
import styles from "./AdminPages.module.css";

const resourceMeta: Record<
  AdminResource,
  { title: string; description: string }
> = {
  users: {
    title: "Users",
    description: "Customer and staff accounts currently registered.",
  },
  pandits: {
    title: "Pandits",
    description: "Expert profiles, verification, and availability.",
  },
  bookings: {
    title: "Bookings",
    description: "Review sessions and update their operational status.",
  },
  applications: {
    title: "Pandit applications",
    description: "Review incoming expert applications.",
  },
  articles: {
    title: "Articles",
    description: "Content visibility and publishing activity.",
  },
  notifications: {
    title: "Notifications",
    description: "Recent notifications sent by the platform.",
  },
  transactions: {
    title: "Transactions",
    description: "Demo wallet and payment activity.",
  },
  reports: {
    title: "Reports",
    description: "Saved customer reports and generated guidance.",
  },
};

const allowedResources = new Set<AdminResource>(
  Object.keys(resourceMeta) as AdminResource[],
);

function text(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function displayKey(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function recordColumns(item: Record<string, unknown>): string[] {
  return Object.keys(item)
    .filter(
      (key) =>
        !["createdAt", "updatedAt", "publishedAt", "inputSummary"].includes(
          key,
        ),
    )
    .slice(0, 6);
}

export function AdminResourcePage() {
  const { resource: rawResource } = useParams();
  const resource =
    rawResource && allowedResources.has(rawResource as AdminResource)
      ? (rawResource as AdminResource)
      : "users";
  const meta = resourceMeta[resource];
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminResource(resource, submittedSearch);
      setItems(result.items);
      setTotal(result.total);
    } catch {
      setError("Could not load this management view.");
    } finally {
      setLoading(false);
    }
  }, [resource, submittedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(() => recordColumns(items[0] ?? {}), [items]);

  async function updateStatus(item: Record<string, unknown>, status: string) {
    const id = typeof item.id === "string" ? item.id : null;
    if (!id) return;
    setUpdatingId(id);
    try {
      if (resource === "bookings") {
        await updateAdminBookingStatus(
          id,
          status as "confirmed" | "completed" | "cancelled",
        );
      } else if (resource === "applications") {
        await updateAdminApplicationStatus(
          id,
          status as "received" | "reviewing" | "approved" | "rejected",
        );
      }
      await load();
    } catch {
      setError("That status update could not be saved.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <AdminShell>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.kicker}>Management</p>
          <h2>{meta.title}</h2>
          <p className={styles.subtle}>{meta.description}</p>
        </div>
        <Link className="btn btnSecondary" to="/admin">
          Back to overview
        </Link>
      </section>
      <form
        className={styles.toolbar}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmittedSearch(search.trim());
        }}
      >
        <label className={styles.searchLabel} htmlFor="admin-search">
          Search
        </label>
        <input
          id="admin-search"
          className={styles.search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`Search ${meta.title.toLowerCase()}`}
        />
        <button className="btn btnPrimary" type="submit">
          Search
        </button>
        <span className={styles.total}>{total} records</span>
      </form>
      {error ? <p className={styles.error}>{error}</p> : null}
      <div className={styles.tableCard}>
        {loading ? <p className={styles.empty}>Loading records…</p> : null}
        {!loading && items.length === 0 ? (
          <p className={styles.empty}>No records found.</p>
        ) : null}
        {!loading && items.length > 0 ? (
          <div className={styles.tableScroll}>
            <table>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column}>{displayKey(column)}</th>
                  ))}
                  {resource === "bookings" || resource === "applications" ? (
                    <th>Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={text(item.id) === "—" ? index : text(item.id)}>
                    {columns.map((column) => (
                      <td key={column}>{text(item[column])}</td>
                    ))}
                    {resource === "bookings" ? (
                      <td>
                        <select
                          className={styles.statusSelect}
                          value={
                            typeof item.status === "string" ? item.status : ""
                          }
                          disabled={updatingId === item.id}
                          onChange={(event) =>
                            void updateStatus(item, event.target.value)
                          }
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    ) : resource === "applications" ? (
                      <td>
                        <select
                          className={styles.statusSelect}
                          value={
                            typeof item.status === "string"
                              ? item.status
                              : "received"
                          }
                          disabled={updatingId === item.id}
                          onChange={(event) =>
                            void updateStatus(item, event.target.value)
                          }
                        >
                          <option value="received">Received</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
