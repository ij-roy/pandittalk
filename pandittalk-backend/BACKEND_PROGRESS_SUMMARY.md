# PanditTalk Backend — Progress Summary

> **CURRENT STATE:** For work after Jun 26 (reports/`SavedReport`, `Pandit.guidanceAreas`, avatar uploads, coin-gated tool guards, `config/cors-origins.ts`, Dockerfile, ~15 migrations) see **`apps/MASTER_SUMMARY.md` §0**. This doc is the v1.0.0 baseline (duplicate of `apps/BACKEND_PROGRESS_SUMMARY.md`).  
> **Purpose:** Handoff for planning agents (frontend, dashboard, DevOps). Describes what exists today, what is stubbed, and what is not built yet.  
> **Last updated:** June 26, 2026 (VERSION 1.0.0; delta in MASTER §0 dated Jul 2)  
> **Monorepo path:** `apps/backend/`  
> **Repository:** [PanditTalk-Monorepo](https://github.com/pandittalk/PanditTalk-Monorepo)

---

## 1. Product context

**PanditTalk** is a mobile + web platform backend connecting users with pandits (spiritual/astrology experts). The backend is a **NestJS monorepo** designed for growth into real-time chat, caching, and async messaging.

**Current maturity:** **user-service** (port 3001) — users, pandits, bookings, wallet/Razorpay, astrology tools, live text chat (Socket.IO + DynamoDB), **live audio + video** (WebRTC media + Socket.IO/Redis signaling), Chat Now, Redis pandit queues, **articles/blog**, **in-app notifications**, account soft-delete. **pandit-service** (3002) = health scaffold only.

> **Local-first media note:** The old paid-meeting design notes later in this historical handoff are superseded. The active runtime returns provider-neutral WebRTC session configuration, uses free STUN by default, and supports optional coturn when a relay is needed.

---

## 2. Tech stack

| Layer | Technology | Version (approx.) |
|-------|------------|-------------------|
| Runtime | Node.js | 24 (`.nvmrc`) |
| Framework | NestJS | ^11.0.1 |
| Language | TypeScript | ^5.7.3 |
| ORM | Prisma | ^6.19.3 |
| Database | PostgreSQL | Supabase managed in production; 16 (Docker) locally |
| Auth | JWT + Passport | `@nestjs/jwt` ^11 |
| Real-time | Socket.IO | `@nestjs/platform-socket.io` — namespace `/chat` |
| Cache / Queue | Redis 7 | `cache-manager-redis-yet` — **wired** (queue + cache) |
| Chat storage | MongoDB | `mongodb` driver — MongoDB Atlas managed in production; MongoDB 7 locally |
| Audio/video media | WebRTC | Browser/native peer connection; Socket.IO/Redis signaling |
| Payments | Razorpay Node SDK | ^2.9.6 |
| Astrology | Prokerala REST API | OAuth2 client credentials |
| AI | OpenAI GPT-4o | `openai` ^6.42.0 |
| Message broker | RabbitMQ 3.13 | Docker only — **not wired in code** |
| Testing | Jest + Supertest | ^30 |
| Local infra | Docker Compose | Postgres, Redis, MongoDB, RabbitMQ |

**Monorepo tooling:** Nest CLI (`nest-cli.json`), path alias `@pandittalk/common` → `libs/common/src`.

---

## 3. Repository structure

```
apps/backend/
├── apps/
│   ├── user-service/          # Primary API — port 3001
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/    # 11 migrations
│   │   └── src/
│   │       ├── articles/        # Blog + optional Blogger sync
│   │       ├── auth/
│   │       ├── bookings/        # + chat-now, pandit queue, pandit endpoints
│   │       ├── chat/            # WebSocket gateway + DynamoDB + notification emit
│   │       ├── webrtc/          # Provider-neutral audio/video session config
│   │       ├── experts/         # + GET /experts/me, ?search, ?area
│   │       ├── notifications/   # In-app notification CRUD
│   │       ├── tools/
│   │       ├── wallet/
│   │       └── user-service.module.ts
│   └── pandit-service/        # Scaffold — port 3002
├── libs/common/
├── docker-compose.yml
├── .env.example
├── ngrok.exe
└── BACKEND_PROGRESS_SUMMARY.md
```

---

## 4. Infrastructure (`docker-compose.yml`)

| Service | Image | Ports | Used in code? |
|---------|-------|-------|---------------|
| **postgres** | postgres:16-alpine | 5432 | ✅ Prisma |
| **redis** | redis:7-alpine | 6379 | ✅ Cache + pandit queue |
| **dynamodb** | amazon/dynamodb-local | 8000 | ✅ Chat messages |
| **rabbitmq** | rabbitmq:3.13-management | 5672, 15672 | ❌ Not wired |

Credentials: Postgres/RabbitMQ user/pass/db = `pandittalk`.

---

## 5. Environment configuration

Copy `.env.example` → `.env` at `apps/backend/`.

| Variable | Default | Used by |
|----------|---------|---------|
| `USER_SERVICE_PORT` | `3001` | user-service |
| `DATABASE_URL` | `postgresql://pandittalk:pandittalk@localhost:5432/pandittalk` | Prisma |
| `REDIS_HOST`, `REDIS_PORT` | localhost / 6379 | Cache + queue |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` | local / ap-south-1 | DynamoDB |
| `WEBRTC_STUN_URLS` | `stun:stun.l.google.com:19302,...` | Default ICE discovery for browser/native WebRTC |
| `WEBRTC_TURN_URL`, `WEBRTC_TURN_USERNAME`, `WEBRTC_TURN_CREDENTIAL` | — | Optional coturn relay credentials |
| `DYNAMODB_ENDPOINT` | `http://localhost:8000` | Local DynamoDB |
| `DYNAMODB_TABLE_CHAT` | `pandittalk-chat-messages` | Chat messages |
| `CHAT_WAITING_TIMEOUT_MS` | `600000` (10 min) | Pandit join timeout before refund |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | — / `7d` | Auth |
| `RAZORPAY_*` | — | Payments |
| `PROKERALA_*`, `OPENAI_API_KEY` | — | Tools |
| `GOOGLE_BLOGGER_*`, `BLOGGER_SYNC_*` | — | Optional article sync |
| `RABBITMQ_*` | — | **Not used** |

`ConfigModule` loads: `apps/<service>/.env.local`, `apps/<service>/.env`, `.env`.

---

## 6. Database (Prisma)

**Schema:** `apps/user-service/prisma/schema.prisma`

### Models

| Model | Purpose |
|-------|---------|
| `User` | Phone auth, profile, `walletBalance`, `zodiacSign`, `isActive` |
| `Pandit` | Expert profiles; optional `userId` for dashboard login |
| `PanditAvailability` | Weekly windows (day 0–6, `windowStart`/`windowEnd`) |
| `Booking` | Sessions: area, depth, format, times, pricing, status, `notes` |
| `Review` | One per booking; updates pandit rating |
| `CoinPackage` | Recharge bundles |
| `Transaction` | Ledger: `purchase`, `booking_debit`, `refund` |
| `Article` | Blog posts: slug, category, content, author, `publishedAt` |
| `Notification` | In-app alerts: type enum, title, body, optional `bookingId` |

### Chat (not in Prisma)

DynamoDB table `pandittalk-chat-messages`: `sessionId`, `timestamp`, `senderId`, `senderRole`, `message`.

### Migrations (11 applied)

Init users → profile → pandit/booking/review → duration → availability refactor → wallet → booking notes → zodiac sign → **articles + notifications + isActive** → **article author**.

### Seed

5 coin packages + 8 pandits (7-day `09:00`–`21:00` IST availability). First 5 `isOnline: true`.

```bash
npx prisma db seed --schema apps/user-service/prisma/schema.prisma
```

---

## 7. user-service (port 3001) — implemented features

### 7.1 Bootstrap

- Raw body parser on `/wallet/webhook` only; `express.json()` elsewhere
- Global `ValidationPipe` (whitelist, transform)
- CORS `origin: true`, `credentials: true`
- WebSocket CORS on `/chat` namespace

### 7.2 Health

`GET /` → `{ status: 'ok', service: 'user-service', timestamp }`

### 7.3 Authentication (`/auth`)

| Method | Path | Behavior |
|--------|------|----------|
| `POST` | `/auth/request-otp` | 4-digit OTP in **Redis** (hashed, 10 min TTL); rate-limited; **console log** or MSG91 when enabled |
| `POST` | `/auth/verify-otp` | Validates Redis OTP (max 5 attempts) or test OTP **`1234`**; returns JWT |

JWT payload: `{ sub: userId, phoneNumber }`. Protected routes use `JwtAuthGuard` + Bearer token.

### 7.4 User profile (`/users/profile`) — JWT

`GET` / `PATCH` — full profile; PATCH sets `profileCompleted: true`; optional `zodiacSign`.  
`DELETE` — soft-delete: sets `isActive: false`, anonymizes `phoneNumber` to `deleted_{userId}`.

### 7.5 Experts (`/experts`)

| Method | Path | Auth | Behavior |
|--------|------|------|----------|
| `GET` | `/experts` | None | List + `available_slots_today`; optional `?search=` and `?area=` (8 area IDs) |
| `GET` | `/experts/me` | JWT | Pandit linked to user (dashboard login) |
| `GET` | `/experts/:id` | None | Detail + reviews |
| `GET` | `/experts/:id/available-slots` | None | `?date=&duration=` → available ISO slots |
| `GET` | `/experts/:id/all-slots` | None | Available + booked |
| `PATCH` | `/experts/:id/presence` | None | `{ isOnline }` — **unauthenticated** |

Slot computation: IST (`Asia/Kolkata`), 15-min steps, 5-min buffer after bookings.

### 7.6 Bookings (`/bookings`) — JWT

| Method | Path | Behavior |
|--------|------|----------|
| `POST` | `/bookings` | Scheduled booking; wallet debit; optional `notes` |
| `POST` | `/bookings/chat-now` | Instant chat: **101 coins**, 15 min |
| `POST` | `/bookings/chat-now/queue` | Join queue when pandit busy |
| `DELETE` | `/bookings/chat-now/queue` | Leave queue |
| `GET` | `/bookings/chat-now/queue` | `?panditId=` queue position |
| `GET` | `/bookings` | User's bookings |
| `GET` | `/bookings/pandit` | Pandit's bookings (by linked `userId`) |
| `GET` | `/bookings/pandit/:panditId/status` | Live status: online/busy/queue length |
| `GET` | `/bookings/:id` | Booking detail |
| `GET` | `/bookings/:id/user-details` | User profile for pandit |
| `PATCH` | `/bookings/:id/status` | `completed` \| `cancelled` (cancel refunds) |
| `POST` | `/bookings/:id/review` | 1–5 stars after `completed` |

**Pricing (coins):**

| Depth | Base | Duration |
|-------|------|----------|
| entry | 151 | 15 min |
| standard | 301 | 25 min |
| deep | 501 | 45 min |

| Format | Surcharge |
|--------|-----------|
| video | +150 |
| audio | +0 |
| chat | −50 |

**Chat Now:** 101 coins, 15 min, format `chat`.

### 7.7 Pandit queue (`PanditQueueService` — Redis)

- Max **5** users per pandit queue
- Max wait **15 minutes** in queue
- **60-second** turn timeout when queue advances
- Emits `queuePositionUpdated`, `queueReady`, `queueExpired` via ChatGateway

### 7.8 Wallet (`/wallet`) — Razorpay

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/wallet` | Balance, last 20 transactions, packages |
| `POST` | `/wallet/create-order` | Razorpay order + `PENDING` transaction |
| `POST` | `/wallet/verify-payment` | HMAC verify; credit coins |
| `POST` | `/wallet/webhook` | Raw body; `payment.captured` backup |

### 7.9 Tools (`/tools`) — Prokerala + OpenAI

| Method | Path | Auth | Cost |
|--------|------|------|------|
| `POST` | `/tools/kundli` | Public / JWT if `detailed: true` | 251 coins detailed |
| `POST` | `/tools/horoscope` | Public | — |
| `POST` | `/tools/compatibility` | Public | — |
| `POST` | `/tools/tarot` | Public | — |
| `POST` | `/tools/palm-reading` | Public | — |
| `POST` | `/tools/monthly-horoscope` | Public | — |
| `POST` | `/tools/unlock` | JWT | 101 / 201 coins |
| `GET` | `/tools/unlocked` | JWT | — |

Supported birth cities: Delhi, Mumbai, Pune, Jaipur, Ludhiana, Chennai, Kolkata, Hyderabad, Bangalore, Ahmedabad.

### 7.10 Live chat (`/chat` WebSocket namespace)

**Module:** `apps/user-service/src/chat/` — `ChatGateway`, `DynamoService`.

**Client → Server:**
- `joinSession` — `{ bookingId }`
- `joinPanditDashboard` — pandit subscribes to booking notifications
- `sendMessage` — `{ bookingId, message }`
- `typing` — `{ bookingId }`
- `endSession` — `{ bookingId }`

**Server → Client:**
- `sessionJoined`, `sessionStarted`, `waitingForPandit`
- `newMessage`, `typingIndicator`
- `timeRemaining`, `warningFiveMinutes`, `sessionTimeUp`
- `sessionEnded`, `sessionRefunded`, `sessionEndedWithRefund`
- `panditBusy`, `queuePositionUpdated`, `queueReady`, `queueExpired`
- `newBookingCreated` (to pandit dashboard room)

**Session lifecycle:**
- JWT validated on connect via `auth.token`
- Pandit must join within `CHAT_WAITING_TIMEOUT_MS` or user refunded
- 1s timer emits `timeRemaining`; 5-min warning before end
- Pandit disconnect: 60s reconnect grace
- Messages persisted to DynamoDB; history returned on `sessionJoined`

### 7.11 Audio sessions — WebRTC (`/sessions/audio`) — JWT

**Module:** `apps/user-service/src/webrtc/` — `WebRtcService` plus the audio session controller.

| Method | Path | Auth | Behavior |
|--------|------|------|----------|
| `POST` | `/sessions/audio/create` | JWT (booking owner) | Return a WebRTC ICE-server config |
| `POST` | `/sessions/audio/join` | JWT (participant) | Return the same provider-neutral config |
| `GET` | `/sessions/audio/:bookingId` | JWT | Return the WebRTC session config |
| `DELETE` | `/sessions/audio/:bookingId` | JWT | Set booking `completed` |

**Guards:** `format === 'audio'`, `status === 'confirmed'`, within session window (15 min before start → end).

**WebRtcService:**
- Returns `provider: "webrtc"`, booking/format, default free STUN URLs, and optional TURN credentials.
- No media vendor credentials are required for the local-first path.
- Media itself is peer-to-peer; Socket.IO carries only signaling messages.

### 7.12 Audio WebSocket (`/chat` namespace)

**Client → Server:**
- `joinAudioSession` — `{ bookingId, token }`
- `endAudioSession` — `{ bookingId, token }`

**Server → Client:**
- `audioWaitingForOther` — `{ bookingId }` — fewer than 2 participants in room
- `audioWaitingForStart` — `{ startsAt }` — before scheduled `booking.startTime`
- `audioSessionStarted` — `{ startedAt, endTime, durationMinutes }`
- `timeRemaining` — `{ secondsLeft }` — **only after session started** (server-authoritative)
- `warningFiveMinutes`
- `audioSessionTimeUp` — `{ bookingId }`
- `audioSessionEnded` — `{ bookingId }`

**Lifecycle:**
- Socket room: `audio:{bookingId}`; participant list in Redis `audio:room:{bookingId}`
- Start/end timestamps: Redis `audio:start:{bookingId}`, `audio:end:{bookingId}`
- 1s interval timer per booking; cleanup on end or time-up
- Both clients obtain the WebRTC config via REST, then use Socket.IO signaling; media does not pass through the API.

### 7.13 Video sessions — WebRTC (`/sessions/video`) — JWT

**Module:** the same WebRTC session controller/service boundary as audio.

| Method | Path | Behavior |
|--------|------|----------|
| `POST` | `/sessions/video/create` | Return a WebRTC ICE-server config (`format: 'video'`) |
| `POST` | `/sessions/video/join` | Return the same provider-neutral config |
| `GET` | `/sessions/video/:bookingId` | Return the WebRTC session config |
| `DELETE` | `/sessions/video/:bookingId` | End the session; booking `completed` |

**WebSocket:** `joinVideoSession` / `endVideoSession` → `videoWaitingForOther`, `videoWaitingForStart`, `videoSessionStarted`, `timeRemaining`, `warningFiveMinutes`, `videoSessionTimeUp`, `videoSessionEnded`. Redis keys: `video:room:`, `video:start:`, `video:end:`.

### 7.14 Articles (`/articles`)

| Method | Path | Auth | Behavior |
|--------|------|------|----------|
| `GET` | `/articles` | None | Paginated list; `?limit`, `?cursor`, `?category`, `?search` |
| `GET` | `/articles/:slug` | None | Full article detail |
| `POST` | `/articles/sync/blogger` | Header secret | Sync posts from Google Blogger API |

**Categories:** astrology, spirituality, vastu, numerology, tarot, palmistry, relationships, career. Seed + optional `BloggerSyncService` on startup.

### 7.15 Notifications (`/notifications`) — JWT

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/notifications` | Last 50 for user |
| `GET` | `/notifications/unread-count` | `{ count }` |
| `PATCH` | `/notifications/read-all` | Mark all read |
| `PATCH` | `/notifications/:id/read` | Mark one read |

**Types:** `booking_confirmed`, `session_reminder_30/10/5`, `session_started`, `session_ended`, `new_message`, `chat_now_accepted`, `chat_now_missed`.

**Created by:** `BookingsService` (booking confirmed), `ChatGateway` (session lifecycle, reminders, new message when recipient not in room).  
**Real-time:** `ChatGateway.emitNewNotification` → Socket.IO `newNotification` to room `user:{userId}`.

---

## 8. pandit-service (port 3002)

**Scaffold only.** `GET /` health check. No business routes. Pandit domain lives in user-service Prisma schema.

---

## 9. Shared library (`@pandittalk/common`)

`HealthResponseDto`, `MicroserviceMessage<T>`, `User` interface, unused TypeORM `PanditEntity` stub.

---

## 10. npm scripts

| Script | Action |
|--------|--------|
| `npm run start:user-service:dev` | API on http://localhost:3001 |
| `npm run start:pandit-service:dev` | Health on http://localhost:3002 |
| `npm run prisma:migrate` | Dev migrations |
| `npm run prisma:studio` | Prisma Studio |
| `npm run reset:tool -- <phone> <toolType>` | Dev: refund tool unlock |

---

## 11. Development workflow

```bash
cd apps/backend
docker compose up -d
cp .env.example .env   # JWT_SECRET, Razorpay, Prokerala, OpenAI, AWS keys
npm install
npm run prisma:migrate
npx prisma db seed --schema apps/user-service/prisma/schema.prisma
npm run start:user-service:dev
```

**Quick test:** `POST /auth/verify-otp` with `{ "phoneNumber": "+919999999999", "otp": "1234", "acceptedLegalConsent": true }`.

**Pandit dashboard login:** User phone must be linked to a seeded pandit's `userId` in DB for `GET /experts/me` to succeed.

---

## 12. API quick reference

Base: `http://localhost:3001`  
WebSocket: `ws://localhost:3001/chat`

```
GET    /
POST   /auth/request-otp
POST   /auth/verify-otp
GET    /users/profile
PATCH  /users/profile
GET    /experts
GET    /experts/me
GET    /experts/:id
GET    /experts/:id/available-slots
GET    /experts/:id/all-slots
PATCH  /experts/:id/presence
POST   /bookings
POST   /bookings/chat-now
POST   /bookings/chat-now/queue
DELETE /bookings/chat-now/queue
GET    /bookings/chat-now/queue
GET    /bookings
GET    /bookings/pandit
GET    /bookings/pandit/:panditId/status
GET    /bookings/:id
GET    /bookings/:id/user-details
PATCH  /bookings/:id/status
POST   /bookings/:id/review
GET    /wallet
POST   /wallet/create-order
POST   /wallet/verify-payment
POST   /wallet/webhook
POST   /tools/*
GET    /tools/unlocked
GET    /articles
GET    /articles/:slug
POST   /articles/sync/blogger
GET    /notifications
GET    /notifications/unread-count
PATCH  /notifications/read-all
PATCH  /notifications/:id/read
DELETE /users/profile
POST   /sessions/audio/create
POST   /sessions/audio/join
GET    /sessions/audio/:bookingId
DELETE /sessions/audio/:bookingId
POST   /sessions/video/create
POST   /sessions/video/join
GET    /sessions/video/:bookingId
DELETE /sessions/video/:bookingId
```

---

## 13. What is NOT built yet

### Infrastructure
- [ ] RabbitMQ producers/consumers
- [ ] API gateway / service discovery
- [ ] CI/CD, production Dockerfiles, observability

### Auth & security
- [x] OTP in Redis with rate limiting (per-phone 3/10 min + 60s cooldown, per-IP 10/hr)
- [x] MSG91 SMS provider (feature-flagged off; `OTP_SMS_PROVIDER=msg91` when DLT approved)
- [ ] Refresh tokens
- [ ] Remove test OTP `1234` in production
- [ ] Protect `PATCH /experts/:id/presence`

### Bookings & sessions
- [x] Live text chat (WebSocket + DynamoDB)
- [x] Chat Now instant booking
- [x] Pandit busy queue (Redis)
- [x] **Live audio** (WebRTC + WebSocket/Redis signaling)
- [ ] Auto-complete bookings after session end
- [x] **Live video** (WebRTC — waiting-room pattern on mobile)
- [x] **In-app notifications** (Prisma + Socket.IO)
- [x] **Articles / blog** (API + optional Blogger sync)
- [ ] Pandit accept/decline flow

### Experts
- [x] DB-backed experts + seed
- [x] `GET /experts/me` for dashboard
- [x] `?search=` and `?area=` query params on list
- [ ] Pandit CRUD / admin onboarding
- [ ] Server-side slot validation on create

### Payments
- [x] Razorpay create-order, verify, webhook
- [ ] Production webhook URL, GST receipts, pandit payouts

### Tools
- [x] All core tool endpoints
- [ ] Server-side unlock enforcement on premium endpoints
- [ ] Rate limiting on public tools
- [ ] Prokerala response caching

### pandit-service split
- [ ] Move domain or wire pandit-service with shared DB

---

## 14. Conventions for client agents

1. **Auth:** `Authorization: Bearer <accessToken>`
2. **Phone:** Auth DTOs accept `phoneNumber` or `phone`
3. **Wallet:** `walletBalance` (string) and `coinBalance` (number) are the same balance
4. **Expert IDs:** UUIDs from database (not `exp-001` mocks)
5. **Slots:** Pass `duration` matching booking depth (15/25/45)
6. **Booking flow:** `confirmed` → set `completed` → then review
7. **Chat:** Connect to `/chat` with `auth: { token }`; emit `joinSession` with `bookingId`
8. **Audio:** `POST /sessions/audio/create` or `/join` first; then `joinAudioSession`
9. **Video:** `POST /sessions/video/create` or `/join` first; then `joinVideoSession`
10. **Notifications:** Connect socket; listen `newNotification`; REST for history/read state
11. **Dashboard:** JWT + `GET /experts/me` + `GET /bookings/pandit`

---

## 15. Chronological build history

| Phase | What was done |
|-------|----------------|
| 1–7 | NestJS monorepo, Docker, Prisma, auth, profile, JWT |
| 8–12 | Experts DB, bookings, availability refactor, wallet/Razorpay |
| 13–16 | Tools (Prokerala + OpenAI), premium debits, zodiac sign |
| 17 | Live chat: ChatGateway, DynamoDB, mobile + dashboard clients |
| 18 | Chat Now + Redis pandit queue; `GET /experts/me`; monorepo consolidation |
| 19 | Live audio: WebRtcModule, `/sessions/audio/*`, audio WebSocket handlers |
| 20 | Live video: VideoSessionController, `/sessions/video/*`, video WebSocket handlers |
| 21 | VERSION 1.0.0: Articles, Notifications, account soft-delete, expert search/area filter, session reminder notifications |

---

*For full monorepo context see `apps/MASTER_SUMMARY.md`. Search code under `apps/user-service/src/`.*
