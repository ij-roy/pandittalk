# PanditTalk

PanditTalk is a system-design project with four clients and a local-first backend: website, dashboard, Expo mobile app, and NestJS API services. The runtime is designed for a low-cost Kali Linux host first; a tunnel exposes only the reverse proxy, while Vercel hosts the website and dashboard.

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

PostgreSQL is the durable source of truth. Redis holds shared cache, short-lived room/session state, rate limits, Socket.IO fan-out, and distributed timer/notification locks. The backend does not use sticky sessions. DynamoDB Local remains for the current chat-history adapter. Avatar uploads use a named Docker volume for local operation. AWS Chime, payment, astrology, and AI providers are optional environment-controlled integrations; no real credentials belong in this repository.

## Local startup

Prerequisites: Docker Desktop or Docker Engine with Compose, Node 24 for client checks, and a copy of the repository.

```powershell
Copy-Item .env.example .env
docker compose up -d --build
docker compose ps
Invoke-WebRequest http://localhost:3001/
```

The API is available at `http://localhost:3001`. The pandit service, Redis, PostgreSQL, and DynamoDB Local stay on the private Compose network so they do not collide with software already using ports on the host. Migrations run when the API container starts.

Useful commands:

```powershell
docker compose logs -f api
docker compose up -d --scale api=2 --no-recreate api proxy
docker compose down
docker compose down -v  # deletes local database/cache volumes; use deliberately
```

The optional TURN server is started with `docker compose --profile webrtc up -d`. A public tunnel must support HTTPS and WebSockets. Set the tunnel hostname/API origin and Vercel origins in `.env` before starting the stack; do not commit those values.

## Client configuration

- Website: copy `pandittalk-website/.env.example` to `.env.local`; set `API_BASE`, `NEXT_PUBLIC_API_BASE`, `BACKEND_URL`, and `SOCKET_URL` to the public tunnel URL as applicable.
- Dashboard: set `VITE_API_BASE` in the local dashboard environment to the public tunnel URL.
- Mobile: copy `pandittalk-mobile/.env.example` to `.env`; set `EXPO_PUBLIC_API_BASE` to the tunnel URL for a physical device. `localhost` means the device itself, not the Kali host.

The browser and mobile chat clients use the `/chat` Socket.IO namespace and the same session/audio/video event contract. Audio/video still require valid media-provider credentials or the configured local WebRTC/TURN path; the UI must show a clear unavailable state when those credentials are intentionally blank.

## Verification

```powershell
Push-Location pandittalk-backend; npm ci; npm test -- --runInBand; npm run build; Pop-Location
Push-Location pandittalk-website; npm ci; npm test; npm run build; Pop-Location
Push-Location pandittalk-dashboard; npm ci; npm run build; Pop-Location
Push-Location pandittalk-mobile; npm ci; npm run test:webview-allowlist; Pop-Location
docker compose config --quiet
```

The complete manual checklist, aspect-ratio pass, and two-replica smoke test are in [docs/verification/feature-matrix.md](docs/verification/feature-matrix.md). GitHub Actions runs the automated checks on every push and pull request.

## Kali deployment handoff

1. Clone the repository on Kali and create `.env` from `.env.example`.
2. Set the tunnel hostname, `ALLOWED_ORIGINS`, and client API/Socket URLs.
3. Run `docker compose up -d --build` and confirm `docker compose ps` is healthy.
4. Start the HTTPS tunnel to port 3001, then put the same HTTPS API URL into Vercel website/dashboard environment variables and the mobile `.env`/EAS profile.
5. Keep the host on a UPS or automatic-resume configuration and back up PostgreSQL before upgrades.

For a simple PostgreSQL backup and restore:

```powershell
docker compose exec -T postgres pg_dump -U pandittalk pandittalk > pandittalk-backup.sql
Get-Content pandittalk-backup.sql | docker compose exec -T postgres psql -U pandittalk pandittalk
```

The live Vercel and tunnel URLs are deployment values, so they are intentionally not hardcoded in source. The presentation should show the GitHub Actions run, the public website/dashboard, the mobile client, and the scaled replica smoke test.
