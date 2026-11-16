# Production operations and verification

Date: 16 November 2026

## Current verification after the timed-booking parity changes

- An earlier read-only check returned HTTP 200 for the `legacy_timed` catalogue, scheduled Audio and Chat Now quote routes, and an unauthenticated empty expert directory.
- Latest recheck: the website returns HTTP 200, but `https://pandittalk-load-balancer.admininfo-6d6.workers.dev/booking-catalog` and `https://www.pandittalk.com/api/backend/booking-catalog` return HTTP 503 with `No healthy backends available`.
- Because the backend is unhealthy, wallet, bookings, payment, authenticated booking, timer, cancellation, refund and recovery paths were not retried.
- The ECS deployment workflow still fails at AWS OIDC role assumption (`sts:AssumeRoleWithWebIdentity`), so restoring healthy tasks, a repeatable deployment path and authenticated staging verification remain release gates.

## Website hosting checklist

The Next.js server-side proxy requires one of these production variables, with `BACKEND_URL` preferred:

```text
BACKEND_URL=https://pandittalk-load-balancer.admininfo-6d6.workers.dev
```

If the hosting project is connected to GitHub through a team-owned Vercel project, the deploying GitHub/Vercel account must have access to that team. A failed Vercel preview or invitation link does not indicate an ECS backend failure.

After granting access or setting the variable, redeploy the website and verify:

```text
https://pandittalk.com/api/backend/experts
```

The unauthenticated directory request should return HTTP 200 and a JSON array. Protected customer requests should return HTTP 401 until a valid session is supplied.

## Product release guard

New website bookings must use the app's timed model through the backend catalogue, quote, availability, wallet and booking services. The public catalogue and quote routes must be reachable before claiming full booking parity, followed by authenticated scheduled and Chat Now exercises in staging/test mode covering payment, timer, cancellation, refund and recovery. Existing bookings retain their stored duration, price and session terms. A missing catalogue/quote route is a deployment failure, not a reason to restore retired copy or duplicate prices in the website.

## Rollback

Use the ECS task-definition revision recorded by the deployment workflow to roll the backend back if health checks fail. For the website, redeploy the previous successful Vercel deployment after confirming the backend remains healthy.
