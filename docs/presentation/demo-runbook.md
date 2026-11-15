# PanditTalk presentation and live-demo runbook

This runbook is designed for a 12–15 minute presentation by the two-person
team: the user and Aman Singh. It keeps the application simple and spends the
time on the Docker, CI/CD, stateless runtime, and deployment decisions that are
being graded.

## Before the presentation

1. On Kali, clone the repository and copy the real ignored `.env` securely.
2. Confirm Supabase, Redis Cloud, MongoDB Atlas, Cloudinary, MSG91, Razorpay,
   TURN, and `ALLOW_TEST_OTP=false` are configured. Set `ALLOWED_ORIGINS` to
   the deployed website/dashboard origins.
3. Start the stack and verify health:

   ```bash
   docker compose up -d --build
   docker compose ps
   cd pandittalk-website && npm run test:local-api && cd ..
   curl --fail http://localhost:3001/
   curl --fail http://localhost:3001/readiness
   curl --fail 'http://localhost:3001/socket.io/?EIO=4&transport=polling'
   ```

   For a disposable demo fixture, use the explicit local override described in
   the root README. Never enable the fixed demo OTP on the production managed
   runtime.

4. Have the GitHub Actions run open in one browser tab and the Vercel website,
   dashboard, and mobile dev client ready in the others.
5. If audio/video is part of the live demonstration, use the local WebRTC
   session with a confirmed booking and grant microphone/camera access in both
   clients. The default path uses free STUN; start the optional coturn profile
   only if the network requires relay connectivity.

For the external rehearsal, start a tunnel after Compose is healthy:

```bash
cloudflared tunnel --url http://127.0.0.1:3001
```

Copy its HTTPS origin into the Vercel API/Socket variables, `ALLOWED_ORIGINS`,
and `EXPO_PUBLIC_API_BASE`. Use the same origin for website and dashboard. Keep
the TURN endpoint separate because an HTTP tunnel only carries HTTPS/WSS
signaling and API traffic.

## Suggested timing and speaking ownership

| Time | Speaker | Content | Evidence |
| --- | --- | --- | --- |
| 0:00–1:30 | User | Problem, users, and the four clients | Website, dashboard, mobile, backend folder layout |
| 1:30–4:00 | Aman Singh | System design and managed runtime | Supabase PostgreSQL source of truth, Redis Cloud shared state, MongoDB Atlas chat history, Caddy front door, optional TURN |
| 4:00–6:00 | User | Docker and stateless scaling | `docker compose ps`, private dependency ports, `--scale api=2`, health endpoint |
| 6:00–8:00 | Aman Singh | CI/CD and repository discipline | GitHub Actions push/PR checks, branch/PR history, secret hygiene, Docker build |
| 8:00–11:30 | User | Live application demonstration | Website route, Admin `/admin` route, Pandit `/dashboard` route, mobile route, text chat, responsive layout, error handling |
| 11:30–13:30 | Aman Singh | Deployment and failure plan | HTTPS tunnel to port 3001, Vercel env vars, Redis-backed replica behavior, backup/restart after power cut |
| 13:30–15:00 | Both | Questions and limitations | Explain provider credentials, TURN, scaling limits, and the AWS upgrade path |

## Live command sequence

Run these in order for the managed production runtime, keeping the output visible:

```bash
docker compose ps
curl --fail http://localhost:3001/
curl --fail http://localhost:3001/readiness
docker compose up -d --scale api=2 --no-recreate api proxy
docker compose ps
cd pandittalk-website && npm run test:local-api && cd ..
cd pandittalk-website && npm run test:local-replica && cd ..
curl --fail 'http://localhost:3001/socket.io/?EIO=4&transport=polling'
```

The local API smoke also calls `/auth/me`, every read-only `/admin/*` endpoint,
the booking status mutation, and verifies that a customer token receives 403
from `/admin/overview`.

Use real test accounts and provider flows, then show the browser clients.
Exchange a chat message, reconnect one client, and show that the message
history and session state return. Explain that the message/room coordination
uses Redis Cloud and that Caddy does not require sticky sessions. Do not run
`docker compose down` during the presentation.

## Architecture answers to prepare

- PostgreSQL stores durable users, bookings, and application data.
- Redis stores ephemeral state, rate limits, Socket.IO fan-out, and distributed
  locks so any API replica can handle the next request.
- MongoDB Atlas stores chat history in the production runtime.
- Caddy is the only exposed local service; it upgrades WebSockets and balances
  API replicas.
- Admin authorization is enforced in the API guard and reloaded from
  PostgreSQL; the dashboard role is only a routing hint and cannot grant
  access. The Admin workspace is available at `/admin` and the Pandit workspace
  at `/dashboard`.
- The tunnel exposes HTTPS/WSS to Vercel and physical devices. Localhost must
  never be placed in a physical mobile build.
- WebRTC signaling runs through Socket.IO/Redis on the stateless API replicas;
  media is peer-to-peer where possible. Free public STUN is the default, and
  coturn is an optional self-hosted relay for restrictive networks.
- Docker owns only media and Caddy configuration volumes in production. Use
  Supabase and MongoDB Atlas managed backup/export tools before maintenance.

## Exact handoff after the project is graded

On Kali: `git clone <repo>`, copy the real `.env` securely, configure the tunnel
and origins, then run `docker compose up -d --build`. In Vercel, set the website and
dashboard API variables to the same HTTPS tunnel URL and redeploy. In the Expo
dev-client/EAS environment, set `EXPO_PUBLIC_API_BASE` to that URL. Finally,
verify the live health endpoint, Socket.IO handshake, chat, and audio/video from
two clients. For mobile, use a custom Expo dev client because react-native-webrtc
is a native module.
