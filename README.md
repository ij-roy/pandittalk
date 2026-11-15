# PanditTalk

PanditTalk is a system-design project with four clients and a portable backend:
website, dashboard, Expo mobile app, and NestJS API services. The API can run on
the Asus laptop, Kali Linux, or cloud hosts because clients use one stable
Worker/API hostname and every backend instance shares the same managed services.

Team: the project team currently consists of the user and Aman Singh.

## Architecture

```text
Vercel website/dashboard ─┐
Expo mobile ──────────────┼─ Cloudflare Worker/API hostname ─┬─ backend origins
                          │                                  ├─ Supabase PostgreSQL
                          └──────── HTTPS/WSS ───────────────┼─ Redis Cloud
                                                             ├─ MongoDB Atlas
                                                             └─ Cloudinary
```

PostgreSQL in Supabase is the durable source of truth for users, bookings,
wallets, transactions, auth sessions, and articles. Redis Cloud holds shared
cache, OTPs, short-lived room/session state, rate limits, Socket.IO fan-out, and
distributed timer/notification locks. MongoDB Atlas stores chat history only.
Cloudinary stores uploaded media. The backend does not use sticky sessions.
Payment, astrology, and AI providers remain optional environment-controlled
integrations; no real credentials belong in this repository.

## Startup modes

Prerequisites: Docker Engine with Compose, Node 24 for client checks, and a
copy of the repository.

### Production/Kali managed runtime

Copy the real root `.env` securely onto the host. It must contain the
Supabase PostgreSQL pooler URL, Redis Cloud URL, MongoDB Atlas URI, Cloudinary
credentials, provider credentials, and `ALLOW_TEST_OTP=false`. Then run:

```bash
docker compose up -d --build
docker compose ps
curl http://localhost:3001/
curl http://localhost:3001/readiness
```

The production Compose file starts only the API, Pandit service, Caddy proxy,
and optional TURN service. PostgreSQL, Redis, MongoDB, and media are managed by
Supabase, Redis Cloud, MongoDB Atlas, and Cloudinary. A missing `REDIS_URL`
fails production startup instead of silently selecting localhost.

### Isolated local demo/CI runtime

Use the explicit local override when you intentionally want disposable local
databases:

```powershell
Copy-Item .env.example .env
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.local.yml ps
Invoke-WebRequest http://localhost:3001/readiness
```

For the fixed-OTP fixture only, set these values in the local `.env` before
starting it (never use them on the managed runtime):

```dotenv
ALLOW_TEST_OTP=true
TEST_OTP_PHONE_ALLOWLIST=+919999999998,+919999999997
ADMIN_TEST_OTP_PHONE_ALLOWLIST=+919999999996
```

For a repeatable local customer/dashboard smoke test, seed only the demo
records (no fake reviews or payments) and use OTP `1234` for the allowlisted
demo phones:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml exec -T api node scripts/ensure-local-demo-data.cjs
```

The script creates one customer, one linked pandit, one local Admin, and
confirmed chat, audio, and video bookings. It is not part of application
startup and is intended only for local verification. The local Admin demo phone
is `+919999999996` and uses the fixed OTP `1234` only while
`ALLOW_TEST_OTP=true`. Use the printed media booking IDs to open the real
audio/video routes.

Useful production commands:

```powershell
docker compose logs -f api
docker compose up -d --scale api=2 --no-recreate api proxy
docker compose exec -T api npx prisma migrate deploy --schema apps/user-service/prisma/schema.prisma
Push-Location pandittalk-website; npm run test:local-replica; Pop-Location
Push-Location pandittalk-website; npm run test:local-api; Pop-Location
docker compose down
docker compose down -v  # removes only Compose media/proxy volumes
```

For local dependency checks, add both Compose files to each command:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml exec -T redis redis-cli ping
docker compose -f docker-compose.yml -f docker-compose.local.yml exec -T postgres pg_isready -U pandittalk -d pandittalk
docker compose -f docker-compose.yml -f docker-compose.local.yml down -v
```

The API is available at `http://localhost:3001`. Migrations run when the API
container starts. `/readiness` verifies PostgreSQL, Redis, and MongoDB before
returning `ready`; use it as the Worker/load-balancer health check. Compose
applies bounded Docker JSON logs to every service (10 MB per file, three
retained files) so a long-running Kali host does not fill its disk.

The optional TURN server is started with `docker compose --profile webrtc up -d`.
A public tunnel or Worker route must support HTTPS and WebSockets. Set
`API_PUBLIC_URL` to the stable Worker hostname and put the deployed website and
dashboard origins in `ALLOWED_ORIGINS`; do not commit those values.

The current deployed Worker hostname is
`https://pandittalk-load-balancer.admininfo-6d6.workers.dev`. For a quick
HTTPS/WSS tunnel during development, install `cloudflared` on Kali and run
`cloudflared tunnel --url http://127.0.0.1:3001` (or use an equivalent named
tunnel/ngrok deployment). For the stable production path, configure the
Cloudflare Worker to route `/` and `/chat` to the healthy Asus/Kali backend
origins, with WebSocket pass-through enabled. Put only the Worker hostname in
website, dashboard, and mobile API variables. A normal HTTP tunnel does not
relay WebRTC media; expose TURN separately when real audio/video is enabled.

## Configuration table

