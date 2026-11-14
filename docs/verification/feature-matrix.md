# PanditTalk verification matrix

This is the evidence record for the local-first runtime. A `Verified` row has a
repeatable command or observed local behavior. A `Partial` or `Pending` row is
deliberately not presented as complete; it names the exact remaining boundary.

| Feature ID | Application area | Journey / check | Command or setup | Expected result | Actual result / evidence | Status | Remaining issue |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RT-01 | Compose | Start the local stack | `Copy-Item .env.example .env; docker compose up -d --build; docker compose ps` | Postgres, Redis, DynamoDB Local, API, Pandit service, and proxy start | Local run shows healthy Postgres/Redis/DynamoDB and running API/Pandit/proxy containers | Verified | None for local startup |
| RT-02 | API | Liveness and dependency readiness through the reverse proxy | `Invoke-WebRequest http://localhost:3001/; Invoke-WebRequest http://localhost:3001/readiness` | Liveness returns 200 and readiness reports PostgreSQL, Redis, and DynamoDB as ready | Both HTTP checks returned 200 from the Caddy front door; `/readiness` reports all three dependency checks `ok` | Verified | None for local runtime |
| RT-03 | Database/cache | Dependency health | `docker compose exec -T redis redis-cli ping` and `docker compose exec -T postgres pg_isready -U pandittalk -d pandittalk` | `PONG` and `accepting connections` | Both checks pass in the running Compose stack | Verified | None |
| RT-04 | WebSockets | Socket.IO handshake through Caddy | `Invoke-WebRequest 'http://localhost:3001/socket.io/?EIO=4&transport=polling'` | HTTP 200 Engine.IO handshake | HTTP 200 handshake observed; Caddy accepts upgrade-capable routing | Verified | Cross-client browser proof is in RT-08 |
| RT-05 | Stateless backend | Two API replicas behind the proxy | `docker compose up -d --scale api=2 --no-recreate api proxy; docker compose ps` | Both replicas remain healthy and traffic still reaches the proxy | Two API containers were healthy behind Caddy during the live Socket.IO test; Redis adapter and distributed locks are configured | Verified | Repeat once through the public tunnel on Kali |
| RT-19 | Kali operations | Bounded logs and optional TURN profile | `docker compose config --quiet; docker compose --profile webrtc config --quiet; docker compose --profile webrtc up -d turn; docker compose ps turn; docker compose stop turn` | Compose validates, TURN starts on TCP/UDP 3478, and service logs remain bounded | Base and `webrtc` Compose configs validated; coturn started and stopped successfully; every service uses Docker JSON logs capped at 10 MB with three files retained | Verified | Confirm public UDP/TURN reachability from Kali before real media testing |
| RT-06 | Website | Public route and production build | `Push-Location pandittalk-website; npm test; npm run build; Pop-Location` | Contract tests and Next build pass | Contract tests and production build pass | Verified | None for build/contract coverage |
| RT-07 | Website | Responsive public/customer journeys | `Push-Location pandittalk-website; npm run test:ui; Pop-Location` | Routes render at 320/375/390/412/768/1024/1280/1440/1920 widths without unintended overflow | All 138 browser cases pass locally, including customer journeys, mobile navigation, WCAG scans, reduced motion, keyboard/focus checks, and large-text mode | Verified | Re-run once against the public tunnel before presentation |
| RT-08 | Website + dashboard | Shared text chat across clients and replicas | Seed local demo data; verify both OTP accounts; scale API to two replicas; `Push-Location pandittalk-website; npm run test:local-replica; Pop-Location` | Messages reach both clients, a reconnect resumes Redis session state, and history reloads | WebSocket test through Caddy passed: customer and pandit started the same booking, exchanged `replica-chat-proof`, pandit reconnected, resumed session state, and reloaded one message from DynamoDB Local | Verified | Repeat once through the public tunnel on Kali; real browser media remains RT-14 |
| RT-09 | Dashboard | Build and responsive login shell | `Push-Location pandittalk-dashboard; npm run lint; npm run build; Pop-Location`; browser smoke at 320/768/1440 | Lint/build pass; login shell renders without horizontal overflow at 320/768/1440 widths | Lint/build pass; Playwright smoke reports equal document/viewport widths at 320, 768, and 1440 | Verified | Re-run once against the public tunnel before presentation |
| RT-10 | Dashboard | Booking, chat, audio/video controls, articles, notifications, profile | Seed local demo data; log in with dashboard OTP; visit every protected route at 1440px | Protected routes load, chat is usable, and media routes expose permission/error/reconnect/end states | Authenticated browser sweep passed for dashboard, clients, articles, performance, notifications, profile, chat, audio, and video routes. Chat showed the demo message; audio correctly reported the chat-format mismatch; video rendered its permission checklist. | Partial | Live audio/video still needs valid Chime credentials and a real browser/device; see RT-13/RT-14 |
| RT-17 | Local demo fixture | Repeatable customer + dashboard setup | `docker compose exec -T api node scripts/ensure-local-demo-data.cjs` | Deterministic local accounts and chat/audio/video bookings exist without production data | Script created the two allowlisted users plus confirmed chat, audio, and video bookings; no reviews or payments were fabricated | Verified | Do not run this fixture against production |
| RT-18 | Backend modules | Public, customer, and pandit read-path smoke | Seed local demo data; `Push-Location pandittalk-website; npm run test:local-api; Pop-Location` | Authenticated and public API modules respond through Caddy without AWS credentials | 27 checks passed across health/readiness, pandit service, config, experts, articles, profile, bookings, notifications, reports, wallet, tools, contexts, and pandit dashboard reads | Verified | Provider-backed writes and live Chime media remain separately gated by credentials |
| RT-20 | Media provider boundary | Audio/video route with local provider disabled | Authenticate the demo customer; `POST /sessions/audio/join` for `d1d7ccf5-08dc-45ea-9b16-0e7d04d8a003` and `POST /sessions/video/join` for `d1d7ccf5-08dc-45ea-9b16-0e7d04d8a004` | Local media routes fail fast with an actionable provider-unavailable response and never pretend to connect | Both endpoints returned HTTP 503 with the Chime credential message in under 25 ms after the dedicated-credential guard was added | Verified | Real audio/video remains RT-13/RT-14 and needs Chime credentials, TURN reachability, and browser/device clients |
| RT-11 | Mobile | App type safety and web-export route coverage | `Push-Location pandittalk-mobile; npm run typecheck; npm run test:webview-allowlist; npx expo export --platform web; Pop-Location` | Typecheck, allowlist tests, and export pass | Typecheck passes, 8 allowlist tests pass, and Expo exports 54 routes including chat/audio/video/tools/wallet/profile/settings | Verified | Native device permission/background checks remain manual |
| RT-12 | Mobile | Physical-device API and Socket.IO URL | Set `EXPO_PUBLIC_API_BASE=https://<tunnel-host>`; run a dev client on Android/iOS | Device reaches the same API and `/chat` namespace without localhost assumptions | Environment contract and URL handling are implemented; no attached physical device was available for this run | Pending external | Run on the Kali tunnel with one Android/iOS device |
| RT-13 | Mobile | Native audio/video | Use the Expo dev client and a valid booking; grant microphone/camera; join from mobile and dashboard/browser | Real Chime media, mute/camera, reconnect, foreground/background, and end-call behavior work | Native `expo-pandit-chime` wrappers and UI states are present; join cannot be verified without valid Chime credentials and a device | Pending external | Provide Chime credentials or finish the local WebRTC provider before demo day |
| RT-14 | Website + dashboard | Browser audio/video | Open `/sessions/<bookingId>/audio` or `/video`; grant permissions; join the same booking from the other client | Local/remote media, device denial, reconnect, mute/camera, end-call, and unsupported states are visible | Browser Chime integration and failure UI exist; live media join is not verified with blank Chime credentials | Pending external | Configure a media provider; TURN alone is not a media/signaling implementation |
| RT-15 | Security | Secret/file hygiene | `git ls-files` and `git check-ignore -v .env pandittalk-backend/.env pandittalk-dashboard/.env pandittalk-mobile/.env pandittalk-mobile/google-services.json pandittalk-mobile/credentials.json` | No real env/service/credential files are tracked; local files are ignored | No tracked secret files found; ignore rules resolve the listed local files | Verified | Rotate any credential that was ever exposed before using it again |
| RT-16 | CI/CD | Push and pull-request gates | Inspect `.github/workflows/ci.yml`; run the same commands locally | Install, test, backend typecheck/build, client lint/typecheck, browser, Compose, and secret-hygiene checks run without provider secrets | Workflow contains separate backend, website, dashboard, mobile, Compose, and hygiene jobs; backend Prisma/tests/typecheck/Nest build pass locally. Backend all-files ESLint still has unrelated legacy findings, so the workflow documents that limitation instead of hiding it | Partial | GitHub-hosted run must be observed after the branch is pushed; clean up legacy backend lint debt before making lint blocking |

