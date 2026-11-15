# Role-Based Pandit and Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Preserve the current Pandit dashboard while adding a server-authorized Admin workspace with local demo login, protected management APIs, responsive pages, and evidence-backed tests.

**Architecture:** Add a durable UserRole enum to the existing Prisma user model. Put the role in the existing JWT/session flow, allow dashboard login for active linked Pandits or Admins, and protect /admin handlers with a reusable NestJS Admin guard. Keep the existing Vite dashboard deployment and route Admin and Pandit users to separate shells after the same OTP login.

**Tech Stack:** NestJS 11, Prisma 6/PostgreSQL, Redis-backed auth sessions, Jest, React 19, React Router, Zustand, Vite, TypeScript, Docker Compose, and Caddy.

---

### Task 1: Add the durable role model and local Admin fixture

Files:
- Modify: pandittalk-backend/apps/user-service/prisma/schema.prisma
- Create: pandittalk-backend/apps/user-service/prisma/migrations/20261115000000_add_user_role/migration.sql
- Create: pandittalk-backend/apps/user-service/src/auth/types/user-role.ts
- Modify: pandittalk-backend/apps/user-service/prisma/seed.ts
- Modify: pandittalk-backend/scripts/ensure-local-demo-data.cjs
- Modify: .env.example
- Modify: pandittalk-backend/.env.example
- Test: pandittalk-backend/apps/user-service/src/auth/role-model.spec.ts

- [ ] Write a failing role contract test asserting exactly CUSTOMER, PANDIT, and ADMIN.
- [ ] Add the Prisma UserRole enum and User.role UserRole @default(CUSTOMER).
- [ ] Add the migration that creates the enum and adds a non-null column with CUSTOMER as the database default.
- [ ] Export one shared TypeScript role contract and use it in JWT types and guards.
- [ ] Upsert the local Admin phone +919999999996 with role ADMIN in the seed and demo fixture.
- [ ] Add ADMIN_TEST_OTP_PHONE_ALLOWLIST=+919999999996 to environment examples. The application must only honor it when ALLOW_TEST_OTP=true.
- [ ] Run from pandittalk-backend: npm run prisma:generate; npm test -- --runInBand apps/user-service/src/auth/role-model.spec.ts; npm run typecheck.
- [ ] Commit as: git commit -m "feat: add user roles for admin access".

### Task 2: Make dashboard authentication role-aware and enforce Admin authorization

Files:
- Modify: pandittalk-backend/apps/user-service/src/auth/types/jwt-payload.ts
- Modify: pandittalk-backend/apps/user-service/src/auth/auth.service.ts
- Modify: pandittalk-backend/apps/user-service/src/auth/auth.controller.ts
- Modify: pandittalk-backend/apps/user-service/src/auth/jwt.strategy.ts
- Create: pandittalk-backend/apps/user-service/src/auth/decorators/roles.decorator.ts
- Create: pandittalk-backend/apps/user-service/src/auth/guards/roles.guard.ts
- Create: pandittalk-backend/apps/user-service/src/auth/guards/admin.guard.ts
- Modify: pandittalk-backend/apps/user-service/src/auth/auth.module.ts
- Create: pandittalk-backend/apps/user-service/src/auth/admin.guard.spec.ts
- Modify: pandittalk-backend/apps/user-service/src/auth/auth.service.spec.ts

- [ ] Add role to JwtPayload, AuthenticatedUser, and AuthUserPayload. Issue tokens using the persisted database role.
- [ ] Change dashboard OTP authorization to allow an active Admin or an active user with a linked Pandit relation. Continue rejecting unrelated customers.
- [ ] Add Roles(...roles) metadata and a RolesGuard that throws 403 for a valid token with an insufficient role.
- [ ] Add AdminGuard that composes JWT authentication, checks ADMIN, and reloads the active user from Prisma before allowing privileged access.
- [ ] Add GET /auth/me behind JwtAuthGuard. Return active user ID, role, phone, display name, and linked Pandit ID; never accept an ID or role from the request.
- [ ] Add tests for Admin dashboard login, customer rejection, AdminGuard 403, inactive-admin 401, and the unchanged Pandit path.
- [ ] Run from pandittalk-backend: npm test -- --runInBand apps/user-service/src/auth; npm run lint:check; npm run typecheck.
- [ ] Commit as: git commit -m "feat: enforce role-aware dashboard authentication".