| Consumer | Local value | Tunnel/Vercel value | Variable |
| --- | --- | --- | --- |
| API through Caddy | `http://localhost:3001` | `https://pandittalk-load-balancer.admininfo-6d6.workers.dev` | `API_PUBLIC_URL` |
| Socket.IO chat | `http://localhost:3001/chat` | `https://pandittalk-load-balancer.admininfo-6d6.workers.dev/chat` | Website `SOCKET_URL`; clients append `/chat` |
| Website dev server | `http://localhost:3000` | Vercel website origin | `API_BASE`, `NEXT_PUBLIC_API_BASE`, `BACKEND_URL`, `SOCKET_URL` |
| Dashboard dev server | `http://localhost:5173` | Vercel dashboard origin | `VITE_API_BASE` |
| Expo web/dev client | `http://localhost:8081` | `https://pandittalk-load-balancer.admininfo-6d6.workers.dev` for a device | `EXPO_PUBLIC_API_BASE` |
| TURN | `localhost:3478` with the `webrtc` profile | Public UDP/TCP 3478 endpoint | `TURN_REALM`, `TURN_USERNAME`, `TURN_PASSWORD` |
| Media provider | Browser/native WebRTC with free STUN | Optional coturn or another TURN service | `WEBRTC_STUN_URLS`, `WEBRTC_TURN_URL`, `WEBRTC_TURN_USERNAME`, `WEBRTC_TURN_CREDENTIAL` |

For a physical phone, `localhost` means the phone itself. Use the Kali LAN IP
for a same-network test or the HTTPS tunnel for an external test. Never commit
the resulting `.env` files, tunnel URLs with credentials, service JSON files,
or private keys.

## Client configuration and local commands

Website:

```powershell
Copy-Item pandittalk-website/.env.example pandittalk-website/.env.local
Push-Location pandittalk-website; npm ci; npm run dev; Pop-Location
```

Dashboard (Pandit and Admin workspaces):

```powershell
Copy-Item pandittalk-dashboard/.env.example pandittalk-dashboard/.env
Push-Location pandittalk-dashboard; npm ci; npm run dev; Pop-Location
```

The same dashboard login accepts the linked Pandit demo phone
`+919999999997` and the local Admin demo phone `+919999999996`. Pandits are
sent to `/dashboard`; Admins are sent to `/admin`. The browser never chooses
its own role: `/auth/me` supplies the persisted role and every `/admin/*` API
route checks `ADMIN` server-side.

Mobile:

```powershell
Copy-Item pandittalk-mobile/.env.example pandittalk-mobile/.env
Push-Location pandittalk-mobile; npm ci; npm run start; Pop-Location
```

Set the mobile `EXPO_PUBLIC_API_BASE` to the stable Worker URL for a physical
device and for release builds. The installed app does not need to change when
traffic moves from Asus to Kali because the client hostname stays the same.
The native audio/video module requires an Expo development build; Expo Go does
not include the native `react-native-webrtc` module. Build the client with the
configured Expo development client before testing calls on a physical phone.

The website, dashboard, and mobile chat clients use the `/chat` Socket.IO
namespace and the same session/audio/video event contract. Audio/video is real
WebRTC media, not a fake preview: the browser and native clients request device
permissions and expose mute, camera, reconnect, end-call, and unavailable
states. Free STUN is enough for many networks; use the optional coturn profile
when restrictive NATs require a relay.

## Verification and CI/CD

The full evidence table is in
[docs/verification/feature-matrix.md](docs/verification/feature-matrix.md). The
presentation sequence is in
[docs/presentation/demo-runbook.md](docs/presentation/demo-runbook.md).

Local checks:

```powershell
Push-Location pandittalk-backend; npm ci; npm run prisma:generate; npm run lint:check; npm test -- --runInBand; npm run typecheck; npm run build; Pop-Location
Push-Location pandittalk-website; npm ci; npm test; npm run test:ui; npm run build; Pop-Location
Push-Location pandittalk-dashboard; npm ci; npm run lint; npm run build; Pop-Location
Push-Location pandittalk-mobile; npm ci; npm run typecheck; npm run test:webview-allowlist; npx expo export --platform web; Pop-Location
docker compose config --quiet
```

GitHub Actions runs install, backend Prisma/lint/tests/typecheck/build gates, client
typechecks/lint/build gates, website browser checks, Docker/Compose startup
smoke checks, and tracked-secret hygiene checks on every push and pull request.
Backend formatting and unused-symbol checks are blocking. Existing dynamic
provider/socket payload checks remain visible as ESLint warnings while the
runtime is migrated toward stricter types; `npm run lint:check` still fails on
blocking lint errors. A hosted run is still required after the branch is pushed;
local green output is not a substitute for the CI check.

## Kali deployment and recovery

1. Clone the repository on Kali and copy the real ignored `.env` securely.
2. Confirm the Supabase, Redis Cloud, MongoDB Atlas, Cloudinary, TURN, MSG91,
   and Razorpay values are present; keep `ALLOW_TEST_OTP=false`.
3. Run `docker compose up -d --build` and confirm `docker compose ps` is healthy.
4. Configure the Cloudflare Worker to route the public hostname to the healthy
   Asus/Kali origins, then put only that public URL into the website, dashboard,
   and mobile `.env`/EAS profile.
5. Keep the host on a UPS or automatic-resume configuration and back up
   Supabase PostgreSQL and MongoDB Atlas before upgrades.

`docker compose stop` pauses the stateless runtime; `docker compose down` stops
and removes containers while preserving the managed databases. The production
Compose file has no local database volumes. Use the local override only for
disposable demos and never run its `down -v` against a production project.

Docker restart policies and named volumes allow recovery after a power cut:

```powershell
docker compose up -d
docker compose ps
docker compose logs --tail=100 api proxy
```

Back up Supabase PostgreSQL and MongoDB Atlas using their managed backup/export
tools before upgrades. Docker only owns the media and Caddy configuration
volumes in production. Rotate or replace any credential that was ever exposed
before using the repository on a public tunnel.

The live Vercel and tunnel URLs are deployment values, so they are intentionally
not hardcoded in source. The presentation should show the GitHub Actions run,
the public website/dashboard, the mobile client, and the scaled replica smoke
test.
