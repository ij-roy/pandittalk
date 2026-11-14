# Android 15 edge-to-edge nav bar contrast

Issue #296: with `edgeToEdgeEnabled`, the system navigation bar is translucent and 3-button icons can wash out against light chrome.

## Behavior

- Root layout sets dark nav-bar button style + `StatusBar style="dark"` for the light app shell
- Session stack temporarily switches to light buttons (dark call UI), restores dark on leave
- Helper: `lib/androidSystemBars.ts` (`expo-navigation-bar` `setStyle` / `setButtonStyleAsync`)

Tracks #296.
