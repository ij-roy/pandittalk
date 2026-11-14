# PanditTalk

PanditTalk is a system-design project with four clients and a local-first
backend: website, dashboard, Expo mobile app, and NestJS API services. The
runtime is designed for a low-cost Kali Linux host first; a tunnel exposes only
the reverse proxy, while Vercel hosts the website and dashboard.

Team: the project team currently consists of the user and Aman Singh.

## Architecture

```text
Vercel website/dashboard ─┐
Expo mobile ──────────────┼─ HTTPS/WSS tunnel ─ Caddy ─ API replicas
                          │                                  │
                          └─────────────── Redis ────────────┤
                                           PostgreSQL ────────┤
                                           DynamoDB Local ────┘
```

PostgreSQL is the durable source of truth. Redis holds shared cache, short-lived
room/session state, rate limits, Socket.IO fan-out, and distributed
timer/notification locks. The backend does not use sticky sessions. DynamoDB
Local remains for the current chat-history adapter. Avatar uploads use a named
Docker volume for local operation. AWS Chime, payment, astrology, and AI
providers are optional environment-controlled integrations; no real credentials
belong in this repository.

## Local startup

Prerequisites: Docker Desktop or Docker Engine with Compose, Node 24 for client
checks, and a copy of the repository.

```powershell
Copy-Item .env.example .env
docker compose up -d --build
docker compose ps
Invoke-WebRequest http://localhost:3001/
Invoke-WebRequest http://localhost:3001/readiness
```

For a repeatable local customer/dashboard smoke test, seed only the demo
records (no fake reviews or payments) and use OTP `1234` for the two phones in
`TEST_OTP_PHONE_ALLOWLIST`:

```powershell
docker compose exec -T api node scripts/ensure-local-demo-data.cjs
```

The script creates one customer, one linked pandit, and one confirmed chat
booking. It is not part of application startup and is intended only for local
verification.

The API is available at `http://localhost:3001`. The Pandit service, Redis,
PostgreSQL, and DynamoDB Local stay on the private Compose network so they do
not collide with software already using ports on the host. Migrations run when
the API container starts.

`/` is a liveness check. `/readiness` verifies PostgreSQL, Redis, and
DynamoDB Local before returning `ready`; use it for tunnel/load-balancer health
checks.

Useful commands:

```powershell
docker compose logs -f api
docker compose up -d --scale api=2 --no-recreate api proxy
docker compose exec -T api node scripts/ensure-local-demo-data.cjs
Push-Location pandittalk-website; npm run test:local-replica; Pop-Location
Push-Location pandittalk-website; npm run test:local-api; Pop-Location
docker compose exec -T redis redis-cli ping
docker compose exec -T postgres pg_isready -U pandittalk -d pandittalk
docker compose down
docker compose down -v  # deletes local database/cache volumes; use deliberately
```

The optional TURN server is started with `docker compose --profile webrtc up -d`.
A public tunnel must support HTTPS and WebSockets. Set the tunnel hostname/API
origin and Vercel origins in `.env` before starting the stack; do not commit
those values.

## Configuration table

| Consumer | Local value | Tunnel/Vercel value | Variable |
| --- | --- | --- | --- |
| API through Caddy | `http://localhost:3001` | `https://<tunnel-host>` | `API_EXTERNAL_PORT`, tunnel hostname |
| Socket.IO chat | `http://localhost:3001/chat` | `https://<tunnel-host>/chat` | Website `SOCKET_URL`; clients append `/chat` |
| Website dev server | `http://localhost:3000` | Vercel website origin | `API_BASE`, `NEXT_PUBLIC_API_BASE`, `BACKEND_URL`, `SOCKET_URL` |
| Dashboard dev server | `http://localhost:5173` | Vercel dashboard origin | `VITE_API_BASE` |
| Expo web/dev client | `http://localhost:8081` | `https://<tunnel-host>` for a device | `EXPO_PUBLIC_API_BASE` |
| TURN | `localhost:3478` with the `webrtc` profile | Public UDP/TCP 3478 endpoint | `TURN_REALM`, `TURN_USERNAME`, `TURN_PASSWORD` |
| Media provider | blank for local non-media smoke tests | AWS Chime region/account | `AWS_CHIME_ACCESS_KEY_ID`, `AWS_CHIME_SECRET_ACCESS_KEY` |

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

