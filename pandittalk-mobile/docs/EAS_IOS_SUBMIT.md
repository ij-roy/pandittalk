# EAS iOS production submit readiness — GitHub #318

## Identity (must match App Store Connect)

| Field | Value |
| --- | --- |
| Bundle ID | `com.pandittalk.mobile` |
| ASC App ID | `6797837559` |
| Apple Team | `K54M9H3JQG` |
| Apple ID (submit) | `admininfo@pandittalk.com` |
| Marketing version | `expo.version` in `app.json` (e.g. `1.0.9`) → CFBundleShortVersionString |
| Build number | `expo.ios.buildNumber` + **EAS auto-increment** → CFBundleVersion |

## Version bump strategy (no collisions)

`eas.json` production profile:

- `autoIncrement: true`
- `ios.autoIncrement: "buildNumber"`
- `android.autoIncrement: "versionCode"`
- `cli.appVersionSource: "local"` — bump **marketing** version in `app.json` when you cut a user-facing release; EAS increments build numbers for every upload

Two consecutive `eas build -p ios --profile production` runs must never reuse the same CFBundleVersion. Do **not** set `autoIncrement: false`.

## Secrets hygiene

**Do not** commit live Razorpay / OAuth secrets in `eas.json`.

Set EAS project environment variables (Expo dashboard → Project → Environment variables, or CLI) for **preview** and **production**:

| Variable | Notes |
| --- | --- |
| `EXPO_PUBLIC_RAZORPAY_KEY_ID` | Live Key ID for store builds (publishable, but keep out of git) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google Sign-In web client |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google Sign-In iOS client |

Local/dev: use `apps/mobile/.env` from `.env.example` (**test** Razorpay key only).

`eas.json` only hardcodes non-secret `EXPO_PUBLIC_API_BASE`.

## Release checklist

1. Confirm ASC app record: bundle `com.pandittalk.mobile`, team `K54M9H3JQG`, App ID `6797837559`
2. Confirm EAS env vars above are set for **production**
3. Bump `app.json` `version` if this is a user-facing release (marketing version)
4. From `apps/mobile`:
   ```powershell
   npx eas-cli whoami
   npx eas-cli build -p ios --profile production
   npx eas-cli submit --platform ios --latest --profile production
   ```
5. App Store Connect → **TestFlight** → process → internal test
6. When ready: Distribution → Add for Review (with App Review notes from `APP_STORE_REVIEW_NOTES.md`)

Full command reference: [`docs/mobile-eas-builds.md`](../../../docs/mobile-eas-builds.md)
