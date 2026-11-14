import type { Router } from 'expo-router';

/**
 * Leave a nested tools screen for the Tools tab hub without stacking
 * another `/(tabs)/tools` entry (Android back becomes unpredictable otherwise).
 */
export function goToToolsHub(router: Router): void {
  try {
    if (typeof router.dismissTo === 'function') {
      router.dismissTo('/(tabs)/tools');
      return;
    }
  } catch {
    // fall through
  }
  router.replace('/(tabs)/tools');
}
