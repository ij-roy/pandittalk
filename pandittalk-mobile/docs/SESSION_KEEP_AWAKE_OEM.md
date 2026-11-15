# Session keep-awake (OEM screen lock)

Issue #301: on some Android OEMs (Xiaomi / Oppo / etc.), `expo-keep-awake` alone can be cleared by battery managers so the screen dims/locks mid video or audio call.

## Layers

1. **JS** — `useSessionKeepAwake` activates keep-awake, re-asserts on `AppState` active, and periodically re-asserts while the session screen is mounted
2. **Android native** — the WebRTC dev client keeps `WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON` for the session lifetime; video surface sets `keepScreenOn = true`
3. **iOS native** — the WebRTC session keeps `UIApplication.shared.isIdleTimerDisabled = true` for the session lifetime (restored on stop)

Tracks #301.
