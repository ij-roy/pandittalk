# App Privacy nutrition labels + Privacy Manifest (#306)

## In-repo privacy manifest

Source of truth for Expo/EAS iOS builds:

- `apps/mobile/app.json` → `expo.ios.privacyManifests`
- Mirror checklist JSON: `apps/mobile/PrivacyInfo.xcprivacy`

`npx expo prebuild` / EAS Build embeds the manifest into the iOS archive. After changing `privacyManifests`, regenerate native iOS (`ios/PanditTalk/PrivacyInfo.xcprivacy`) via prebuild or the next EAS build.

**Tracking:** `NSPrivacyTracking: false` — no advertising ID / cross-app tracking domains.

### Declared collected data (linked, not used for tracking)

| Type | Why |
|------|-----|
| Phone number | OTP auth |
| Email | Google / Apple sign-in, profile |
| Name | Profile |
| User ID | Account |
| Date of birth | Astrology tools + 18+ gate |
| Photos or videos | Profile avatar, palm upload |
| Audio data | Live A/V consultations (WebRTC) |
| Purchase history | Wallet / Razorpay |
| Other user content | Chat, birth place, reviews |
| Device ID | Push token registration (when enabled) |

### Required-reason APIs

| API | Reason |
|-----|--------|
| UserDefaults | CA92.1 |
| File timestamp | C617.1 |
| Disk space | E174.1 |
| System boot time | 35F9.1 |

## App Store Connect questionnaire (eng + legal)

Use the same inventory when filling **App Privacy**. For each type, mark:

- **Collected:** Yes (as above)
- **Linked to identity:** Yes
- **Used for tracking:** No
- **Purposes:** App Functionality (and Customer Support where tickets/export apply)

### Third parties (processors, not trackers)

| Party | Data | Notes |
|-------|------|-------|
| Razorpay | Payment / purchase history | Checkout |
| Google Sign-In | Email, name, user id | Optional login |
| Sign in with Apple | Email/relay, user id | Required if Google offered on iOS |
| WebRTC/STUN/TURN | Audio/video session connectivity | Consultations |
| Expo / APNs | Device push token | Session reminders when remote push ships |
| Firebase (config present) | None for analytics today | Confirm no Analytics SDK enabled before ASC answers |

Do **not** declare tracking unless a future SDK introduces ATT / advertising IDs.

## Privacy Policy URL

- Canonical: `https://www.pandittalk.com/privacy` (`getPrivacyPolicyUrl()` in `constants/legal.ts`)
- Must open without login (also covered by www legal pages / #312)

## Account deletion / retention

- In-app: Settings → delete account (`DELETE` profile)
- Public page: `https://www.pandittalk.com/account-deletion`
- Align retention language in Privacy Policy with export (#266) and delete flows

## Remaining human steps (cannot automate)

- [ ] Paste answers into App Store Connect App Privacy and get legal sign-off
- [ ] Confirm archive from EAS includes updated `PrivacyInfo.xcprivacy`
- [ ] Re-check third-party SDKs before each submission
