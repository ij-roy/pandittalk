import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

/**
 * Android 15 edge-to-edge: nav bar is often translucent; button style must contrast
 * with content behind it. Light app chrome → dark buttons; dark session UI → light.
 */
export function setAndroidNavBarButtonStyle(style: 'light' | 'dark'): void {
  if (Platform.OS !== 'android') return;
  try {
    NavigationBar.setStyle(style);
  } catch {
    // ignore on unsupported platforms / emulators
  }
  void NavigationBar.setButtonStyleAsync(style).catch(() => {});
}
