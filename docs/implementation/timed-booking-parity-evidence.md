# Timed booking parity evidence

Date: 16 November 2026

## Local implementation evidence

- Backend catalogue and quote contract: `pandittalk-backend/apps/user-service/src/bookings/booking-catalog.ts` and `booking-catalog.controller.ts`.
- Scheduled and Chat Now booking creation use the shared backend catalogue; the website does not submit price, coin or duration fields.
- Scheduled offers are Audio and Video only, matching the app; Chat is retained for existing records and created only through the Chat Now endpoint.
- Website flow: `pandittalk-website/src/features/bookings/BookingFlow.tsx`.
- Session countdown rendering consumes server lifecycle/time-remaining events in the chat and media rooms.
- Existing booking detail actions preserve stored terms; rescheduling uses live slots and server eligibility.

## Verification run

| Area | Evidence | Result |
| --- | --- | --- |
| Backend rules | `npm test -- --runInBand` in `pandittalk-backend` | 39 suites / 167 tests passed |
| Backend types | `npm run typecheck` in `pandittalk-backend` | Passed |
| Website contracts | `npm test` in `pandittalk-website` | 24 tests passed |
| Website types/lint | `npx tsc --noEmit`; `npm run lint` | Typecheck passed; lint 0 errors, existing warnings only |
| Website build | `npm run build` | 66 routes generated |
| Responsive browser checks | production build at 320, 360, 375, 390, 414, 768, 1024, 1280, 1366, 1440 and 1920 widths | Representative layouts and focused hierarchy checks passed |
| Booking UI | Playwright scheduled audio and Chat Now fixtures | Both paths passed with backend-sourced quotes and no client price fields |

## Live read-only evidence

On 16 November 2026, the public catalogue and quote routes returned HTTP 200:

- `https://pandittalk-load-balancer.admininfo-6d6.workers.dev/booking-catalog`
- `https://www.pandittalk.com/api/backend/booking-catalog`
- `https://www.pandittalk.com/api/backend/booking-catalog/quote?depth=entry&format=audio`
- `https://www.pandittalk.com/api/backend/booking-catalog/quote?mode=chat-now`

The protected wallet and bookings routes returned HTTP 401 without a session. The public expert list returned HTTP 200 with no available expert records, so no live booking mutation, wallet charge, refund, or destructive test was attempted.

## Release prerequisites

1. Repair the ECS deployment role's AWS OIDC trust/permission configuration and record a successful backend deployment.
2. Verify the deployed routes return the app-aligned catalogue and quote values, then verify one authenticated scheduled booking and one authenticated Chat Now path in staging/test mode.
3. Verify cancellation, timer, timeout/refund, disconnect/rejoin and recovery behavior against the app before production enablement.
4. Preserve existing booking records under their persisted terms and confirm rollback keeps the same API compatibility.
