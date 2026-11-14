import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { getApiBase } from '@/lib/authApi';
import {
  ANDROID_PLAY_STORE_URL,
  IOS_APP_STORE_URL,
} from '@/constants/storeUrls';

const SOFT_DISMISS_KEY = 'pandittalk.appUpdate.softDismissedLatest';

export type PlatformUpdatePolicy = {
  latestVersion: string;
  minSupportedVersion: string;
  storeUrl: string;
  message: string;
};

export type AppUpdateDecision =
  | { kind: 'none' }
  | {
      kind: 'soft' | 'force';
      message: string;
      storeUrl: string;
      latestVersion: string;
    };

export function parseVersionParts(version: string): number[] {
  return version
    .trim()
    .split('.')
    .map((part) => {
      const n = Number.parseInt(part.replace(/[^0-9].*$/, ''), 10);
      return Number.isFinite(n) ? n : 0;
    });
}

/** Compare semver-ish strings: -1 if a<b, 0 if equal, 1 if a>b. */
export function compareVersions(a: string, b: string): number {
  const left = parseVersionParts(a);
  const right = parseVersionParts(b);
  const len = Math.max(left.length, right.length);
  for (let i = 0; i < len; i += 1) {
    const lv = left[i] ?? 0;
    const rv = right[i] ?? 0;
    if (lv < rv) return -1;
    if (lv > rv) return 1;
  }
  return 0;
}

export function getInstalledAppVersion(): string {
  return Constants.expoConfig?.version?.trim() || '0.0.0';
}

export async function fetchAppUpdatePolicy(): Promise<{
  ios: PlatformUpdatePolicy;
  android: PlatformUpdatePolicy;
} | null> {
  const override = process.env.EXPO_PUBLIC_APP_UPDATE_URL?.trim();
  const url = override || `${getApiBase()}/public/app-update`;
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      ios?: Partial<PlatformUpdatePolicy>;
      android?: Partial<PlatformUpdatePolicy>;
    };
    if (!data?.ios || !data?.android) return null;
    return {
      ios: normalizePolicy(data.ios, IOS_APP_STORE_URL),
      android: normalizePolicy(data.android, ANDROID_PLAY_STORE_URL),
    };
  } catch {
    return null;
  }
}

function normalizePolicy(
  partial: Partial<PlatformUpdatePolicy>,
  fallbackStore: string,
): PlatformUpdatePolicy {
  return {
    latestVersion: partial.latestVersion?.trim() || '1.0.0',
    minSupportedVersion: partial.minSupportedVersion?.trim() || '1.0.0',
    storeUrl: partial.storeUrl?.trim() || fallbackStore,
    message:
      partial.message?.trim() ||
      'A new version of PanditTalk is available. Please update for the best experience.',
  };
}

export async function decideAppUpdate(): Promise<AppUpdateDecision> {
  const policyBundle = await fetchAppUpdatePolicy();
  if (!policyBundle) return { kind: 'none' };

  const policy =
    Platform.OS === 'ios' ? policyBundle.ios : policyBundle.android;
  const current = getInstalledAppVersion();

  if (compareVersions(current, policy.minSupportedVersion) < 0) {
    return {
      kind: 'force',
      message: policy.message,
      storeUrl: policy.storeUrl,
      latestVersion: policy.latestVersion,
    };
  }

  if (compareVersions(current, policy.latestVersion) < 0) {
    const dismissed = await AsyncStorage.getItem(SOFT_DISMISS_KEY);
    if (dismissed === policy.latestVersion) {
      return { kind: 'none' };
    }
    return {
      kind: 'soft',
      message: policy.message,
      storeUrl: policy.storeUrl,
      latestVersion: policy.latestVersion,
    };
  }

  return { kind: 'none' };
}

export async function dismissSoftUpdate(latestVersion: string): Promise<void> {
  await AsyncStorage.setItem(SOFT_DISMISS_KEY, latestVersion);
}
