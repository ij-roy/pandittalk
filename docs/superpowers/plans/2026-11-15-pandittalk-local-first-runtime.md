# PanditTalk Local-First Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the PanditTalk website, dashboard, mobile app, and backend runnable locally with a stateless, Redis-backed, Dockerized runtime that is ready for Vercel plus a public tunnel.

**Architecture:** PostgreSQL stores durable data; Redis stores shared ephemeral state, queues, rate limits, and WebSocket adapter state; a reverse proxy fronts horizontally scalable backend replicas; local media storage remains behind a provider interface. AWS adapters remain optional and are not required for local startup.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Redis, Socket.IO/WebRTC, Next.js, Vite, Expo, Docker Compose, GitHub Actions.

**Spec:** `C:\Users\roybe\.codex\attachments\75e24a0d-c2f3-4bda-9ac4-95048ca70b16\goal-objective.md`

## Global Constraints

- No committed environment files, Firebase/Google service files, private keys, tokens, or generated build output.
- Backend state must be shared through PostgreSQL/Redis; no sticky-session dependency.
- Website, dashboard, and mobile must use environment-configured API/WebSocket URLs.
- Audio/video/chat must use real signaling and media behavior, not placeholders.
- Every task ends with an executable verification command and a focused commit.

## Review Focus

- Fresh clone with only `.env` configuration must start all local dependencies.
- Two backend replicas must share WebSocket rooms and session state.
- Browser and mobile clients must use the same real-time protocol.
- Local media and AWS media providers must remain swappable.
- Missing external credentials must produce safe demo behavior, not a startup crash.

### Task 1: Repair backend schema and generated client

**Files:**
- Modify: `pandittalk-backend/apps/user-service/prisma/schema.prisma`
- Test: Prisma generation and backend unit suite

- [ ] Remove the duplicate `Pandit.articles` relation only after reproducing the current `P1012` failure.
- [ ] Run `npm run prisma:generate` and the backend test suite.
- [ ] Commit the minimal schema repair.

### Task 2: Define the local runtime contract

**Files:**
- Create/modify: root `.env.example`, `docker-compose.yml`, `docker/` proxy configuration
- Modify: backend Docker/entrypoint/config files
- Test: Compose config validation and health checks

- [ ] Add PostgreSQL, Redis, backend, reverse proxy, and optional worker/media services.
- [ ] Add persistent volumes, health checks, restart policies, bounded logs, and service-network URLs.
- [ ] Make backend replicas scale behind the proxy with WebSocket upgrades.
- [ ] Document start/stop/migrate/reset/backup/recovery commands.

### Task 3: Make backend state replica-safe

**Files:**
- Modify: auth/session, OTP, rate-limit, presence, chat, notification, and WebSocket modules identified by runtime tracing
- Create: Redis adapters/utilities/tests where missing
- Test: unit, integration, and two-replica smoke tests

- [ ] Move process-local state to Redis or PostgreSQL.
- [ ] Add Socket.IO Redis adapter and graceful shutdown/reconnect handling.
- [ ] Prove two replicas share state without sticky sessions.

### Task 4: Local media and real-time web parity

**Files:**
- Modify: website session/chat components and API/socket clients
- Modify: backend signaling/call modules
- Test: browser-to-browser and browser/mobile call flows where devices permit

- [ ] Reuse the mobile signaling contract for browser chat/audio/video.
- [ ] Implement permission, connection, reconnect, failure, mute/camera, and end-call states.
- [ ] Configure STUN/TURN through environment variables and document tunnel limitations.

### Task 5: Dashboard/mobile/local URL integration

**Files:**
- Modify: dashboard and mobile environment/configuration files
- Modify: CORS and public URL configuration
- Test: dashboard smoke flows and mobile API/WebSocket startup

- [ ] Remove hardcoded localhost assumptions for physical mobile devices.
- [ ] Ensure dashboard and mobile use the same backend contract.
- [ ] Keep Firebase/Google service files local and ignored.

### Task 6: CI/CD and verification evidence

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `docs/verification/feature-matrix.md`
- Modify: project READMEs and root README

- [ ] Run install, lint, typecheck, tests, builds, Docker build, and Compose validation on push/PR.
- [ ] Add responsive/browser evidence for required aspect ratios.
- [ ] Document Vercel, tunnel, Kali, Redis, PostgreSQL, WebSocket, WebRTC, and recovery setup.
- [ ] Create presentation/demo runbook for the two-person team.

## Execution Order

Tasks must be executed in order. Do not mark the overall goal complete until every task has evidence or an explicitly documented external credential/device boundary.
