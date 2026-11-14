import AsyncStorage from '@react-native-async-storage/async-storage';

import { parseGuidancePreferences, type GuidancePreferences } from './guidancePreferences';

const STORAGE_KEY = 'pandittalk.guidancePreferences';

export async function loadGuidancePreferences(): Promise<GuidancePreferences | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return parseGuidancePreferences(raw);
  } catch {
    return null;
  }
}

export async function saveGuidancePreferences(prefs: GuidancePreferences): Promise<void> {
  const parsed = parseGuidancePreferences(JSON.stringify(prefs));
  if (!parsed) return;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // The next visit simply asks again.
  }
}
