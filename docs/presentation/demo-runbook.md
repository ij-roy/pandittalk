# PanditTalk presentation and live-demo runbook

This runbook is designed for a 12–15 minute presentation by the two-person
team: the user and Aman Singh. It keeps the application simple and spends the
time on the Docker, CI/CD, stateless runtime, and deployment decisions that are
being graded.

## Before the presentation

1. On Kali, clone the repository and create `.env` from `.env.example`.
2. Set `ALLOWED_ORIGINS` to the Vercel website/dashboard origins and set the
   website, dashboard, and mobile API variables to the HTTPS tunnel origin.
3. Start the stack and verify health:

   ```bash
   docker compose up -d --build
   docker compose ps
   docker compose exec -T api node scripts/ensure-local-demo-data.cjs
   curl --fail http://localhost:3001/
   curl --fail http://localhost:3001/readiness
   curl --fail 'http://localhost:3001/socket.io/?EIO=4&transport=polling'
   ```

4. Have the GitHub Actions run open in one browser tab and the Vercel website,
   dashboard, and mobile dev client ready in the others.
5. If audio/video is part of the live demonstration, configure valid Chime
   credentials and use a booking that both clients can join. If those
   credentials are not available, demonstrate the clear unavailable/error state
   and say so; do not present text chat as proof of media.

## Suggested timing and speaking ownership

| Time | Speaker | Content | Evidence |
| --- | --- | --- | --- |
| 0:00–1:30 | User | Problem, users, and the four clients | Website, dashboard, mobile, backend folder layout |
| 1:30–4:00 | Aman Singh | System design and why local-first | PostgreSQL source of truth, Redis shared state, DynamoDB Local compatibility, Caddy front door, optional TURN |
| 4:00–6:00 | User | Docker and stateless scaling | `docker compose ps`, private dependency ports, `--scale api=2`, health endpoint |
| 6:00–8:00 | Aman Singh | CI/CD and repository discipline | GitHub Actions push/PR checks, branch/PR history, secret hygiene, Docker build |
| 8:00–11:30 | User | Live application demonstration | Website route, dashboard route, mobile route, text chat, responsive layout, error handling |
| 11:30–13:30 | Aman Singh | Deployment and failure plan | HTTPS tunnel to port 3001, Vercel env vars, Redis-backed replica behavior, backup/restart after power cut |
| 13:30–15:00 | Both | Questions and limitations | Explain provider credentials, TURN, scaling limits, and the AWS upgrade path |

## Live command sequence

Run these in order, keeping the output visible:

```bash
docker compose ps
curl --fail http://localhost:3001/
curl --fail http://localhost:3001/readiness
docker compose exec -T redis redis-cli ping
docker compose exec -T postgres pg_isready -U pandittalk -d pandittalk
docker compose up -d --scale api=2 --no-recreate api proxy
docker compose ps
docker compose exec -T api node scripts/ensure-local-demo-data.cjs
cd pandittalk-website && npm run test:local-replica && cd ..
curl --fail 'http://localhost:3001/socket.io/?EIO=4&transport=polling'
```

Use the local demo phones from `TEST_OTP_PHONE_ALLOWLIST` with OTP `1234`, then
show the browser clients. Exchange a chat message, reconnect one client, and
show that the message history and session state return. Explain that the
message/room coordination uses Redis and that Caddy does not require sticky
sessions. Do not run `docker compose down` during the presentation.

## Architecture answers to prepare

- PostgreSQL stores durable users, bookings, and application data.
- Redis stores ephemeral state, rate limits, Socket.IO fan-out, and distributed
  locks so any API replica can handle the next request.
- DynamoDB Local is retained for the current chat-history adapter and can be
  replaced by the managed AWS service later.
- Caddy is the only exposed local service; it upgrades WebSockets and balances
  API replicas.
- The tunnel exposes HTTPS/WSS to Vercel and physical devices. Localhost must
  never be placed in a physical mobile build.
- TURN is optional infrastructure. It does not create signaling or media by
  itself; the current media clients use the Chime meeting/attendee contract.
- PostgreSQL and named Docker volumes survive a container restart. Use the
  backup command in the root README before destructive maintenance.

## Exact handoff after the project is graded

On Kali: `git clone <repo>`, copy `.env.example` to `.env`, set the tunnel and
origins, then run `docker compose up -d --build`. In Vercel, set the website and
dashboard API variables to the same HTTPS tunnel URL and redeploy. In the Expo
dev-client/EAS environment, set `EXPO_PUBLIC_API_BASE` to that URL. Finally,
verify the live health endpoint, Socket.IO handshake, chat, and—only if a media
provider is configured—audio/video from two clients.
