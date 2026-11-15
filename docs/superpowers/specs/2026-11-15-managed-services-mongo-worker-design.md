# Managed Services, MongoDB Chat, and Worker Front Door

## Intent

Make the backend portable across the Asus laptop, Kali laptop, and future cloud
hosts while keeping one stable public API URL for the already-installed mobile
app and the separately deployed website/dashboard.

## Goals

- Keep PostgreSQL as the business-data source of truth, hosted by Supabase.
- Use one shared Redis Cloud instance for OTPs, rate limits, Socket.IO fan-out,
  locks, and short-lived session state.
- Replace the current DynamoDB chat-history adapter with MongoDB Atlas.
- Store uploaded avatars/media in Cloudinary rather than local Docker volumes.
- Point clients at one stable Worker/API hostname; let the Worker route to
  backend origins such as Asus and Kali.
- Keep secrets in the ignored root `.env`; provide safe placeholders and clear
  variable names in `.env.example`.
- Preserve a clear local-development path where practical.

## Non-goals

- Replacing PostgreSQL with MongoDB.
- Implementing payment, OTP, or media-provider behavior in this change.
- Treating the Worker as a database or as a replacement for shared state.
- Committing or printing any credential, token, connection string, or API secret.

## Chosen approach

The API contract remains unchanged. The backend keeps Prisma/PostgreSQL for
users, bookings, wallets, transactions, auth sessions, articles, and related
records. A MongoDB chat storage service will implement the same operations that
the current DynamoDB service exposes: save a message, query a session window,
load messages, and health-check the store. The MongoDB collection will be
indexed by `sessionId` and `timestamp`.

The backend will read a full `REDIS_URL`, allowing local `redis://` and managed
TLS/authenticated `rediss://` connections. Both the normal Redis client and the
Socket.IO adapter must use the same URL.

Cloudinary will be introduced behind the existing avatar-storage abstraction.
The API secret will remain server-side; clients receive only the resulting
public/secure asset URL.

The Worker hostname will be the only client-facing API base. Asus and Kali will
remain origins. Automatic routing/failover requires the Worker configuration to
perform health-aware routing or to front a Cloudflare load-balancing setup; the
application itself will not embed backend1/backend2 URLs.

## Required configuration

- Supabase `DATABASE_URL` and, if needed for Prisma migrations, `DIRECT_URL`.
- `REDIS_URL` with authentication/TLS where required.
- `MONGODB_URI` and `MONGODB_DATABASE`.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and
  an upload folder.
- Stable `API_PUBLIC_URL`/Worker URL and exact browser origins.
- Shared `JWT_SECRET`, provider credentials, and identical deployment settings
  on every backend host.

## Operational constraints

- All backend instances must run the same commit and compatible migrations.
- All backend instances must use the same Supabase, Redis Cloud, MongoDB Atlas,
  and Cloudinary resources.
- Razorpay webhooks must use the stable public API URL.
- Existing local PostgreSQL/Redis/DynamoDB services must not silently override
  managed-service variables in Compose.
- No secret will be written to tracked files or included in tool output.

## Verification

- Validate Compose configuration and backend build.
- Verify API readiness against Supabase, Redis Cloud, and MongoDB.
- Verify save/query chat history through the existing Socket.IO session flow.
- Verify avatar upload returns a Cloudinary URL and is readable from both API
  origins.
- Verify both backend origins accept the same authentication session and wallet
  transaction state.
