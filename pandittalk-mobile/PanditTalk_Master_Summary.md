# PanditTalk Mobile App — Master Summary

> **CURRENT STATE:** Post-Jun 26 work (premium UI system, saved reports, detailed tools, avatar/city pickers, `run-android.cjs`) is in **`apps/MASTER_SUMMARY.md` §0**. This doc is the v1.0.0 baseline.  
> **Purpose:** Mobile-focused handoff for AI assistants and developers. For full monorepo context (backend, dashboard, database, deployment), see [`apps/MASTER_SUMMARY.md`](../MASTER_SUMMARY.md).  
> **Last updated:** June 26, 2026 (VERSION 1.0.0; delta in MASTER §0 dated Jul 2)  
> **Monorepo path:** `apps/mobile/`  
> **Repository:** [PanditTalk-Monorepo](https://github.com/pandittalk/PanditTalk-Monorepo)

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Layout](#3-repository-layout)
4. [Navigation](#4-navigation)
5. [Authentication & Profile](#5-authentication--profile)
6. [Booking & Session Formats](#6-booking--session-formats)
7. [Live Text Chat](#7-live-text-chat)
8. [Live Audio Calls](#8-live-audio-calls)
9. [Wallet & Razorpay](#9-wallet--razorpay)
10. [Astrology Tools](#10-astrology-tools)
11. [Design System](#11-design-system)
12. [Known Gaps](#12-known-gaps)
13. [How to Run](#13-how-to-run)
14. [Key Files](#14-key-files)
15. [Appendix: Original Vision](#15-appendix-original-vision)

---

## 1. Product Overview

**PanditTalk** is an India-market astrology and spiritual guidance mobile app. Users browse verified pandits, book fixed-duration sessions (chat, **audio**, **video**), recharge a coin wallet via Razorpay, use free/paid astrology tools, read articles, receive notifications, and join live sessions with experts.

**Mobile app role:** Consumer-facing iOS/Android app (Expo v**1.0.0**). Pandits use the separate web dashboard at `apps/dashboard/`.

**Implemented on mobile:** Auth, profile, home (with article search/feed), experts, guidance flow, booking, wallet, tools, session history/reviews, Chat Now, live text chat, **live audio**, **live video** (native Chime Android), **articles**, **notifications** (in-app + local), **settings**.

**Not built:** Remote push (FCM/APNs), auth route guards, global 401 interceptor, iOS native video.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Expo SDK ~54 | `newArchEnabled: true` |
| UI | React Native 0.81.5, React 19.1 | |
| Routing | Expo Router 6 | File-based `app/` |
| State | Zustand 5 | `useAuthStore`, `useGuidanceFlowStore` |
| HTTP | Axios | Bearer passed manually |
| Real-time | socket.io-client | Chat + audio/video signaling + `newNotification` |
| Local notifications | expo-notifications | Session reminders on device |
| Audio/video | **expo-pandit-chime** | Custom native module → Amazon Chime Android SDK |
| Payments | react-native-razorpay | Dev client required |
| Storage | expo-secure-store | Web: sessionStorage fallback |
| Language | TypeScript 5.9 | Alias `@/*` |

**Dev client required** for Razorpay and audio (`npx expo run:android`). Not compatible with Expo Go for these features.

---

## 3. Repository Layout

```
apps/mobile/
├── app/
│   ├── (tabs)/                 # Home, Experts, Tools, Guidance, Profile
│   ├── session/chat.tsx        # Live text chat
│   ├── session/audio.tsx       # Live audio call
│   ├── session/video.tsx       # Live video (PiP, waiting-room)
│   ├── articles/               # Blog list + detail
│   ├── notifications/          # Notification inbox
│   ├── settings/               # Prefs, webview, delete account
│   ├── booking/, bookings/, guidance/, tools/, wallet/
│   └── experts/[id].tsx
├── modules/expo-pandit-chime/  # Native Amazon Chime (Android)
│   ├── android/.../ExpoPanditChimeModule.kt
│   └── src/index.ts
├── lib/
│   ├── chimeAudio.ts           # JS wrapper for native audio
│   ├── chimeVideo.ts           # JS wrapper (waiting-room + enableSessionMedia)
│   ├── chatSocket.ts           # Socket.IO (chat + audio/video + notifications)
│   ├── articlesApi.ts, notificationApi.ts, notificationPreferences.ts
│   ├── localNotificationScheduler.ts
│   ├── authApi.ts, bookingApi.ts, walletApi.ts, toolsApi.ts
│   └── callBookingStatus.ts    # Routes active audio bookings
├── store/
├── constants/Colors.ts
└── app.json                    # Android permissions incl. RECORD_AUDIO
```

---

## 4. Navigation

**5 tabs:** Home | Experts | Tools | Guidance | Profile

**Key stack routes:** `login`, `verify-otp`, `profile-setup`, `guidance/flow`, `booking/*`, `bookings/*`, `wallet/*`, `tools/*`, **`articles/*`**, **`notifications/*`**, **`settings/*`**, `session/chat`, **`session/audio`**, **`session/video`**, `experts/[id]`

On launch: hydrates auth from secure storage. **No forced login redirect** (known gap).

---

## 5. Authentication & Profile

```
login (+91) → request-otp → verify-otp → JWT in secure store
  → hasProfile? home : profile-setup → PATCH profile → home
```

- Session key: `pandittalk.authSession`
- Test OTP: **`1234`** always works in dev
- API base: `EXPO_PUBLIC_API_BASE`, dev debugger host, emulator localhost, or `https://api.pandittalk.com` in production

---

## 6. Booking & Session Formats

### Pricing (`lib/bookingPricing.ts`)

| Depth | Coins | Duration |
|-------|-------|----------|
| entry | 151 | 15 min |
| standard | 301 | 25 min |
| deep | 501 | 45 min |

| Format | Surcharge |
|--------|-----------|
| video | +150 |
| audio | +0 |
| chat | −50 |

### Flows

- **Guidance wizard:** 5 steps → slot picker → `POST /bookings` → confirmation
- **Expert detail:** Book Session sheet or Chat Now (101 coins, 15 min chat only)
- **Audio booking:** Confirmation → `/session/audio?bookingId=`
- **Video booking:** Confirmation → `/session/video?bookingId=`
- **Session history:** Rejoin via `callBookingStatus.ts` (audio or video)

---

## 7. Live Text Chat

**Screen:** `app/session/chat.tsx`  
**Client:** `lib/chatSocket.ts` → `{API_BASE}/chat`

- `joinSession` → messages, typing, timer, waiting-for-pandit
- Entry: Chat Now, booking confirmation (chat format)
- Messages are **not** stored on device; server persists to DynamoDB

---

## 8. Live Audio Calls

### Architecture

```
Mobile                          Backend                    Dashboard
  │                               │                            │
  ├─ POST /sessions/audio/create ─► ChimeService (AWS)         │
  ├─ native startMeeting ─────────► AWS Chime Meeting ◄────────├─ POST /sessions/audio/join
  │   (RTP audio)                 │                            ├─ chime-sdk-js startSession
  └─ joinAudioSession (WS) ───────► ChatGateway (timer only) ◄──┘
```

**Media** = AWS Chime (peer-to-peer through Chime infrastructure).  
**Signaling** = Socket.IO (`joinAudioSession`, `audioSessionStarted`, `timeRemaining`, etc.).

### Implementation

| Layer | File | Role |
|-------|------|------|
| Screen | `app/session/audio.tsx` | UI: timer, mute, speaker, remote volume status |
| JS wrapper | `lib/chimeAudio.ts` | Permissions, start/stop, remote volume handler |
| Native module | `modules/expo-pandit-chime/` | Chime Android SDK, speaker routing, volume events |
| Socket | `lib/chatSocket.ts` | `joinAudioSession`, `endAudioSession` |

### Startup flow

1. `POST /sessions/audio/create` with `{ bookingId }`
2. Request `RECORD_AUDIO` at runtime (**only** this permission)
3. `chimeAudio.startSession(meeting, attendee)`
4. `chatSocket.joinAudioSession(...)` for timer + lifecycle
5. On leave: `endAudioSession` + `DELETE /sessions/audio/:bookingId`

### Native module details

- **SDK:** `amazon-chime-sdk:0.25.3`, `amazon-chime-sdk-media-no-video-codecs:0.25.2`
- **Config:** `AudioVideoConfiguration(Mono16K, VoiceCall)`
- **Speaker:** `chooseAudioDevice` (builtin speaker vs handset) with 300ms/1s retries after start
- **Events:** `onRemoteVolumeChanged` → "Receiving pandit audio" UI
- **Removed:** `react-native-incall-manager` (conflicted with Chime routing)

### Android permissions (critical)

| Permission | How |
|------------|-----|
| `RECORD_AUDIO` | Runtime via `PermissionsAndroid.request()` |
| `MODIFY_AUDIO_SETTINGS` | Manifest only in `app.json` — **never** pass to `requestMultiple()` |

Runtime-requesting `MODIFY_AUDIO_SETTINGS` crashes with `IllegalArgumentException: permission cannot be null or empty` because `PermissionsAndroid.PERMISSIONS.MODIFY_AUDIO_SETTINGS` is `undefined` on React Native.

### Build

```bash
cd apps/mobile
npx expo run:android   # Required after native module changes
```

---

## 8b. Live Video Calls

Same architecture as audio; media via Chime, signaling via Socket.IO.

| Layer | File | Role |
|-------|------|------|
| Screen | `app/session/video.tsx` | PiP UI, draggable corner, flip camera, mute |
| JS wrapper | `lib/chimeVideo.ts` | `startVideoMeeting`, `VideoSurface`, tile events |
| Native | `expo-pandit-chime` | `startVideoMeeting`, `ExpoPanditChimeVideoView` |
| Socket | `lib/chatSocket.ts` | `joinVideoSession`, `endVideoSession` |

**Permissions:** `RECORD_AUDIO` + `CAMERA` (runtime). `POST /sessions/video/create` then socket join.

**Waiting-room:** `enterWaitingRoomMode()` on connect (mic muted, no remote A/V); `enableSessionMedia()` when `videoSessionStarted` fires.

---

## 8c. Notifications

- `NotificationProvider` at root — socket `newNotification`, `SessionReminderBanner`
- `notifications/index` — inbox with mark-read
- `expo-notifications` — local session reminders (`localNotificationScheduler.ts`)
- Settings toggles per notification type (`notificationPreferences.ts`)

---

## 8d. Articles & Settings

- **Articles:** `articles/index`, `articles/[slug]`; home search + blog feed
- **Settings:** notification prefs, privacy/terms webview, delete account (`DELETE /users/profile`), logout

---

## 9. Wallet & Razorpay

- `wallet/index` → `GET /wallet`
- `wallet/recharge` → Razorpay native checkout → `POST /wallet/verify-payment`
- Requires dev client + `EXPO_PUBLIC_RAZORPAY_KEY_ID`

---

## 10. Astrology Tools

12 screens under `app/tools/`. Free: kundli, horoscope, compatibility, palm, tarot. Paid: detailed kundli (251 coins), monthly horoscope (101 coins). API: `lib/toolsApi.ts`.

---

## 11. Design System

**Colors** (`constants/Colors.ts`): GOLD `#F5A623`, DEEP_GREY, BG `#F4F4F4`, AVAILABLE_GREEN, BUSY_AMBER.

**Assets:** `assets/images/Homepageicons/`, `Expertpageicons/`.

---

## 12. Known Gaps

1. Auth hardening — route guards, `hasProfile` sync, 401 interceptor
2. Wallet balance refresh after booking
3. Cancel/complete booking UI
4. Home astrology tiles not linked to tool routes
5. Remove legacy `app/expert/[id].tsx` mock route
6. iOS Chime native module — Android only today
7. Remote push (FCM/APNs) — local notifications only

---

## 13. How to Run

```bash
cd apps/mobile
npm install
cp .env.example .env
npx expo start

# Razorpay + audio (dev client):
npx expo run:android
npx expo start --dev-client
```

Backend on port **3001**. Physical device: `EXPO_PUBLIC_API_BASE=http://<LAN-IP>:3001` or ngrok.

**Android build fix** (after folder move): delete `android/build`, `android/.gradle`, `android/app/build`, then `npx expo run:android`.

---

## 14. Key Files

| Concern | Path |
|---------|------|
| Root navigation | `app/_layout.tsx` |
| Live audio screen | `app/session/audio.tsx` |
| Live video screen | `app/session/video.tsx` |
| Chime audio wrapper | `lib/chimeAudio.ts` |
| Chime video wrapper | `lib/chimeVideo.ts` |
| Native Chime module | `modules/expo-pandit-chime/` |
| Chat + audio socket | `lib/chatSocket.ts` |
| Live chat screen | `app/session/chat.tsx` |
| Articles | `app/articles/`, `lib/articlesApi.ts` |
| Notifications | `app/notifications/`, `components/NotificationProvider.tsx` |
| Settings | `app/settings/` |
| Booking / Chat Now | `lib/bookingApi.ts` |
| Auth | `lib/authApi.ts`, `store/useAuthStore.ts` |
| Guidance wizard | `app/guidance/flow.tsx` |
| Wallet | `lib/walletApi.ts`, `lib/razorpayCheckout.ts` |

---

## 15. Appendix: Original Vision

**Product:** AstroTalk-style competitor for India. Coin wallet, fixed-duration sessions, pandit dashboard, astrology tools with paid upgrades.

**Figma:** ~41 screens designed; most core flows built. **Audio + video, notifications, settings, and blog built.**

**Planned microservices (future):** user-service (monolith today), pandit-service scaffold, booking-service, chat-video-service, payment-service, notification-service.

**Planned AWS production:** ECS Fargate, RDS, ElastiCache, DynamoDB, S3, API Gateway, Cognito, **Amazon Chime** (audio + video live), CloudFront, SNS, SQS, etc.

**App store:** EAS Build, privacy policy URLs, real SMS OTP before submission.

---

*For backend API details see `apps/BACKEND_PROGRESS_SUMMARY.md`. For pandit dashboard see `apps/DASHBOARD_STATUS_SUMMARY.md`.*
