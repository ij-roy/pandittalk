# PanditTalk — Frontend Status Summary (Mobile)

> **CURRENT STATE:** For work after Jun 26 (premium/light UI system in `components/ui/` + `constants/`, saved reports, `kundli-detailed`/`monthly-horoscope`/detailed-compatibility screens, avatar picker + searchable city pickers, `hooks/useUserProfile.ts`, `scripts/run-android.cjs`) see **`apps/MASTER_SUMMARY.md` §0**. New warm-gold palette supersedes §12 colors. This doc is the v1.0.0 baseline (duplicate of `apps/FRONTEND_STATUS_SUMMARY.md`).  
> **Purpose:** Handoff for planning agents and collaborators. Describes the **React Native / Expo** consumer app as of **June 26, 2026 (VERSION 1.0.0)**. Pair with `apps/BACKEND_PROGRESS_SUMMARY.md` and `apps/DASHBOARD_STATUS_SUMMARY.md`.  
> **Monorepo path:** `apps/mobile/`  
> **Repository:** [PanditTalk-Monorepo](https://github.com/pandittalk/PanditTalk-Monorepo)

---

## 1. Product overview

**PanditTalk** is a mobile-first astrology / spiritual guidance app (India market). Users authenticate with phone OTP, complete an astrological profile, browse experts (pandits), book paid guidance sessions, recharge coins via Razorpay, use astrology tools, and join **live text chat** and **live audio calls** with pandits.

**Current maturity:** Auth, profile, home, experts, guidance flow, booking, wallet, tools, session history/reviews, Chat Now, **live chat**, **live audio**, **live video** (native WebRTC custom dev client), **articles/blog**, **in-app + local notifications**, **settings**. No global auth guard on tabs. App version **1.0.0**.

---

## 2. Tech stack

| Layer | Choice | Notes |
|--------|--------|--------|
| Framework | **Expo SDK ~54** | `newArchEnabled: true` |
| UI | **React Native 0.81.5** + **React 19.1** | |
| Routing | **Expo Router ~6** | File-based `app/` |
| State | **Zustand 5** | `useAuthStore`, `useGuidanceFlowStore` |
| HTTP | **Axios 1.16** | Bearer passed manually |
| Real-time | **socket.io-client** | `lib/chatSocket.ts` |
| Local notifications | **expo-notifications** | Session reminders via `localNotificationScheduler.ts` |
| Audio/video calls | **react-native-webrtc** | Native WebRTC through the Expo config plugin; custom dev client required |
| Secure storage | **expo-secure-store** | Web: sessionStorage fallback |
| Payments | **react-native-razorpay ^3** | Requires dev client, not Expo Go |
| Images | **expo-image** | |
| Animations | **react-native-reanimated 4** | |
| Language | **TypeScript 5.9** | Alias `@/*` |

**Platforms:** iOS, Android, web. Deep link scheme: `pandittalk`.

---

## 3. Repository layout

```
apps/mobile/
├── app/
│   ├── _layout.tsx
│   ├── (tabs)/              # Home, Experts, Tools, Guidance, Profile
│   ├── login.tsx, verify-otp.tsx, profile-setup.tsx
│   ├── guidance/flow.tsx    # 5-step wizard
│   ├── booking/select-slot.tsx, confirmation.tsx
│   ├── bookings/history.tsx, review.tsx
│   ├── session/chat.tsx     # Live chat screen
│   ├── session/audio.tsx    # Live audio (native WebRTC)
│   ├── session/video.tsx    # Live video (PiP, waiting-room mode)
│   ├── articles/            # Blog list + detail
│   ├── notifications/index.tsx
│   ├── settings/            # Prefs, webview, delete account
│   ├── wallet/index.tsx, recharge.tsx
│   ├── tools/*              # 12 tool screens
│   ├── experts/[id].tsx     # API expert detail + Chat Now
│   └── expert/[id].tsx      # Legacy mock — remove
├── modules/
├── lib/
│   ├── authApi.ts, authSecureStorage.ts
│   ├── webrtcAudio.ts       # Native WebRTC audio adapter
│   ├── webrtcVideo.ts       # Native WebRTC video adapter (waiting-room API)
│   ├── articlesApi.ts
│   ├── notificationApi.ts, notificationPreferences.ts, localNotificationScheduler.ts
│   ├── expertsApi.ts, bookingApi.ts, bookingPricing.ts
│   ├── walletApi.ts, walletBalance.ts, razorpayCheckout.ts
│   ├── toolsApi.ts, birthDateTime.ts
│   └── chatSocket.ts
├── store/useAuthStore.ts, useGuidanceFlowStore.ts
├── components/
├── constants/Colors.ts
└── FRONTEND_STATUS_SUMMARY.md
```

---

## 4. Navigation architecture

### Root stack (`app/_layout.tsx`)

| Route | Screen | Status |
|-------|--------|--------|
| `(tabs)` | Tab shell | ✅ |
| `login`, `verify-otp`, `profile-setup` | Auth | ✅ |
| `guidance` | 5-step flow | ✅ |
| `experts/[id]` | Expert detail + booking | ✅ |
| `booking/select-slot`, `confirmation` | Scheduled booking | ✅ |
| `bookings/history`, `review` | Sessions | ✅ |
| `session/chat` | **Live chat** | ✅ (file-based route; not in explicit Stack.Screen list) |
| `session/audio` | **Live audio** | ✅ Native WebRTC via the custom dev client |
| `session/video` | **Live video** | ✅ Native WebRTC video + PiP, camera flip/mute |
| `wallet/index`, `recharge` | Coin wallet | ✅ |
| `articles/*` | Blog hub + detail | ✅ API-backed |
| `notifications/index` | Notification inbox | ✅ |
| `settings/*` | App settings | ✅ Prefs, privacy/terms, delete account |
| `tools/*` | Astrology tools | ✅ |
| `expert/[id]` | Legacy mock | ⚠️ Remove |

On launch: hydrates auth from secure storage. **No forced login redirect.**

### Tabs (`app/(tabs)/_layout.tsx`)

| Tab | Route | Status |
|-----|-------|--------|
| Home | `index` | ✅ |
| Experts | `experts` | ✅ + Chat Now buttons |
| Tools | `tools` | ✅ |
| Guidance | `guidance` → `flow.tsx` | ✅ |
| Profile | `profile-setup` re-export | ✅ |

**Side menu:** My Sessions → history; Logout → login.

---

## 5. Authentication & profile

### Flow

```
login (+91) → request-otp → verify-otp → JWT in secure store
  → hasProfile? home : profile-setup → PATCH profile → home
```

- Key: `pandittalk.authSession` → `{ accessToken, hasProfile }`
- Test OTP: **`1234`** always works
- **Gap:** `hasProfile` not updated in secure storage after profile PATCH

### API (`lib/authApi.ts`)

| Method | Endpoint |
|--------|----------|
| POST | `/auth/request-otp` |
| POST | `/auth/verify-otp` |
| GET/PATCH | `/users/profile` |

### API base (`getApiBase()`)

1. `EXPO_PUBLIC_API_BASE` env
2. Else in dev: Expo debugger host (physical device)
3. Else Android emulator: `http://10.0.2.2:3001`
4. Else iOS simulator / web dev: `http://localhost:3001`
5. Else production: the stable PanditTalk Worker (`https://pandittalk-load-balancer.admininfo-6d6.workers.dev`)

Ngrok requests add `ngrok-skip-browser-warning: true`.

---

## 6. Session booking

### Pricing (`lib/bookingPricing.ts`)

- **Areas:** career, love, family, marriage, education, health, business, finance
- **Depths:** Entry 151/15min, Standard 301/25min, Deep 501/45min
- **Formats:** Audio +0, Video +150, Chat −50

### Booking API (`lib/bookingApi.ts`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/experts/:id/all-slots` | Slot picker |
| POST | `/bookings` | Scheduled booking |
| POST | `/bookings/chat-now` | Instant chat (101 coins) |
| POST/DELETE/GET | `/bookings/chat-now/queue` | Busy pandit queue |
| GET | `/bookings/pandit/:id/status` | Online/busy check |
| GET/PATCH/POST | `/bookings/*` | List, detail, status, review |

### Flows

**A — Guidance wizard (primary):**  
`/guidance` → 5 steps → balance check → `/booking/select-slot` → POST → confirmation → history

**B — Expert detail sheet:**  
`experts/[id]` → Book Session → select-slot → confirmation

**C — Chat Now (instant):**  
Experts list or detail → Chat Now → `POST /bookings/chat-now` (or queue if busy) → `/session/chat`

### Gaps
- No balance refresh after `POST /bookings`
- No balance re-check on select-slot (guidance pre-checks only)
- `updateBookingStatus` unused in UI (no cancel/complete)
- Chat/Call footer stubs on expert detail (Chat Now works separately)

---

## 7. Live chat (`app/session/chat.tsx`)

**Client:** `lib/chatSocket.ts` — connects to `{API_BASE}/chat` with `auth: { token }`.

**Features:**
- Join session via `joinSession` emit
- Message list with user/pandit bubbles
- Session timer (`timeRemaining`, 5-min warning)
- Typing indicators
- Waiting for pandit state
- Pandit disconnect banner (60s grace)
- Session end / refund handling (`sessionRefunded`, `sessionEndedWithRefund`)
- End session from user side

**Entry points:**
- `booking/confirmation.tsx` — "Join Chat" for chat-format bookings
- `experts/[id].tsx` — after Chat Now success

**WebSocket events handled:** `sessionJoined`, `sessionStarted`, `waitingForPandit`, `newMessage`, `typingIndicator`, `timeRemaining`, `warningFiveMinutes`, `sessionTimeUp`, `sessionEnded`, `sessionRefunded`, `sessionEndedWithRefund`, `panditBusy`, `queuePositionUpdated`, `queueReady`, `queueExpired`.

---

## 7b. Live audio (`app/session/audio.tsx`)

> **Current implementation note:** The historical paid-meeting-SDK details below are superseded. The active implementation uses `lib/webrtcAudio.ts`, `lib/webrtcVideo.ts`, Socket.IO signaling, free STUN by default, and optional coturn.

**Requires dev client:** `npx expo run:android` (not Expo Go). `react-native-webrtc` is a native module and is not available in Expo Go.

**Client:** `lib/webrtcAudio.ts` wraps native WebRTC; `lib/chatSocket.ts` handles `joinAudioSession` / `endAudioSession`.

**Flow:**
1. `POST /sessions/audio/create` with `{ bookingId }` → `{ meeting, attendee }`
2. Request runtime `RECORD_AUDIO` permission only
3. `webrtcAudio.startSession(config)` → native WebRTC peer connection
4. `setSpeakerOn(true)`; subscribe to `onRemoteVolumeChanged` for pandit audio UI
5. `chatSocket.joinAudioSession` → waiting states → `audioSessionStarted` → server `timeRemaining`
6. On leave: `endAudioSession` + `DELETE /sessions/audio/:bookingId` + `stopMeeting`

**UI features:** Mute toggle, speaker toggle, session timer, "Receiving pandit audio" / "Waiting for pandit audio…", waiting-for-pandit / countdown-to-start banners.

**Android permissions (`app.json`):**
- `RECORD_AUDIO` — requested at runtime via `PermissionsAndroid.request()`
- `MODIFY_AUDIO_SETTINGS` — **manifest only**; do NOT pass to `requestMultiple()` (causes crash: `permission cannot be null or empty`)

**Native media:** `react-native-webrtc:124.0.6` with `@config-plugins/react-native-webrtc:13.0.0`.

**Entry points:**
- `booking/confirmation.tsx` — "Join Audio Call" for `format: 'audio'`
- `bookings/history.tsx` — rejoin audio bookings
- `lib/callBookingStatus.ts` — routes active audio bookings to `/session/audio`

**Removed:** the paid meeting SDK and its native bridge; device routing is handled by WebRTC.

**Audio WebSocket events:** `audioWaitingForOther`, `audioWaitingForStart`, `audioSessionStarted`, `timeRemaining`, `warningFiveMinutes`, `audioSessionTimeUp`, `audioSessionEnded`.

---

## 7c. Live video (`app/session/video.tsx`)

**Client:** `lib/webrtcVideo.ts` + `lib/chatSocket.ts` (`joinVideoSession` / `endVideoSession`).

**Flow:** `POST /sessions/video/create` → `RECORD_AUDIO` + `CAMERA` permissions → `startVideoSession` → `joinVideoSession` → on `videoSessionStarted` call `enableSessionMedia()` (exits waiting-room). Native: `VideoSurface`, flip camera, mute, speaker, draggable PiP.

**Waiting-room mode:** After WebRTC setup, `enterWaitingRoomMode()` keeps mic muted and remote A/V off until session officially starts — user sees local camera preview only.

**Entry:** `booking/confirmation` ("Join Video Call"), `bookings/history`, `callBookingStatus.ts` → `/session/video`.

**Video WebSocket events:** `videoWaitingForOther`, `videoWaitingForStart`, `videoSessionStarted`, `timeRemaining`, `warningFiveMinutes`, `videoSessionTimeUp`, `videoSessionEnded`.

---

## 7d. Notifications (`app/notifications/index.tsx`)

**Provider:** `components/NotificationProvider.tsx` wraps root layout — listens `newNotification` on socket, shows `SessionReminderBanner`, schedules `expo-notifications` local reminders via `localNotificationScheduler.ts`.

**API:** `lib/notificationApi.ts` — `GET /notifications`, unread count, mark read.

**Prefs:** `lib/notificationPreferences.ts` — per-type toggles in settings (stored locally).

**Types:** booking confirmed, session reminders (30/10/5 min), session started/ended, new message, chat now accepted/missed.

---

## 7e. Articles (`app/articles/`)

**Screens:** `articles/index` (list + category filter + search), `articles/[slug]` (detail).

**API:** `lib/articlesApi.ts` — `GET /articles`, `GET /articles/:slug`.

**Home integration:** `(tabs)/index` shows article search, "From the Blogs" feed, links to `/articles`.

---

## 7f. Settings (`app/settings/`)

- Notification preference toggles per type
- Privacy policy / Terms of service → `settings/webview` (placeholder URLs)
- Delete account → `DELETE /users/profile`
- Logout

---

## 8. Wallet & Razorpay

| Screen | API |
|--------|-----|
| `wallet/index` | `GET /wallet` |
| `wallet/recharge` | `POST /wallet/create-order` → Razorpay → `POST /wallet/verify-payment` |

- Requires `npx expo run:android` / `run:ios` + `--dev-client`
- `EXPO_PUBLIC_RAZORPAY_KEY_ID` in `.env`
- Header wallet chip refreshes from profile on focus

---

## 9. Astrology tools

### API (`lib/toolsApi.ts`)

| Tool | Route | Cost |
|------|-------|------|
| Free Kundli | `POST /tools/kundli` | Free |
| Detailed Kundli | `POST /tools/kundli` + `detailed: true` | 251 coins |
| Daily Horoscope | `POST /tools/horoscope` | Free |
| Compatibility | `POST /tools/compatibility` | Free |
| Palm Reading | `POST /tools/palm-reading` | Free (base64 images) |
| Tarot | `POST /tools/tarot` | Free |
| Monthly Horoscope | `POST /tools/monthly-horoscope` + unlock | 101 coins |

### Screens (`app/tools/`)

`kundli`, `kundli-result`, `kundli-detailed`, `kundli-detailed-result`, `horoscope`, `horoscope-result`, `compatibility`, `compatibility-result`, `palm-reading`, `tarot`, `monthly-horoscope`

### Gaps
- Home astrology tiles not linked (Tools tab works)
- Daily horoscope → monthly link shows "Coming Soon" alert
- No detailed compatibility UI
- Palm/Tarot pandit upsell stubs
- Tool results via route params only — no history

---

## 10. Experts feature

### List (`app/(tabs)/experts.tsx`)
- Category filter + sort (experience, rating, reviews)
- Expert cards with online dot, verified badge
- **Chat Now** button per card (online pandits)
- Start Guidance → `/guidance?expertId=`

### Detail (`app/experts/[id].tsx`)
- API-backed bio, stats, reviews
- Book Session sheet (area → depth → format → slots)
- **Chat Now** with optional notes modal
- Chat/Call footer stubs (legacy UI)

### Legacy (`app/expert/[id].tsx`)
- Mock data — consider deleting

---

## 11. Home tab (`app/(tabs)/index.tsx`)

- TabTopHeader with wallet chip + notification bell
- Start Guidance banner → `/guidance`
- 8 area tiles → `/guidance?area=`
- **Article search** (debounced) + inline results panel
- **"From the Blogs"** section — API articles, View all → `/articles`
- Astrology tool tiles — **visual only, no navigation**
- GuidanceHubContent (curated guidance cards)

---

## 12. Design system

**Colors** (`constants/Colors.ts`): GOLD `#F5A623`, DEEP_GREY, BG `#F4F4F4`, AVAILABLE_GREEN, BUSY_AMBER.

**Assets:** `assets/images/Homepageicons/`, `Expertpageicons/`.

---

## 13. Screen completion matrix

| Area | UI | API | Notes |
|------|----|-----|-------|
| Login / OTP | ✅ | ✅ | India 10-digit |
| Profile setup | ✅ | ✅ | Avatar local only |
| Home | ✅ | 🟡 | Article feed + search; tool tiles not linked |
| Articles / blog | ✅ | ✅ | |
| Notifications | ✅ | ✅ | In-app + local reminders |
| Settings | ✅ | ✅ | Delete account wired |
| Experts list | ✅ | ✅ | Chat Now + filters |
| Expert detail | ✅ | ✅ | Book + Chat Now |
| Guidance flow | ✅ | ✅ | Balance pre-check |
| Select slot / confirm | ✅ | ✅ | IST slots |
| Session history / review | ✅ | ✅ | |
| **Live chat** | ✅ | ✅ | Socket.IO |
| **Live audio** | ✅ | ✅ | Native WebRTC + Socket.IO signaling |
| **Live video** | ✅ | ✅ | Waiting-room + PiP UI |
| **Chat Now** | ✅ | ✅ | Queue when busy |
| Wallet / recharge | ✅ | ✅ | Dev client required |
| Tools (free + paid) | ✅ | ✅ | |
| Auth guard | ❌ | — | |
| Cancel booking UI | ❌ | 🟡 API exists | |
| Remote push (FCM) | ❌ | — | Local only today |
| Home → tool links | ❌ | — | |

Legend: ✅ done · 🟡 partial · ❌ not started

---

## 14. Known gaps & suggested priorities

1. **Auth hardening** — Route guards, sync `hasProfile` to SecureStore, axios 401 interceptor, display user name in header
2. **Booking payments** — Refresh balance after `POST /bookings`; re-check on select-slot
3. **Booking lifecycle** — Cancel/complete UI; session reminders
4. **Tools polish** — Home tile deep links; monthly horoscope link; result history
5. **Cleanup** — Remove `app/expert/[id].tsx` mock route
6. **Production config** — Env-based API URLs (replace hardcoded ngrok)
7. **iOS video** — Native WebRTC device proof remains to be run on a physical device
8. **Remote push** — Firebase FCM/APNs not integrated (local notifications only)

---

## 15. How to run

```bash
cd apps/mobile
npm install
cp .env.example .env
npx expo start
# Razorpay + native WebRTC require a custom dev client:
npx expo run:android   # or run:ios
npx expo start --dev-client
```

Backend must run on port **3001**. Physical device: set `EXPO_PUBLIC_API_BASE` to LAN IP or ngrok URL.

### Android build fix (after monorepo move)

If Gradle shows "No variants exist":
```powershell
Remove-Item -Recurse -Force android\build, android\.gradle, android\app\build -ErrorAction SilentlyContinue
npx expo run:android
```

---

## 16. Key files quick reference

| Concern | Path |
|---------|------|
| Root navigation | `app/_layout.tsx` |
| Live chat screen | `app/session/chat.tsx` |
| Live audio screen | `app/session/audio.tsx` |
| Live video screen | `app/session/video.tsx` |
| WebRTC audio wrapper | `lib/webrtcAudio.ts` |
| WebRTC video wrapper | `lib/webrtcVideo.ts` |
| Native WebRTC package | `react-native-webrtc` |
| Chat socket client | `lib/chatSocket.ts` |
| Booking API + Chat Now | `lib/bookingApi.ts` |
| Auth | `lib/authApi.ts`, `store/useAuthStore.ts` |
| Guidance wizard | `app/guidance/flow.tsx`, `store/useGuidanceFlowStore.ts` |
| Expert detail | `app/experts/[id].tsx` |
| Wallet | `app/wallet/`, `lib/walletApi.ts`, `lib/razorpayCheckout.ts` |
| Tools | `app/tools/`, `lib/toolsApi.ts` |
| Articles | `app/articles/`, `lib/articlesApi.ts` |
| Notifications | `app/notifications/`, `components/NotificationProvider.tsx` |
| Settings | `app/settings/`, `lib/notificationPreferences.ts` |
| Colors | `constants/Colors.ts` |

---

*Updated June 26, 2026 (VERSION 1.0.0). See `apps/MASTER_SUMMARY.md` for full monorepo context.*
