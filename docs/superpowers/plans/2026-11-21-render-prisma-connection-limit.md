# Render Prisma Connection Limit Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Render backend start reliably when Supabase session-mode client capacity is exhausted.

**Architecture:** Keep Prisma migrations on `DIRECT_URL`, but route the running service through Supabase’s transaction pooler. Configure a deliberately small Prisma connection pool for the single Render web service so the service does not consume the database session limit during startup or normal traffic.

**Tech Stack:** NestJS, Prisma 6, PostgreSQL/Supabase, Jest, Render web service.

**Spec:** Render deployment logs for `dep-dc0ornp42hec73c305dg`.

## Global Constraints

- Preserve secrets; never print database credentials or tokens.
- Keep `Decisions.md` append-only.
- Preserve the existing local 3001/3002 service-port behavior.
- Do not change schema or application data behavior.

## Review Focus

- A missing or malformed `DATABASE_URL` must still fail clearly at Prisma initialization.
- Runtime and migration connection URLs must remain independently configurable.
- The Render process must not create a pool larger than the managed database can support.
- Local backend tests must not require a live database.
- The deployed service must bind to Render’s runtime `PORT` and remain healthy after the Prisma fix.

---

### Task 1: Add a regression test for the Prisma connection configuration

**Files:**
- Create: `pandittalk-backend/apps/user-service/src/prisma/prisma-config.spec.ts`
- Modify: `pandittalk-backend/apps/user-service/src/prisma/prisma.service.ts`

**Interfaces:**
- Produces a small, testable runtime URL normalizer used by `PrismaService`.

- [ ] **Step 1: Write the failing test**

  Assert that a Supabase pooler URL is normalized to transaction mode with `connection_limit=1`, `pool_timeout=20`, and `pgbouncer=true`, while unrelated query parameters are preserved.

- [ ] **Step 2: Run the focused test and verify it fails**

  Run: `npm test -- --runInBand apps/user-service/src/prisma/prisma-config.spec.ts`
  Expected: FAIL because the normalizer does not yet exist.

- [ ] **Step 3: Implement the minimal configuration helper**

  Add a pure helper that reads `DATABASE_URL`, changes only the pooler runtime settings, and leaves `DIRECT_URL` untouched for Prisma migrations. Construct `PrismaClient` with the normalized runtime datasource URL.

- [ ] **Step 4: Run the focused test and verify it passes**

  Run: `npm test -- --runInBand apps/user-service/src/prisma/prisma-config.spec.ts`
  Expected: PASS.

### Task 2: Align local and Render runtime configuration

**Files:**
- Modify: `.env`
- Modify: `pandittalk-backend/.env`
- Modify: `Decisions.md` (append only)

**Interfaces:**
- Consumes the Prisma runtime configuration from Task 1.

- [ ] **Step 1: Update only non-secret URL parameters**

  Change runtime `DATABASE_URL` pooler settings to transaction mode with `connection_limit=1`; keep credentials and `DIRECT_URL` secret values unchanged unless Render’s direct URL is explicitly available.

- [ ] **Step 2: Run the full backend test suite and build**

  Run: `npm test -- --runInBand` and `npm run build` from `pandittalk-backend`.
  Expected: both commands exit with status 0.

- [ ] **Step 3: Append the decision record**

  Append the date, decision, reason, and impact without editing any previous `Decisions.md` content.

### Task 3: Redeploy and verify Render

**Files:**
- No source files.

- [ ] **Step 1: Apply the matching runtime environment values in Render**

  Update only the database runtime configuration, preserving secret values and the existing service-port settings.

- [ ] **Step 2: Trigger a new deployment**

  Deploy the current branch/commit from Render.

- [ ] **Step 3: Verify deployment logs and health**

  Confirm Prisma connects without `EMAXCONNSESSION`, the process stays running, and the public backend health endpoint responds successfully.

