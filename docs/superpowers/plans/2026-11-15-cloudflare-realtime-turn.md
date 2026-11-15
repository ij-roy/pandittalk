# Cloudflare Realtime TURN Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate short-lived Cloudflare Realtime TURN ICE credentials in the backend and expose them through the existing audio/video session configuration.

**Architecture:** Keep the current peer-to-peer WebRTC and session endpoints. `WebRtcService` will call Cloudflare's server-side credential-generation endpoint when configured, map the returned `iceServers`, and fall back to the existing static TURN/STUN configuration on missing configuration or provider failure. Cloudflare credentials remain backend-only.

**Tech Stack:** NestJS 11, TypeScript, Node 24 built-in `fetch`, Jest, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-11-15-cloudflare-realtime-turn-design.md`

**Status:** Implemented and verified on 2026-11-15.

## Global Constraints

- Do not commit real Cloudflare credentials.
- Never return or log `CLOUDFLARE_TURN_API_TOKEN` or any generated TURN credential except the generated credential in the client-facing `iceServers` response required by WebRTC.
- Keep `WEBRTC_STUN_URLS` and complete static `WEBRTC_TURN_*` values as a local/testing fallback.
- Use a 24-hour default credential TTL and allow it to be configured with `CLOUDFLARE_TURN_CREDENTIAL_TTL_SECONDS`.
- Preserve the existing `WebRtcSessionConfig` response fields and endpoint paths.

## Review Focus

- Cloudflare is partially configured: fall back without sending a malformed request — covered by the service fallback tests.
- Cloudflare returns a non-2xx response or malformed JSON: return safe fallback ICE servers and log no secrets — covered by the provider-error tests.
- Cloudflare returns multiple ICE servers and credential fields: preserve the response shape and all usable entries — covered by the mapping test.
- The configured TTL is invalid or unsafe: use the 24-hour default — covered by the TTL test.
- Static TURN is absent: retain at least the configured STUN server — covered by the STUN-only fallback test.

### Task 1: Add Cloudflare TURN credential generation to `WebRtcService`

**Files:**
- Create: `pandittalk-backend/apps/user-service/src/webrtc/webrtc.service.spec.ts`
- Modify: `pandittalk-backend/apps/user-service/src/webrtc/webrtc.service.ts`

**Interfaces:**
- Consumes: `ConfigService` values `WEBRTC_STUN_URLS`, `WEBRTC_TURN_URL`, `WEBRTC_TURN_USERNAME`, `WEBRTC_TURN_CREDENTIAL`, `CLOUDFLARE_TURN_KEY_ID`, `CLOUDFLARE_TURN_API_TOKEN`, and `CLOUDFLARE_TURN_CREDENTIAL_TTL_SECONDS`.
- Produces: `async getSessionConfig(bookingId: string, format: 'audio' | 'video'): Promise<WebRtcSessionConfig>` with the same response fields as today.

- [x] **Step 1: Write failing unit tests**

  Add tests with a mocked `ConfigService`, mocked global `fetch`, and a test logger. Pin these behaviors:

  - With a key ID and API token, `getSessionConfig()` calls `https://rtc.live.cloudflare.com/v1/turn/keys/{keyId}/credentials/generate-ice-servers` with a Bearer token and JSON body `{ ttl: 86400 }` by default.
  - A valid Cloudflare response returns all supplied ICE servers in `iceServers`.
  - Missing Cloudflare configuration does not call `fetch` and uses static TURN when all static values exist.
  - Provider failure or invalid response falls back to static TURN, or STUN-only when static TURN is incomplete.
  - Invalid/non-positive TTL uses `86400`.

- [x] **Step 2: Run the focused test and verify it fails**

  Run from `pandittalk-backend`:

  ```powershell
  npm test -- --runInBand apps/user-service/src/webrtc/webrtc.service.spec.ts
  ```

  Expected: FAIL because the current service is synchronous and has no Cloudflare credential-generation path.

- [x] **Step 3: Implement the minimal service change**

  In `webrtc.service.ts`:

  - Inject Nest's `Logger` and add a private `getCloudflareIceServers(): Promise<WebRtcIceServer[] | null>` helper.
  - Require both Cloudflare key ID and API token before calling Cloudflare; otherwise return `null`.
  - Use an `AbortController` timeout for the outbound request.
  - Send `Authorization: Bearer <token>`, `Content-Type: application/json`, and the validated TTL.
  - Validate that the response is an array of ICE server objects with a non-empty `urls` value before returning it.
  - Make `getSessionConfig()` await Cloudflare servers first, then use static TURN/STUN fallback when the result is `null` or empty.
  - Log only a generic warning on failure; never include the token, key ID, username, or credential.

- [x] **Step 4: Run the focused tests and verify they pass**

  Run the command from Step 2. Expected: PASS for all Cloudflare, fallback, TTL, and response-shape cases.

### Task 2: Keep audio/video controllers compatible with the asynchronous service

**Files:**
- Modify: `pandittalk-backend/apps/user-service/src/webrtc/audio-session.controller.ts`
- Modify: `pandittalk-backend/apps/user-service/src/webrtc/video-session.controller.ts`

**Interfaces:**
- Consumes: `WebRtcService.getSessionConfig(...): Promise<WebRtcSessionConfig>` from Task 1.
- Produces: unchanged `POST .../create`, `POST .../join`, and `GET .../:bookingId` response routes.

- [x] **Step 1: Update every session-config call to await the service**

  Preserve all booking authorization and time-window checks. Only change the methods and return annotations needed to await `getSessionConfig()`.

- [x] **Step 2: Run typecheck**

  Run from `pandittalk-backend`:

  ```powershell
  npm run typecheck
  ```

  Expected: PASS with no Promise/type errors in the audio or video controllers.

### Task 3: Add configuration wiring and verify the deployable backend path

**Files:**
- Modify: `.env.example`
- Modify: `pandittalk-backend/.env.example`
- Modify: `docker-compose.yml`

**Interfaces:**
- Consumes: the server-only Cloudflare TURN variables from Task 1.
- Produces: Docker API environment wiring and documented direct-run environment wiring.

- [x] **Step 1: Add safe empty placeholders to both env examples**

  Add:

  ```dotenv
  CLOUDFLARE_TURN_KEY_ID=
  CLOUDFLARE_TURN_API_TOKEN=
  CLOUDFLARE_TURN_CREDENTIAL_TTL_SECONDS=86400
  ```

  Keep the static `WEBRTC_TURN_*` variables documented as fallback/local-coturn settings.

- [x] **Step 2: Pass the variables through the Compose API service**

  Add the three variables to the `api.environment` section using empty/default-safe substitutions. Do not place a real secret in the Compose file.

- [x] **Step 3: Run formatting, tests, typecheck, and build**

  From `pandittalk-backend`, run:

  ```powershell
  npm run format -- apps/user-service/src/webrtc/webrtc.service.ts apps/user-service/src/webrtc/webrtc.service.spec.ts apps/user-service/src/webrtc/audio-session.controller.ts apps/user-service/src/webrtc/video-session.controller.ts
  npm test -- --runInBand apps/user-service/src/webrtc/webrtc.service.spec.ts
  npm run typecheck
  npm run build:user-service
  ```

  Expected: formatting completes, focused tests pass, typecheck passes, and the user-service build succeeds.

- [x] **Step 4: Inspect the final diff for secret leakage**

  Confirm only empty placeholders were added to examples and no actual Cloudflare token, TURN credential, or generated response was written to the repository.

