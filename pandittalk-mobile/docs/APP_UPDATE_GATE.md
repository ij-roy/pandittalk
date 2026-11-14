# App update force/soft gate — GitHub #236

## Behavior

On launch / foreground, mobile fetches `GET {API}/public/app-update` (or
`EXPO_PUBLIC_APP_UPDATE_URL`) and compares `expo.version`:

| Condition | UI |
| --- | --- |
| `current < minSupportedVersion` | **Force** — Update only (non-dismissible) |
| `minSupported ≤ current < latest` | **Soft** — Update / Later (Later remembered per `latestVersion`) |
| Fetch fails | Fail-open (no modal) |

## Ops — raise the floor without an app change

Set env on user-service (defaults shown):

```
IOS_LATEST_VERSION=1.0.9
IOS_MIN_SUPPORTED_VERSION=1.0.0
ANDROID_LATEST_VERSION=1.0.9
ANDROID_MIN_SUPPORTED_VERSION=1.0.0
IOS_STORE_URL=https://apps.apple.com/app/id6797837559
ANDROID_STORE_URL=https://play.google.com/store/apps/details?id=com.pandittalk.mobile
APP_UPDATE_MESSAGE=A new version of PanditTalk is available.
```

To block old binaries after a breaking API change, bump `*_MIN_SUPPORTED_VERSION`
above those clients’ `app.json` version.

## Files

- Backend: `GET /public/app-update` in `user-service.controller.ts`
- Mobile: `lib/appUpdateConfig.ts`, `components/AppUpdateGate.tsx`, mounted in `app/_layout.tsx`
