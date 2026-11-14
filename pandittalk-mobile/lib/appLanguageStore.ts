import AsyncStorage from '@react-native-async-storage/async-storage';

import { parseAppLanguage, type AppLanguage } from './appLanguage';

const STORAGE_KEY = 'pandittalk.appLanguage';

export async function loadAppLanguage(): Promise<AppLanguage> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return parseAppLanguage(raw);
  } catch {
    return 'en';
  }
}

export async function saveAppLanguage(language: AppLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, language);
  } catch {
    // The next launch stays on English.
  }
}
