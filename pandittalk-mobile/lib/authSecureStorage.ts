import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_SESSION_KEY = 'pandittalk.authSession';

export type PersistedAuthSession = {
  accessToken: string;
  refreshToken: string;
  hasProfile: boolean;
};

export async function saveAuthSession(session: PersistedAuthSession): Promise<void> {
  const raw = JSON.stringify(session);
  if (Platform.OS === 'web') {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(AUTH_SESSION_KEY, raw);
    }
    return;
  }
  await SecureStore.setItemAsync(AUTH_SESSION_KEY, raw);
}

export async function loadAuthSession(): Promise<PersistedAuthSession | null> {
  let raw: string | null = null;
  if (Platform.OS === 'web') {
    if (typeof sessionStorage !== 'undefined') {
      raw = sessionStorage.getItem(AUTH_SESSION_KEY);
    }
  } else {
    raw = await SecureStore.getItemAsync(AUTH_SESSION_KEY);
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'accessToken' in parsed &&
      typeof (parsed as PersistedAuthSession).accessToken === 'string' &&
      'refreshToken' in parsed &&
      typeof (parsed as PersistedAuthSession).refreshToken === 'string' &&
      'hasProfile' in parsed &&
      typeof (parsed as PersistedAuthSession).hasProfile === 'boolean'
    ) {
      return parsed as PersistedAuthSession;
    }
  } catch {
    // ignore corrupt storage
  }
  return null;
}

export async function clearAuthSession(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    }
    return;
  }
  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
}
