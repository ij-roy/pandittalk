# Managed Runtime Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the production backend use Supabase PostgreSQL, Redis Cloud, MongoDB Atlas, and Cloudinary without starting obsolete local database services, while preserving an explicit local-only Compose path for CI and offline development.

**Architecture:** The root `docker-compose.yml` becomes the managed production runtime and starts only the API, Pandit service, Caddy proxy, and optional TURN service. A separate `docker-compose.local.yml` supplies local PostgreSQL, Redis, and MongoDB only when explicitly selected for CI or isolated demos. Clients and the Worker keep using the stable Worker hostname.

**Tech Stack:** Docker Compose, NestJS, Prisma, Supabase PostgreSQL, Redis Cloud, MongoDB Atlas, Cloudinary, Cloudflare Worker, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-15-managed-services-mongo-worker-design.md` and the current production requirement to remove unused local service assumptions.

## Global Constraints

- Supabase PostgreSQL is the durable business-data source of truth.
- Redis Cloud is the shared cache, OTP, lock, queue, and Socket.IO state store.
- MongoDB Atlas is the chat-history store.
- Cloudinary is the production avatar/media store.
- Real credentials stay in ignored `.env` files or hosting secret stores.
- Production clients use only `https://pandittalk-load-balancer.admininfo-6d6.workers.dev`.
- Local fallback services must be opt-in and must not be started by the production command.

## Review Focus

- Running `docker compose up -d --build` with managed credentials must not start local database containers.
- Running the explicit local override must still provide healthy Postgres, Redis, and MongoDB for CI/demo tests.
- Missing managed URLs must fail clearly rather than silently selecting local services in production.
- The API must use Cloudinary and secure cookies for the production environment.
- Documentation and CI commands must use the correct Compose file set and health checks.

---

### Task 1: Split managed production and local fallback Compose paths

**Files:**
- Modify: `docker-compose.yml`
- Create: `docker-compose.local.yml`
- Delete: `pandittalk-backend/docker-compose.yml` (obsolete duplicate with unused RabbitMQ)

- [ ] Remove Postgres, Redis, and MongoDB services, their data volumes, and their production `depends_on` entries from the root Compose file.
- [ ] Make the root API environment consume required managed URLs without local service defaults.
- [ ] Keep API, Pandit service, Caddy, logging, media volume, and optional coturn in the root Compose file.
- [ ] Add `docker-compose.local.yml` with local Postgres, Redis, and MongoDB healthchecks and explicit API overrides for local URLs and local avatar storage.
- [ ] Validate both `docker compose config --quiet` and the merged local configuration.

### Task 2: Align environment templates and production local secrets

**Files:**
- Modify: `.env.example`
- Modify: `pandittalk-backend/.env.example`
- Modify: `pandittalk-backend/.env` (ignored local runtime file)

- [ ] Remove obsolete local database credentials from the managed root template and document the required Supabase pooler/direct URLs, Redis Cloud URL, MongoDB Atlas URI, and Cloudinary settings.
- [ ] Make the backend template managed-first and mark host/port fallbacks as local-only override values.
- [ ] Set the actual backend direct-run environment to Cloudinary storage, production cookie settings, and the same managed services already used by Docker.
- [ ] Do not expose any real secret in tracked files or output.

### Task 3: Update CI, runbooks, and verification evidence

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`
- Modify: `docs/presentation/demo-runbook.md`
- Modify: `docs/verification/feature-matrix.md`
- Modify: `pandittalk-backend/BACKEND_PROGRESS_SUMMARY.md`

- [ ] Change local/CI startup commands to use `-f docker-compose.yml -f docker-compose.local.yml`.
- [ ] Change production/Kali instructions to use the managed root Compose file only.
- [ ] Remove claims that production starts or depends on local Postgres, Redis, MongoDB, or RabbitMQ.
- [ ] Document that managed health checks are authoritative and that local service checks belong only to the local override.

### Task 4: Verify and publish the aligned project

- [ ] Run Compose validation for managed and local configurations.
- [ ] Run Worker tests, backend tests/typecheck/build, and relevant client checks.
- [ ] Start the managed Compose path using the existing ignored `.env`, verify API host selection and `/readiness`.
- [ ] Start the local override in an isolated project name if needed, verify dependency health and Socket.IO smoke checks.
- [ ] Review staged files for secrets and stale local-service references.
- [ ] Commit and push the complete alignment to GitHub `main`.
