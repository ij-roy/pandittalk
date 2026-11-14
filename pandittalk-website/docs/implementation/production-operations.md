# Production operations and verification

Date: 10 September 2026

## Verified after the customer website and backend merges

- The backend deployment workflow completed successfully.
- The Prisma migration ran as an ECS one-off task and exited with code 0.
- ECS task definition 14 reached steady state with one running task.
- `https://api.pandittalk.com/` returned the user-service health payload with HTTP 200.
- The production API returned HTTP 401 for protected endpoints when no session was supplied.
- `https://pandittalk.com/` returned HTTP 200 and contained the required No Timer homepage messaging.

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

New No Timer bookings remain disabled until the approved scope, pricing, fair-use, completion, follow-up and media lifecycle policies are implemented. Existing bookings retain their stored terms. This is an intentional service guard, not a deployment failure.

## Rollback

Use the ECS task-definition revision recorded by the deployment workflow to roll the backend back if health checks fail. For the website, redeploy the previous successful Vercel deployment after confirming the backend remains healthy.
