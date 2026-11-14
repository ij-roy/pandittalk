# PanditTalk verification matrix

This matrix is the evidence checklist for the local-first deployment. Automated checks run in `.github/workflows/ci.yml`; device and browser checks are manual because they require permissions, cameras, microphones, and a real tunnel.

| Area | Automated evidence | Manual local evidence |
| --- | --- | --- |
| Backend API | Backend Jest suite, Prisma generation, Nest build | `curl http://localhost:3001/` returns health JSON |
| PostgreSQL/Redis/DynamoDB | Compose health checks and runtime image build | `docker compose ps` shows healthy `postgres`, `redis`, and running `dynamodb` |
| WebSockets | Backend tests plus Socket.IO Redis adapter build | Open website and dashboard in separate browsers; chat/queue events arrive while scaling `api=2` |
| Website | Contract tests and Next production build | Test 320px, 375px, 768px, 1024px, and 1440px widths; sign-in, experts, booking, chat, audio, video, tools, articles, and account flows |
| Dashboard | TypeScript and Vite production build | Sign in, expert availability, booking queue, chat, audio/video session controls, notifications, and responsive table/card layouts |
| Mobile | WebView allowlist tests | Expo development client on Android/iOS; API calls, push registration, chat, audio, video, reconnect, background/foreground, and permissions |
| Media | Website event-contract tests | Browser-to-browser or browser-to-mobile microphone/camera flow through configured Chime credentials or a local WebRTC provider |
| Security | `.gitignore`, CI, and source contract checks | Confirm `.env`, service files, credentials, uploads, and build output remain untracked |

## Aspect-ratio pass

Use browser device emulation and record a screenshot plus the result for each: 320x800, 375x812, 412x915, 768x1024, 1024x768, 1280x800, and 1440x900. Check horizontal overflow, focus order, keyboard navigation, readable error states, and touch targets before calling a flow complete.

## Replica smoke test

```powershell
docker compose up -d
docker compose up -d --scale api=2 --no-recreate api proxy
docker compose ps
curl http://localhost:3001/
```

Keep two browser clients connected to the same chat room while running the scale command. The Socket.IO Redis adapter and Redis-backed timer/notification locks are the evidence that the API does not depend on sticky sessions.
