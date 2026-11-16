# Production operations and verification

Date: 10 September 2026

## Verified after the customer website and backend merges

- The backend deployment workflow completed successfully.
- The Prisma migration ran as an ECS one-off task and exited with code 0.
- ECS task definition 14 reached steady state with one running task.
- `https://api.pandittalk.com/` returned the user-service health payload with HTTP 200.
- The production API returned HTTP 401 for protected endpoints when no session was supplied.
- The current timed-booking parity implementation is verified locally, but production availability is not claimed until the deployed backend exposes the catalogue and quote routes and an authenticated staging booking is verified.

## Website hosting checklist

The Next.js server-side proxy requires one of these production variables, with `BACKEND_URL` preferred:

```text
BACKEND_URL=https://api.pandittalk.com
```

If the hosting project is connected to GitHub through a team-owned Vercel project, the deploying GitHub/Vercel account must have access to that team. A failed Vercel preview or invitation link does not indicate an ECS backend failure.

After granting access or setting the variable, redeploy the website and verify:

```text
https://pandittalk.com/api/backend/experts
```

The unauthenticated directory request should return HTTP 200 and a JSON array. Protected customer requests should return HTTP 401 until a valid session is supplied.

## Product release guard

New website bookings must use the app's timed model through the backend catalogue, quote, availability, wallet and booking services. Do not enable the website entry points until `GET /booking-catalog`, `GET /booking-catalog/quote`, scheduled creation and Chat Now creation are deployed and verified. Existing bookings retain their stored duration, price and session terms. A missing catalogue/quote route is a deployment failure, not a reason to restore No Timer copy or duplicate prices in the website.

## Rollback

Use the ECS task-definition revision recorded by the deployment workflow to roll the backend back if health checks fail. For the website, redeploy the previous successful Vercel deployment after confirming the backend remains healthy.
