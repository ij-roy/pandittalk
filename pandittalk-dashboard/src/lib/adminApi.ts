import { api } from "./api";

export interface AdminOverview {
  users: number;
  pandits: number;
  bookings: number;
  confirmedBookings: number;
  publishedArticles: number;
  transactions: number;
  pendingApplications: number;
}

export interface AdminPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export type AdminResource =
  | "users"
  | "pandits"
  | "bookings"
  | "applications"
  | "articles"
  | "notifications"
  | "transactions"
  | "reports";

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const { data } = await api.get<AdminOverview>("/admin/overview");
  return data;
}

export async function fetchAdminResource(
  resource: AdminResource,
  search = "",
): Promise<AdminPage<Record<string, unknown>>> {
  const { data } = await api.get<AdminPage<Record<string, unknown>>>(
    `/admin/${resource}`,
    { params: search ? { search } : undefined },
  );
  return data;
}

export async function updateAdminBookingStatus(
  bookingId: string,
  status: "confirmed" | "completed" | "cancelled",
): Promise<void> {
  await api.patch(`/admin/bookings/${bookingId}/status`, { status });
}

export async function updateAdminApplicationStatus(
  applicationId: string,
  status: "received" | "reviewing" | "approved" | "rejected",
): Promise<void> {
  await api.patch(`/admin/applications/${applicationId}/status`, { status });
}
