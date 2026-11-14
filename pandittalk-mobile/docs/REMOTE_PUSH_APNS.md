# Remote push (APNs / Expo) — #65 / #316

## What shipped

### Mobile
- After login, `registerRemotePushToken()` requests permission, fetches an Expo push token (`getExpoPushTokenAsync` with EAS `projectId`), and `POST /notifications/push-token`
- Wired from `NotificationProvider` when `accessToken` is ready
- Local scheduling (`localNotificationScheduler`) remains for in-app / foreground UX

### Backend
- `PushDevice` table (`push_devices`) stores Expo tokens per user
- `POST /notifications/push-token` / `DELETE /notifications/push-token`
- `createNotification` also dispatches via Expo Push API → APNs/FCM when credentials exist

## Ops required (human)

1. **Apple Developer** — create APNs key (`.p8`), enable Push Notifications on App ID `com.pandittalk.mobile`
2. **EAS** — `eas credentials` → iOS → assign APNs key to the project (`0a1e1481-b5e2-40b6-8932-5905f074dda3`)
3. **Migrate** — apply `20260930140000_add_push_devices`
4. **TestFlight** — force-quit app, trigger a booking/session notification from backend, confirm banner

## Verify

```bash
# After login on device, token row exists:
# SELECT platform, left(token, 24) FROM push_devices WHERE user_id = '...';
```

Expo push receipts: DeviceNotRegistered tokens are deleted automatically.

## Privacy

Device ID / push token is declared in App Privacy (#306). Do not claim remote push in screenshots until TestFlight path is green.
