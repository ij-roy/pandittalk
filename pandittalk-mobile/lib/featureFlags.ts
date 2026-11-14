import axios from 'axios';

import { API_BASE } from '@/lib/authApi';

export type FeatureFlags = {
  payments: boolean;
  digitalTools: boolean;
};

/** Matches the server defaults if the config request fails. */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  payments: true,
  digitalTools: false,
};

let cached: FeatureFlags = DEFAULT_FEATURE_FLAGS;
let loaded = false;
const listeners = new Set<(flags: FeatureFlags) => void>();

export function getFeatureFlags(): FeatureFlags {
  return cached;
}

export function subscribeFeatureFlags(listener: (flags: FeatureFlags) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function applyFlags(next: FeatureFlags) {
  cached = next;
  loaded = true;
  listeners.forEach((listener) => listener(next));
}

export async function refreshFeatureFlags(): Promise<FeatureFlags> {
  try {
    const { data } = await axios.get<unknown>(`${API_BASE}/config/features`, { timeout: 8000 });
    const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    const next: FeatureFlags = {
      payments: record.payments !== false,
      digitalTools: record.digitalTools === true,
    };
    applyFlags(next);
    return next;
  } catch {
    if (!loaded) applyFlags(DEFAULT_FEATURE_FLAGS);
    return cached;
  }
}