### Task 3: Build protected Admin management APIs

Files:
- Create: pandittalk-backend/apps/user-service/src/admin/admin.module.ts
- Create: pandittalk-backend/apps/user-service/src/admin/admin.controller.ts
- Create: pandittalk-backend/apps/user-service/src/admin/admin.service.ts
- Create: pandittalk-backend/apps/user-service/src/admin/dto/admin-query.dto.ts
- Create: pandittalk-backend/apps/user-service/src/admin/dto/update-admin-booking.dto.ts
- Create: pandittalk-backend/apps/user-service/src/admin/admin.service.spec.ts
- Create: pandittalk-backend/apps/user-service/src/admin/admin.controller.spec.ts
- Modify: pandittalk-backend/apps/user-service/src/user-service.module.ts

- [ ] Write mocked-Prisma tests for paginated users, overview counts, booking status validation, unknown booking IDs, and the 403 boundary.
- [ ] Implement these Admin routes, all protected by AdminGuard: GET /admin/overview; GET /admin/users; GET /admin/pandits; GET /admin/bookings; PATCH /admin/bookings/:bookingId/status; GET /admin/applications; PATCH /admin/applications/:applicationId/status; GET /admin/articles; GET /admin/notifications; GET /admin/transactions; GET /admin/reports.
- [ ] Make AdminQueryDto validate search, role, status, format, page, and pageSize; transform numbers and cap pageSize at 50.
- [ ] Make UpdateAdminBookingDto accept only existing booking statuses and validate status transitions before writing.
- [ ] Select only safe fields. Never return OTP hashes, refresh tokens, provider credentials, or private secrets.
- [ ] Return { items, page, pageSize, total } for lists and a stable overview object for dashboard cards.
- [ ] Use PostgreSQL through the existing Prisma service and transactions for status mutations.
- [ ] Run from pandittalk-backend: npm test -- --runInBand apps/user-service/src/admin; npm run prisma:generate; npm run lint:check; npm run typecheck.
- [ ] Commit as: git commit -m "feat: add protected admin management APIs".

### Task 4: Add role-aware dashboard bootstrapping and Admin shell

Files:
- Modify: pandittalk-dashboard/src/store/usePanditStore.ts
- Create: pandittalk-dashboard/src/store/useDashboardAuthStore.ts
- Modify: pandittalk-dashboard/src/lib/api.ts
- Create: pandittalk-dashboard/src/lib/dashboardRouting.ts
- Modify: pandittalk-dashboard/src/pages/Login.tsx
- Modify: pandittalk-dashboard/src/App.tsx
- Modify: pandittalk-dashboard/src/components/ProtectedRoute.tsx
- Create: pandittalk-dashboard/src/components/AdminRoute.tsx
- Create: pandittalk-dashboard/src/components/AdminShell.tsx
- Create: pandittalk-dashboard/src/components/AdminShell.module.css
- Create: pandittalk-dashboard/src/lib/adminApi.ts
- Create: pandittalk-dashboard/src/types/admin.ts

- [ ] Write tests for routeForRole: ADMIN maps to /admin, PANDIT maps to /dashboard, and CUSTOMER maps to /login.
- [ ] Keep access tokens in memory. Store only server-issued user ID, role, and existing Pandit display metadata in the current safe local keys.
- [ ] Bootstrap through the existing refresh-cookie flow, then call GET /auth/me and set role from that server response.
- [ ] After OTP verification, navigate through routeForRole. Show the local Admin demo phone only in local-demo help text.
- [ ] Make AdminRoute wait for hydration, redirect unauthenticated users to /login, redirect non-admin users to /dashboard, and render an Outlet only for ADMIN.
- [ ] Keep ProtectedRoute behavior unchanged for Pandit routes.
- [ ] Add a responsive AdminShell with navigation for overview, users, Pandits, bookings, content, notifications, transactions, and reports; include mobile menu, focus styles, and logout.
- [ ] Run from pandittalk-dashboard: npm test -- --runInBand; npm run lint; npm run build.
- [ ] Commit as: git commit -m "feat: add role-aware dashboard routing".

