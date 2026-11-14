import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { API_BASE } from '@/lib/authApi';

const BLOCKED_PANDITS_KEY = 'pandittalk.blockedPanditIds';

async function writeLocal(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(BLOCKED_PANDITS_KEY, JSON.stringify(ids));
}

export async function getBlockedPanditIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(BLOCKED_PANDITS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return [];
  }
}

export async function isPanditBlocked(panditId: string): Promise<boolean> {
  const ids = await getBlockedPanditIds();
  return ids.includes(panditId);
}

/** Prefer server list when signed in; fall back to local cache. */
export async function syncBlockedPanditIds(
  accessToken: string | null | undefined,
): Promise<string[]> {
  if (!accessToken) return getBlockedPanditIds();
  try {
    const res = await axios.get(`${API_BASE}/users/blocks`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const remote = Array.isArray(res.data?.panditIds)
      ? (res.data.panditIds as unknown[]).filter(
          (id): id is string => typeof id === 'string' && id.length > 0,
        )
      : [];
    await writeLocal(remote);
    return remote;
  } catch {
    return getBlockedPanditIds();
  }
}

export async function blockPandit(
  panditId: string,
  accessToken?: string | null,
): Promise<void> {
  const ids = await getBlockedPanditIds();
  if (!ids.includes(panditId)) {
    ids.push(panditId);
    await writeLocal(ids);
  }
  if (!accessToken) return;
  await axios.post(
    `${API_BASE}/users/blocks`,
    { panditId },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

export async function unblockPandit(
  panditId: string,
  accessToken?: string | null,
): Promise<void> {
  const ids = (await getBlockedPanditIds()).filter((id) => id !== panditId);
  await writeLocal(ids);
  if (!accessToken) return;
  await axios.delete(`${API_BASE}/users/blocks/${panditId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
