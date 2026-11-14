import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Linking, Platform } from 'react-native';

const ASKED_KEY = 'pandittalk.storeRatingAsked';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.pandittalk.mobile';

export async function hasAskedStoreRating(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ASKED_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markStoreRatingAsked(): Promise<void> {
  try {
    await AsyncStorage.setItem(ASKED_KEY, '1');
  } catch {
    // A failed write may ask again later. The review itself is already saved.
  }
}

export async function requestStoreRating(): Promise<void> {
  await markStoreRatingAsked();
  try {
    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
      return;
    }
  } catch {
    // Fall through to the store page on Android.
  }
  if (Platform.OS === 'android') {
    await Linking.openURL(PLAY_STORE_URL);
  }
}