### Task 5: Add Admin pages and connect them to the APIs

Files:
- Create: pandittalk-dashboard/src/pages/admin/AdminOverview.tsx
- Create: pandittalk-dashboard/src/pages/admin/AdminUsers.tsx
- Create: pandittalk-dashboard/src/pages/admin/AdminPandits.tsx
- Create: pandittalk-dashboard/src/pages/admin/AdminBookings.tsx
- Create: pandittalk-dashboard/src/pages/admin/AdminContent.tsx
- Create: pandittalk-dashboard/src/pages/admin/AdminNotifications.tsx
- Create: pandittalk-dashboard/src/pages/admin/AdminTransactions.tsx
- Create: pandittalk-dashboard/src/pages/admin/AdminReports.tsx
- Create: pandittalk-dashboard/src/pages/admin/admin.module.css
- Modify: pandittalk-dashboard/src/App.tsx
- Modify: pandittalk-dashboard/src/lib/adminApi.ts
- Test: pandittalk-dashboard/src/pages/admin/admin-pages.test.tsx

- [ ] Write tests for loading, populated, empty, API-error-with-retry, and unauthorized states.
- [ ] Implement overview cards from GET /admin/overview.
- [ ] Implement users and Pandits tables/cards with search, filters, pagination, and accessible labels. Include Pandit application status controls.
- [ ] Implement bookings with customer, Pandit, format, scheduled time, status, and validated status action.
- [ ] Implement read-only content, notifications, transactions, and reports pages with clear empty states.
- [ ] Register all Admin routes beneath AdminRoute and NotificationLayout.
- [ ] Collapse tables into cards below 768px, keep controls at least 44px high, and prevent horizontal overflow.
- [ ] Run from pandittalk-dashboard: npm test -- --runInBand; npm run lint; npm run build.
- [ ] Commit as: git commit -m "feat: add admin dashboard management pages".

### Task 6: Exercise the complete Admin flow locally and update evidence

Files:
- Modify: pandittalk-website/scripts/test-local-api.cjs
- Modify: README.md
- Modify: pandittalk-dashboard/README.md
- Modify: docs/presentation/demo-runbook.md
- Modify: docs/verification/feature-matrix.md
- Modify: .github/workflows/ci.yml

- [ ] Apply the migration and fixture:
  docker compose exec -T api npx prisma migrate deploy --schema apps/user-service/prisma/schema.prisma
  docker compose exec -T api node scripts/ensure-local-demo-data.cjs
- [ ] Extend the local API smoke to authenticate +919999999996 with OTP 1234, call /auth/me and every Admin read endpoint, update one fixture booking, and assert a customer token receives 403.
- [ ] Start the dashboard at http://localhost:5173 and use Chromium to log in as Admin, visit every Admin route, exercise search/filter/status update/error recovery, and verify the Pandit demo still reaches /dashboard.
- [ ] Repeat the Admin smoke at 320x568, 390x844, 768x1024, 1024x768, 1440x900, and 1920x1080 with zero horizontal overflow or page errors.
- [ ] Add the Admin unit/API checks to CI without requiring AWS or real provider credentials.
- [ ] Document local-only Admin credentials, the /admin API boundary, role routing, independent dashboard deployment, tunnel setup, and exact remaining external steps.
- [ ] Add verification-matrix rows for Admin login, Admin authorization, management pages, and Pandit regression.
- [ ] Run the full backend, dashboard, Compose, readiness, Redis, PostgreSQL, and secret-hygiene checks.
- [ ] Commit and push as: git commit -m "test: verify role-based admin workspace"; git push origin codex/local-first-runtime.

### Self-review checklist

- [ ] Existing rows default to CUSTOMER and Pandit users retain their routes.
- [ ] Every Admin endpoint uses server-side authorization.
- [ ] The dashboard never trusts a client-provided role.
- [ ] Local Admin OTP is restricted to explicit test configuration.
- [ ] Admin pages have loading, empty, error, unauthorized, and responsive states.
- [ ] Existing website, mobile, backend, and Compose checks remain in CI.
- [ ] No real credentials, generated output, or service files are committed.

