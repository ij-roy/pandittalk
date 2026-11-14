import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { API_BASE } from '@/lib/authApi';
import { requestNotificationPermissionIfNeeded } from '@/lib/localNotificationScheduler';
import { useAuthStore } from '@/store/useAuthStore';
import axios from 'axios';

function projectId(): string | undefined {
  return (
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
      ?.projectId
  );
}

/**
 * Obtain Expo push token (APNs/FCM via EAS) and register with backend (#65 / #316).
 * Safe no-op on simulator / permission denied / missing project id.
 */
export async function registerRemotePushToken(): Promise<string | null> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) return null;

  const granted = await requestNotificationPermissionIfNeeded();
  if (!granted) return null;

  const pid = projectId();
  if (!pid) return null;

  try {
    const push = await Notifications.getExpoPushTokenAsync({ projectId: pid });
    const token = push.data?.trim();
    if (!token) return null;

    await axios.post(
      `${API_BASE}/notifications/push-token`,
      { token, platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web' },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return token;
  } catch {
    return null;
  }
}

export async function unregisterRemotePushToken(token: string | null): Promise<void> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken || !token) return;
  try {
    await axios.delete(`${API_BASE}/notifications/push-token`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { token },
    });
  } catch {
    // Best-effort on logout.
  }
}
