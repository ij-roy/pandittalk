# Managed Services, MongoDB Chat, and Worker Front Door Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the backend run on Asus, Kali, or cloud hosts against shared Supabase PostgreSQL, Redis Cloud, MongoDB Atlas chat storage, and Cloudinary media while clients use one stable Worker/API URL.

**Architecture:** PostgreSQL remains the canonical business database through Prisma. Redis Cloud becomes the shared cache/OTP/Socket.IO coordination layer, MongoDB Atlas replaces the DynamoDB chat adapter, and Cloudinary implements the existing avatar/article media storage interface. Compose will no longer silently force local service URLs when managed-service variables are configured; the Worker URL is client-facing and backend origins remain infrastructure configuration.

**Tech Stack:** NestJS, Prisma/PostgreSQL, `mongodb` Node driver, `cloudinary` Node SDK, `redis` Node client, Docker Compose, Cloudflare Worker configuration, Jest/TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-15-managed-services-mongo-worker-design.md`

## Global Constraints

- PostgreSQL remains the source of truth for users, bookings, wallets, transactions, auth sessions, articles, and related business data.
- MongoDB is used only for chat history; the public chat/API contract must not change.
- All backend instances must use the same shared managed-service resources and compatible code/migrations.
- Redis connections must support both local `redis://` and authenticated/TLS `rediss://` URLs.
- Cloudinary secrets remain server-side and must never be committed or printed.
- The stable client-facing API URL is the Worker/API URL; clients must not embed backend1/backend2 origin URLs.
- Local development must retain an explicit local fallback path.

## Review Focus

- A Redis Cloud URL with credentials, TLS, or URL-encoded characters must be used identically by cache and Socket.IO clients. Test: both clients receive the exact configured URL and do not reconstruct an unauthenticated `redis://host:port` URL.
- Mongo chat pagination must preserve newest-first storage and chronological response order with `beforeTimestamp`. Test: save/query messages and assert ordering and `hasMore` behavior.
- Cloudinary upload/delete failures must surface cleanly and return only a secure public URL on success. Test: mocked SDK success and failure paths.
- Managed Compose configuration must not overwrite external `DATABASE_URL`, `REDIS_URL`, `MONGODB_URI`, or Cloudinary variables with local service defaults. Test: rendered Compose config in managed and local modes.
- Readiness must report MongoDB rather than DynamoDB and fail when any managed dependency is unreachable. Test: controller responses with mocked dependency results.

### Task 1: Add tested managed-service configuration primitives

**Files:**
- Modify: `pandittalk-backend/package.json` and `pandittalk-backend/package-lock.json`
- Modify: `pandittalk-backend/apps/user-service/src/redis/redis-client.service.ts`
- Modify: `pandittalk-backend/apps/user-service/src/redis/redis-io.adapter.ts`
- Test: `pandittalk-backend/apps/user-service/src/redis/redis-io.adapter.spec.ts`
- Create: `pandittalk-backend/apps/user-service/src/redis/redis-url.ts`
- Test: `pandittalk-backend/apps/user-service/src/redis/redis-url.spec.ts`

**Interfaces:**
- Produces `buildRedisUrl(config: ConfigService): string`, preferring `REDIS_URL` and falling back to `redis://REDIS_HOST:REDIS_PORT`.
- Both Redis clients consume `buildRedisUrl` and support authenticated/TLS URLs without changing call sites.

- [ ] **Step 1: Add failing URL tests** for explicit `REDIS_URL`, local host/port fallback, and preservation of `rediss://` credentials/query parameters.
- [ ] **Step 2: Run the focused Redis tests and confirm they fail** because the helper does not exist.
- [ ] **Step 3: Implement the shared URL helper** and update both Redis client paths to use it.
- [ ] **Step 4: Run the focused Redis tests and confirm they pass.**
- [ ] **Step 5: Add the `mongodb` and `cloudinary` runtime dependencies** using the existing lockfile workflow.

### Task 2: Replace DynamoDB chat history with MongoDB Atlas

**Files:**
- Create: `pandittalk-backend/apps/user-service/src/chat/chat-storage.interface.ts`
- Create: `pandittalk-backend/apps/user-service/src/chat/mongo-chat.service.ts`
- Modify: `pandittalk-backend/apps/user-service/src/chat/chat.gateway.ts`
- Modify: `pandittalk-backend/apps/user-service/src/chat/chat.module.ts`
- Modify: `pandittalk-backend/apps/user-service/src/user-service.controller.ts`
- Modify: `pandittalk-backend/apps/user-service/src/user-service.controller.spec.ts`
- Test: `pandittalk-backend/apps/user-service/src/chat/mongo-chat.service.spec.ts`
- Modify/Delete: `pandittalk-backend/apps/user-service/src/chat/dynamo.service.ts` according to the final local fallback decision

**Interfaces:**
- `ChatStorage` exposes `onModuleInit()`, `ping()`, `saveMessage(sessionId, senderId, senderRole, message, timestamp)`, `getMessageWindow(sessionId, options?)`, and `getMessages(sessionId, limit?)`.
- `MongoChatService` implements `ChatStorage`, using `MONGODB_URI` and `MONGODB_DATABASE`, collection `chat_messages`, and a compound index `{ sessionId: 1, timestamp: -1 }`.

