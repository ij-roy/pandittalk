# Role-Based Pandit and Admin Dashboard Design

## Goal

Keep the existing Pandit workspace working while adding a real, server-authorized Admin workspace to the independently deployable dashboard and backend.

## Context and constraints

The current dashboard authenticates only linked Pandit accounts. The Prisma `User` model has no role field, and the dashboard store, routes, and API helpers assume Pandit identity. The managed Docker runtime, Redis-backed sessions, and existing Pandit UI must remain unchanged for Pandit users. The admin surface must work without AWS credentials and must not rely on client-side role checks alone.

This design uses the existing OTP/session flow and the same Vite dashboard deployment. It does not introduce a second frontend, a new identity provider, or a production user-management system beyond the required role and permission boundary.

## Options considered

1. **Role-based dual workspace (selected):** preserve Pandit routes and add Admin routes selected from the authenticated role. This minimizes regression risk and satisfies both the current dashboard behavior and the admin requirements.
2. **Admin-only dashboard:** replace the Pandit workspace. This would simplify the new UI but remove already-implemented Pandit functionality and violate the requirement that the current mobile/website-to-Pandit workflow continue working.
3. **Separate admin application:** create another Vercel project and duplicate authentication/configuration. This adds deployment and maintenance overhead without improving the local runtime.

## Architecture

### Roles and durable data

Add a Prisma `UserRole` enum with `CUSTOMER`, `PANDIT`, and `ADMIN` values. Add `User.role` with a `CUSTOMER` default so existing rows and customer OTP login remain valid. The existing `Pandit` relation continues to describe expert-specific data; a `PANDIT` role is assigned only to users with a linked Pandit record, and the server rejects inconsistent dashboard access.

Create an idempotent migration and update the local seed/demo script with one admin user using a dedicated allowlisted test phone. The allowlist is enabled only when local test OTP mode is enabled and is never treated as production authorization.

### Authentication and authorization

Include the role in the JWT payload and authenticated-user response. Dashboard OTP login accepts either an active linked Pandit or an active Admin. Add a reusable server-side admin guard/decorator for Admin-only HTTP handlers. The guard reads the verified JWT role and, for defense in depth, loads the active user before privileged mutations. An unauthenticated request returns 401; a non-admin request returns 403.

Admin APIs live under `/admin` and use the existing NestJS service/module structure. They expose only the management data needed by the dashboard: user and Pandit listings, booking/session visibility and status updates, article/content management, notification management, wallet/transaction visibility, reports, and Pandit applications. Mutations validate IDs, allowed status transitions, and request bodies before writing PostgreSQL data. No admin decision is made from localStorage or a client-provided role.

### Dashboard routing and UI

Keep the existing Pandit store and routes. Add a small role-aware auth state that stores the server-issued user role in memory, bootstraps through the existing refresh-cookie flow, and clears all local identity state on logout. After dashboard OTP verification, route Admin users to `/admin` and Pandit users to `/dashboard`.

Add an Admin shell with responsive navigation and focused pages for overview, users, Pandits/applications, bookings, content, notifications, transactions, and reports. Each page has loading, empty, API-error, and unauthorized states. The existing Pandit shell remains the default for Pandit users. A role-aware protected route redirects a Pandit away from `/admin` and an Admin away from Pandit-only mutation pages unless the page is explicitly read-only/shared.

### Local demo flow

The local fixture creates:

- Customer: `+919999999998`
- Pandit: `+919999999997`
- Admin: `+919999999996`
- OTP: `1234` only for the configured local allowlist

The README and verification matrix will document the admin demo login and clearly label it as local-only.

## Error and security behavior

- Missing/expired access token: HTTP 401 and dashboard login redirect.
- Valid customer or Pandit token on an Admin endpoint: HTTP 403 with a non-sensitive message.
- Inactive admin: HTTP 401 after the server-side active-user check.
- Invalid IDs, unsupported status transitions, or malformed bodies: HTTP 400 with field-level validation details.
- API/network failure in the dashboard: visible retryable error state; no optimistic success message.
- Admin role is never accepted from URL parameters, localStorage, request bodies, or an unverified JWT.
- Demo admin OTP is disabled unless local test OTP mode and the explicit allowlist are configured.

## Testing and evidence

Backend tests will cover role persistence, JWT role claims, Admin login, 401/403 enforcement, admin reads, validated mutations, and Pandit regression. Dashboard tests/smoke checks will cover Admin login, each protected Admin route, unauthorized redirect, loading/error/empty states, and all required viewport sizes. The local API smoke script will exercise Admin endpoints through Caddy, and the feature matrix will record the exact commands and results. CI will run the existing backend/dashboard gates plus the new tests.

## Rollout and deployment

The migration runs through the existing API container startup path. Docker Compose, Redis, Caddy, Vercel configuration, and mobile API URLs do not change. The Admin dashboard remains deployable as the existing independent Vercel dashboard project. No real admin credential, service file, or external provider secret is committed.

