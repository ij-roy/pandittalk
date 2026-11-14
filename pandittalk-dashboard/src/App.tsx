import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { NotificationProvider } from './components/NotificationProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { bootstrapAuthSession } from './lib/api';
import { ArticleEditor } from './pages/ArticleEditor';
import { ArticlePerformance } from './pages/ArticlePerformance';
import { ArticlesHome } from './pages/ArticlesHome';
import { AudioSession } from './pages/AudioSession';
import { ChatSession } from './pages/ChatSession';
import { Clients } from './pages/Clients';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { NotificationsPage } from './pages/NotificationsPage';
import { Profile } from './pages/Profile';
import { VideoSession } from './pages/VideoSession';
import { AccountDeletion } from './pages/legal/AccountDeletion';
import { ContactUs } from './pages/legal/ContactUs';
import { Disclaimer } from './pages/legal/Disclaimer';
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { RefundPolicy } from './pages/legal/RefundPolicy';
import { Terms } from './pages/legal/Terms';
import { usePanditStore } from './store/usePanditStore';

function NotificationLayout() {
  return (
    <NotificationProvider>
      <Outlet />
    </NotificationProvider>
  );
}

function AuthBootstrap({ children }: { children: ReactNode }) {
  const authHydrated = usePanditStore((s) => s.authHydrated);

  useEffect(() => {
    if (!authHydrated) {
      void bootstrapAuthSession();
    }
  }, [authHydrated]);

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/account-deletion" element={<AccountDeletion />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<NotificationLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/articles" element={<ArticlesHome />} />
              <Route path="/articles/performance" element={<ArticlePerformance />} />
              <Route path="/articles/:id" element={<ArticleEditor />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/session/audio/:bookingId" element={<AudioSession />} />
              <Route path="/session/video/:bookingId" element={<VideoSession />} />
              <Route path="/session/:bookingId" element={<ChatSession />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  );
}
