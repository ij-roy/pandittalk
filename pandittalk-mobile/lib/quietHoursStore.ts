import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pandittalk.quietHours';

export async function loadQuietHoursEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw == null) return true;
    return raw === '1';
  } catch {
    return true;
  }
}

export async function saveQuietHoursEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // The next launch reads the default, which is on.
  }
}
