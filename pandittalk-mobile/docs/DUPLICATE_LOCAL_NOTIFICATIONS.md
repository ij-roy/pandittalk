# Duplicate local notifications (#269)

## Problem

Pre-session reminders used both Expo scheduled locals (OS) and in-app JS timers. While the app was foregrounded, both could fire for the same 30/10/5‑minute threshold. Chat immediates also lacked stable identifiers, so socket retries stacked duplicate banners.

## Fix

- Suppress OS display of `session_pre_reminder` when `AppState` is `active` (in-app banner owns foreground UX)
- On Expo receive, `markReminderFired` so JS timers for that threshold do not fire again
- Immediate chat notifications use stable `identifier` keyed by notification id

## Verify

- Foreground: only in-app banner at T‑30/10/5 (no second system tray toast)
- Background then open: at most one delivery per threshold
- Rapid duplicate socket `new_message`: one local notification