## Aspect-ratio pass

Use Chromium device emulation and record a screenshot plus the result for each
client: 320x800, 375x812, 390x844, 412x915, 768x1024, 1024x768, 1280x800,
1440x900, and 1920x1080. Check horizontal overflow, focus order, keyboard
navigation, readable error states, permission prompts, and touch targets. The
website currently has automated coverage for the public/customer routes; the
dashboard and native mobile rows still need the manual pass listed above.

## Replica smoke test

```powershell
docker compose up -d
docker compose up -d --scale api=2 --no-recreate api proxy
docker compose ps
docker compose exec -T api node scripts/ensure-local-demo-data.cjs
Push-Location pandittalk-website; npm run test:local-replica; Pop-Location
Invoke-WebRequest http://localhost:3001/
Invoke-WebRequest 'http://localhost:3001/socket.io/?EIO=4&transport=polling'
```

The repeatable local proof uses the customer phone `+919999999998`, the
dashboard phone `+919999999997`, OTP `1234`, and booking
`d1d7ccf5-08dc-45ea-9b16-0e7d04d8a002`. Keep both authenticated clients
connected to that chat room while running the scale command. The Socket.IO
Redis adapter, Redis-backed timer/notification locks, and DynamoDB Local chat
history are the evidence that the API does not depend on sticky sessions.
Repeat the same proof through the public tunnel on Kali before presenting the
deployment as externally verified.
