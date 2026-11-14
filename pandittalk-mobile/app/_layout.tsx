import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { NotificationProvider } from '@/components/NotificationProvider';
import { AppUpdateGate } from '@/components/AppUpdateGate';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ToastHost } from '@/components/ui/ToastHost';
import '@/lib/authApi';
import { setAndroidNavBarButtonStyle } from '@/lib/androidSystemBars';
import { clearAuthSession, loadAuthSession } from '@/lib/authSecureStorage';
import { refreshAccessToken } from '@/lib/authApi';
import { isJwtExpired } from '@/lib/jwtUtils';
import { authGateTarget } from '@/lib/authHydrationGate';
import { syncAllBookingReminders } from '@/lib/localNotificationScheduler';
import { useAuthStore } from '@/store/useAuthStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

export function ErrorBoundary({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return <AppErrorBoundary error={error} retry={retry} />;
}

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const authHydrated = useAuthStore((s) => s.authHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const guestMode = useAuthStore((s) => s.guestMode);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const session = await loadAuthSession();
      if (cancelled) return;
      if (session?.accessToken && session.refreshToken) {
        if (isJwtExpired(session.accessToken)) {
          useAuthStore.getState().stageRestoredSession(session);
          const refreshed = await refreshAccessToken();
          if (cancelled) return;
          if (!refreshed) {
            await clearAuthSession();
            useAuthStore.getState().clearAuth();
          } else {
            void syncAllBookingReminders();
          }
        } else {
          useAuthStore.getState().setAuth(session);
          void syncAllBookingReminders();
        }
      } else {
        if (session) {
          await clearAuthSession();
        }
        useAuthStore.getState().markAuthHydrated();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Login-first gate: send signed-out, non-guest users to the login screen.
  // Guests (Continue as guest) and signed-in users browse freely; protected
  // actions still prompt login on their own.
  // legal-webview is allowed so Terms/Privacy can open from the login checkbox.
  useEffect(() => {
    if (!authHydrated) return;
    const seg0 = String(segments[0] ?? '');
    const inAuthFlow =
      seg0 === 'login' ||
      seg0 === 'verify-otp' ||
      seg0 === 'link-phone' ||
      seg0 === 'legal-webview';
    if (
      authGateTarget({
        hydrated: authHydrated,
        hasAccessToken: Boolean(accessToken),
        guest: guestMode,
        inAuthFlow,
      }) === '/login'
    ) {
      router.replace('/login');
    }
  }, [authHydrated, accessToken, guestMode, segments, router]);

  useEffect(() => {
    if (authHydrated) {
      void SplashScreen.hideAsync();
    }
  }, [authHydrated]);

  // Light UI chrome: dark system nav buttons so 3-button nav stays readable on Android 15.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    setAndroidNavBarButtonStyle('dark');
  }, []);

  return (
    <KeyboardProvider
      statusBarTranslucent
      navigationBarTranslucent
      preserveEdgeToEdge
    >
      <ThemeProvider value={DefaultTheme}>
        <NotificationProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
            <Stack.Screen name="link-phone" options={{ headerShown: false }} />
            <Stack.Screen name="legal-webview" options={{ headerShown: false }} />
            <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
            <Stack.Screen name="start-guidance" options={{ headerShown: false }} />
            <Stack.Screen name="guidance" options={{ headerShown: false }} />
            <Stack.Screen name="tools" options={{ headerShown: false }} />
            <Stack.Screen name="session" options={{ headerShown: false }} />
            <Stack.Screen name="expert/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="experts/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="booking/select-slot" options={{ headerShown: false }} />
            <Stack.Screen name="booking/confirmation" options={{ headerShown: false }} />
            <Stack.Screen name="bookings/history" options={{ headerShown: false }} />
            <Stack.Screen name="bookings/review" options={{ headerShown: false }} />
            <Stack.Screen name="reports/index" options={{ headerShown: false }} />
            <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
            <Stack.Screen name="wallet/index" options={{ headerShown: false }} />
            <Stack.Screen name="wallet/recharge" options={{ headerShown: false }} />
            <Stack.Screen name="articles" options={{ headerShown: false }} />
            <Stack.Screen name="app/compatibility" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
          </Stack>
        <ToastHost />
        <OfflineBanner />
        <AppUpdateGate />
        <StatusBar style="dark" />
      </NotificationProvider>
    </ThemeProvider>
    </KeyboardProvider>
  );
}
