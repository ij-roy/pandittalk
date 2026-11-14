import { Alert } from 'react-native';
import type { Router } from 'expo-router';

import { getUserProfile } from './authApi';
import {
  AGE_GATE_MARKETPLACE_MESSAGE,
  isAdultAccountUser,
} from './age';
import { coerceProfileRecord, mergeCoinBalanceIntoRecord } from './profileUtils';

function promptAgeGate(router: Pick<Router, 'push'>): void {
  Alert.alert('Age verification required', AGE_GATE_MARKETPLACE_MESSAGE, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Open profile',
      onPress: () => {
        router.push('/profile-setup');
      },
    },
  ]);
}

/**
 * Ensures the signed-in user has a profile DOB proving 18+.
 * Refreshes profile from API when the in-memory user payload lacks DOB.
 */
export async function ensureAdultForMarketplace(opts: {
  accessToken: string | null | undefined;
  user: Record<string, unknown> | null | undefined;
  setUser?: (user: Record<string, unknown>) => void;
  router: Pick<Router, 'push'>;
}): Promise<boolean> {
  const { accessToken, user, setUser, router } = opts;
  if (isAdultAccountUser(user)) return true;

  if (accessToken) {
    try {
      const res = await getUserProfile(accessToken);
      const record = coerceProfileRecord(res.data);
      if (record) {
        setUser?.(mergeCoinBalanceIntoRecord(res.data, record) as Record<string, unknown>);
        if (isAdultAccountUser(record)) return true;
      }
    } catch {
      // Fall through to prompt; booking/chat APIs will also enforce.
    }
  }

  promptAgeGate(router);
  return false;
}
