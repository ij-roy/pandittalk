import AsyncStorage from '@react-native-async-storage/async-storage';

import { rememberTool } from '@/lib/recentTools';

const STORAGE_KEY = 'pandittalk.recentTools';

export async function readRecentTools(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

export async function recordRecentTool(id: string): Promise<void> {
  const history = rememberTool(await readRecentTools(), id);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // The tool still opens if the recent list cannot be saved.
  }
}