- [ ] **Step 1: Write failing mocked-collection tests** for initialization, save, newest-first query, chronological-window normalization, and health ping.
- [ ] **Step 2: Run the focused Mongo tests and confirm failure.**
- [ ] **Step 3: Implement `MongoChatService`** with one shared `MongoClient`, connection cleanup, index creation, and the existing chat-history-window behavior.
- [ ] **Step 4: Replace direct `DynamoService` types/injection in the gateway and module** with the `ChatStorage` token/service while preserving all gateway events and payloads.
- [ ] **Step 5: Update readiness and controller tests** to report `mongodb: 'ok'` and to use the new storage dependency.
- [ ] **Step 6: Run the focused chat/readiness tests and confirm they pass.**

### Task 3: Add Cloudinary to the existing media-storage abstraction

**Files:**
- Create: `pandittalk-backend/apps/user-service/src/avatar/cloudinary-avatar-storage.service.ts`
- Modify: `pandittalk-backend/apps/user-service/src/avatar/avatar.module.ts`
- Modify: `pandittalk-backend/apps/user-service/src/avatar/avatar-storage.interface.ts` only if the provider needs an explicit public-ID contract
- Test: `pandittalk-backend/apps/user-service/src/avatar/cloudinary-avatar-storage.service.spec.ts`

**Interfaces:**
- `CloudinaryAvatarStorageService` implements `AvatarStorage.put(key, buffer, contentType): Promise<string>` and `delete(key): Promise<void>`.
- Configuration consumes `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `CLOUDINARY_FOLDER`.

- [ ] **Step 1: Write failing mocked-Cloudinary tests** for upload URL generation, key/folder normalization, deletion, and provider errors.
- [ ] **Step 2: Run the focused storage tests and confirm failure.**
- [ ] **Step 3: Implement server-side Cloudinary upload/delete** using the existing `AvatarStorage` contract and secure delivery URLs.
- [ ] **Step 4: Select Cloudinary when `AVATAR_STORAGE=cloudinary`** while preserving `local` and `s3` modes.
- [ ] **Step 5: Run avatar and existing profile/article storage tests and confirm they pass.**

### Task 4: Make Compose and environment templates support managed services

**Files:**
- Modify: `.env.example`
- Modify: `.env` locally, without exposing values in output
- Modify: `docker-compose.yml`
- Modify: `pandittalk-backend/.env.example`
- Modify: `README.md`
- Create/Modify: Compose or profile files only if needed to preserve a clean local fallback

**Interfaces:**
- Managed mode consumes `DATABASE_URL`, optional `DIRECT_URL`, `REDIS_URL`, `MONGODB_URI`, `MONGODB_DATABASE`, Cloudinary variables, `API_PUBLIC_URL`, and exact `ALLOWED_ORIGINS`.
- Local mode continues to use the existing local PostgreSQL/Redis services and a local Mongo fallback or a clearly documented local chat mode.

- [ ] **Step 1: Add configuration assertions/tests** that managed variables are not overwritten by Compose defaults.
- [ ] **Step 2: Update Compose service wiring** to use `REDIS_URL`, `MONGODB_URI`, external PostgreSQL, and Mongo readiness; remove the unconditional DynamoDB dependency for managed Mongo mode.
- [ ] **Step 3: Update both environment examples** with safe placeholders, comments, and production-safety defaults (`ALLOW_TEST_OTP=false`, secure cookies, no placeholder secrets).
- [ ] **Step 4: Update the root README** with managed-mode startup, local fallback, migration, backup, and Worker-origin instructions.
- [ ] **Step 5: Render/validate Compose in both modes.**

### Task 5: Configure and verify the stable Worker/API front door

**Files:**
- Modify: `.env.example`
- Modify: `pandittalk-website/.env.example`
- Modify: `pandittalk-dashboard/.env.example`
- Modify: `pandittalk-mobile/.env.example`
- Create or modify only if the Worker belongs in this repository: `worker/` configuration files

**Interfaces:**
- Every client consumes the same `https://...` Worker/API URL through its existing environment variable.
- Backend CORS and asset URL configuration consume the Worker/public origins, not backend1/backend2 origin URLs.

- [ ] **Step 1: Define the single public API variable and map it** to website `BACKEND_URL`/`API_BASE`, dashboard `VITE_API_BASE`, and mobile `EXPO_PUBLIC_API_BASE`.
- [ ] **Step 2: Add Worker routing documentation/configuration** for backend1/backend2 health-aware routing and WebSocket pass-through; do not put service credentials in the client bundle.
- [ ] **Step 3: Verify client builds resolve only the stable public API URL.**

### Task 6: Fill the ignored local `.env` from authenticated service dashboards

**Files:**
- Modify: `.env` only; never commit or print it

- [ ] **Step 1: Inspect the logged-in Supabase, MongoDB Atlas, Redis Cloud, Cloudinary, and Cloudflare dashboards** for existing connection/API values; do not create new keys or change account permissions without confirmation.
- [ ] **Step 2: If a required credential is absent, stop at that specific field** and report what the user must create or provide.
- [ ] **Step 3: Write the values to the ignored root `.env`** with the Worker URL, exact origins, managed database URLs, provider settings, and disabled test OTP.
- [ ] **Step 4: Validate variable presence and URL formats without printing secret values.**

### Task 7: End-to-end verification

**Files:**
- No new source files; use existing test/build commands and runtime smoke checks.

- [ ] **Step 1: Run backend lint, tests, typecheck, and build.**
- [ ] **Step 2: Render Compose config and build/start the managed stack.**
- [ ] **Step 3: Verify `/readiness` reports PostgreSQL, Redis, and MongoDB healthy.**
- [ ] **Step 4: Verify chat persistence across two API processes against the same MongoDB and Redis services.**
- [ ] **Step 5: Verify avatar upload returns a Cloudinary URL.**
- [ ] **Step 6: Verify the website/dashboard/mobile configuration points to the stable Worker URL and report any missing external provider configuration.**

