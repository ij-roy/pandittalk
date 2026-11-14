import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

/**
 * Keep the display awake while a session wants the screen on.
 * Voice calls pass enabled=false unless the person turns Keep screen on.
 * Video stays enabled. Re-assert on resume because some phones drop the JS lock.
 */
export function useSessionKeepAwake(tag: string, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const assertAwake = () => {
      if (cancelled) return;
      void activateKeepAwakeAsync(tag).catch(() => {
        // ignore — native window flag is the backup
      });
    };

    assertAwake();
    // OEM workarounds: re-assert after resume and periodically while foregrounded.
    intervalId = setInterval(assertAwake, Platform.OS === 'android' ? 25_000 : 60_000);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') assertAwake();
    });

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      sub.remove();
      try {
        deactivateKeepAwake(tag);
      } catch {
        // ignore
      }
    };
  }, [enabled, tag]);
}
