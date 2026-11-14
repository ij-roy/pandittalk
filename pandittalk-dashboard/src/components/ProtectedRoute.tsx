import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { bootstrapAuthSession } from '../lib/api';
import { usePanditStore } from '../store/usePanditStore';

export function ProtectedRoute() {
  const accessToken = usePanditStore((state) => state.accessToken);
  const authHydrated = usePanditStore((state) => state.authHydrated);

  useEffect(() => {
    if (!authHydrated) {
      void bootstrapAuthSession();
    }
  }, [authHydrated]);

  if (!authHydrated) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui' }}>
        Restoring session…
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
