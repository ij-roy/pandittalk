import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { bootstrapAuthSession } from "../lib/api";
import { usePanditStore } from "../store/usePanditStore";
import type { UserRole } from "../types";

export function ProtectedRoute({
  allowedRoles,
}: {
  allowedRoles?: UserRole[];
}) {
  const accessToken = usePanditStore((state) => state.accessToken);
  const role = usePanditStore((state) => state.role);
  const authHydrated = usePanditStore((state) => state.authHydrated);

  useEffect(() => {
    if (!authHydrated) {
      void bootstrapAuthSession();
    }
  }, [authHydrated]);

  if (!authHydrated) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        Restoring session…
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={role === "ADMIN" ? "/admin" : "/dashboard"} replace />;
  }

  return <Outlet />;
}