Dashboard:

```powershell
Copy-Item pandittalk-dashboard/.env.example pandittalk-dashboard/.env
Push-Location pandittalk-dashboard; npm ci; npm run dev; Pop-Location
```

Mobile:

```powershell
Copy-Item pandittalk-mobile/.env.example pandittalk-mobile/.env
Push-Location pandittalk-mobile; npm ci; npm run start; Pop-Location
```

Set the mobile `EXPO_PUBLIC_API_BASE` to the tunnel URL for a physical device.
The native audio/video module requires an Expo development build; Expo Go does
not contain the custom `expo-pandit-chime` module.

The website, dashboard, and mobile chat clients use the `/chat` Socket.IO
namespace and the same session/audio/video event contract. Audio/video is real
Chime media, not a fake preview: the browser and native clients request device
permissions and expose mute, camera, reconnect, end-call, and unavailable
states. A live join still requires valid Chime credentials and a real browser
or native device; TURN by itself is not a signaling or media provider.

## Verification and CI/CD

The full evidence table is in
[docs/verification/feature-matrix.md](docs/verification/feature-matrix.md). The
presentation sequence is in
[docs/presentation/demo-runbook.md](docs/presentation/demo-runbook.md).

Local checks:

```powershell
Push-Location pandittalk-backend; npm ci; npm run prisma:generate; npm test -- --runInBand; npm run build; Pop-Location
Push-Location pandittalk-website; npm ci; npm test; npm run test:ui; npm run build; Pop-Location
Push-Location pandittalk-dashboard; npm ci; npm run lint; npm run build; Pop-Location
Push-Location pandittalk-mobile; npm ci; npm run typecheck; npm run test:webview-allowlist; npx expo export --platform web; Pop-Location
docker compose config --quiet
```

GitHub Actions runs install, backend Prisma/tests/build gates, client
typechecks/lint/build gates, website browser checks, Docker/Compose startup
smoke checks, and tracked-secret hygiene checks on every push and pull request.
The backend’s existing all-files ESLint configuration has unrelated legacy
findings, so backend type safety is enforced by Prisma generation, Jest, and the
Nest build while client lint remains a blocking gate. A hosted run is still
required after the branch is pushed; local green output is not a substitute for
the CI check.

## Kali deployment and recovery

1. Clone the repository on Kali and create `.env` from `.env.example`.
2. Set the tunnel hostname, `ALLOWED_ORIGINS`, and client API/Socket URLs.
3. Run `docker compose up -d --build` and confirm `docker compose ps` is healthy.
4. Start the HTTPS tunnel to port 3001, then put the same HTTPS API URL into
   Vercel website/dashboard environment variables and the mobile `.env`/EAS
   profile.
5. Keep the host on a UPS or automatic-resume configuration and back up
   PostgreSQL before upgrades.

Docker restart policies and named volumes allow recovery after a power cut:

```powershell
docker compose up -d
docker compose ps
docker compose logs --tail=100 api proxy
```

For a simple PostgreSQL backup and restore:

```powershell
docker compose exec -T postgres pg_dump -U pandittalk pandittalk > pandittalk-backup.sql
Get-Content pandittalk-backup.sql | docker compose exec -T postgres psql -U pandittalk pandittalk
```

Do not use `docker compose down -v` during routine restarts because it removes
the local database, Redis AOF, DynamoDB Local data, and media volume. Rotate or
replace any credential that was ever exposed before using the repository on a
public tunnel.

The live Vercel and tunnel URLs are deployment values, so they are intentionally
not hardcoded in source. The presentation should show the GitHub Actions run,
the public website/dashboard, the mobile client, and the scaled replica smoke
test.
