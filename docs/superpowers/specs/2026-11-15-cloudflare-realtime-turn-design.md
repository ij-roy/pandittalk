# Cloudflare Realtime TURN integration design

## Status

Approved and implemented on 2026-11-15. The Cloudflare account credentials still must be added to the deployment environment before Cloudflare TURN is active.

## Goal

Use Cloudflare Realtime TURN for PanditTalk audio/video calls so callers behind restrictive NATs can establish a peer-to-peer WebRTC connection without depending on the Asus laptop, the Kali laptop, router port forwarding, or a self-hosted coturn server.

The existing session API already returns an `iceServers` array for both audio and video sessions. The integration will preserve that API shape and make the browser/mobile clients consume the returned list as they do today.

## Options considered

1. **Keep static `WEBRTC_TURN_*` values**
   - Rejected for Cloudflare Realtime TURN because Cloudflare expects short-lived credentials generated from a server-side TURN key.

2. **Generate Cloudflare TURN credentials in the backend and return the resulting ICE servers**
   - Recommended.
   - Smallest change to the current architecture.
   - Keeps the Cloudflare API token off the website and mobile app.
   - Works while the backend is hosted locally, on Kali, or later in Docker on a cloud VM, provided the backend has outbound HTTPS access.

3. **Move the calls to Cloudflare Realtime SFU**
   - Not included in this change. That would replace the current peer-to-peer signaling/media design and require client and session-flow changes.

## Proposed behavior

`WebRtcService.getSessionConfig()` will become asynchronous and will:

1. Build the configured STUN server list.
2. If Cloudflare TURN credentials are configured, call Cloudflare's credential-generation endpoint from the backend.
3. Add the returned `iceServers` to the response without exposing the Cloudflare TURN key or API token.
4. Use a short configurable credential lifetime, with a safe default of 24 hours.
5. Fall back to the existing static `WEBRTC_TURN_*` configuration, if complete, when Cloudflare is not configured or its credential request fails.
6. Always retain the STUN-only response as the final fallback, so a temporary Cloudflare outage does not make the session endpoint itself fail. The backend will log a warning without logging credentials.

The audio and video controllers will await the service result. Their routes and response structure will remain unchanged.

## Configuration

Add these server-only variables to both environment examples and pass them through the API service in `docker-compose.yml`:

```dotenv
CLOUDFLARE_TURN_KEY_ID=
CLOUDFLARE_TURN_API_TOKEN=
CLOUDFLARE_TURN_CREDENTIAL_TTL_SECONDS=86400
```

Existing `WEBRTC_STUN_URLS` and `WEBRTC_TURN_*` variables remain as fallback/local-coturn settings. Real Cloudflare secrets will not be committed to the repository.

## Cloudflare setup required from the owner

The owner must create a Cloudflare Realtime TURN key and an API token with the required TURN credential-generation permission in the Cloudflare account, then place the resulting values in the actual root `.env` used by Docker and in `pandittalk-backend/.env` when running the backend directly. The API token must be treated as a secret and should be rotated if exposed.

Cloudflare Realtime TURN is not unlimited free hosting: Cloudflare's current published allowance includes 1,000 GB of monthly egress free across the applicable Realtime services; usage beyond the allowance can be billed.

## Failure and security rules

- Never send the TURN key ID or Cloudflare API token to a client.
- Never log the generated username or credential.
- Apply a request timeout to the Cloudflare call.
- Validate the Cloudflare response before returning it as ICE server data.
- Do not cache credentials beyond their configured TTL or reuse expired credentials.
- Keep the static TURN fallback available for local coturn/testing.

## Verification plan

- Unit-test successful Cloudflare response mapping.
- Unit-test missing Cloudflare configuration and static fallback behavior.
- Unit-test Cloudflare timeout/error behavior and STUN-only fallback.
- Run backend typecheck and the focused WebRTC tests.
- Build the user-service Docker image and confirm the session endpoints still expose the expected `provider`, `bookingId`, `format`, and `iceServers` fields.

## Out of scope

- Cloudflare Worker load-balancer changes.
- Cloudflare Realtime SFU migration.
- Database, OTP, payments, or asset-storage changes.
- Committing real credentials.
