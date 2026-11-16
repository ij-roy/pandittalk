# Pandit Talk website implementation evidence

Date: 10 September 2026

## Implemented

- Restored the reviewed Next.js App Router website revision from commit `ae8fba3217f79e9a89d0d1c10783a1e8de15b9d2` without overwriting current user files.
- Added shared warm editorial shell, accessible navigation, public footer, mobile menu and responsive 360px-friendly layout.
- Added the timed-booking home hierarchy: clear exploration first, scheduled-session and Chat Now availability, transparent duration/total before confirmation, and an optional private-note explanation.
- Added public Pandit discovery/detail, guidance hub/topic flow, free tools, articles/authors preservation, approach/about, how-it-works, pricing, trust, editorial, accessibility, help/contact, for-Pandits and download routes.
- Added private route shells for bookings/history/review, chat/audio/video session screens, wallet/history, reports, notifications, profile/account/deletion and story controls.
- Added durable backend contracts for private saved contexts (versioned edit/delete, explicit booking/Pandit sharing and customer/Pandit read access), notification preferences, phone-change challenges, support requests and Pandit applications. The customer UI now calls these contracts instead of presenting local-only or disabled controls.
- Added a shared `legacy_timed` catalogue/quote contract for scheduled and Chat Now bookings. Existing bookings retain their stored timed terms; a new `no_timer` request remains rejected and is never silently substituted.
- Added secure browser auth adapter: encrypted HTTP-only cookie, OTP/social routes, refresh rotation, safe internal return paths, origin checks and server-only refresh token handling.
- Added strict same-origin backend proxy with path allowlist, sensitive query exclusion, private no-store responses, server authorization forwarding, payload limits and redacted error states.
- Added strict contract tests for safe redirects, endpoint allowlists, origin checks, phone normalization, booking lifecycle, calendar privacy, session event names, server timer formatting and backend-owned booking quotes.
- Upgraded Next.js to 15.5.25, the August 2026 maintenance release; AVIF optimization remains disabled by the patched release. See the official security release: https://nextjs.org/blog/august-2026-security-release.

## Verification

- `npx tsc --noEmit` — pass.
- `npm run lint` — pass with nine non-blocking warnings for existing raw images, one unused directive and one media hook dependency; no errors.
- `npm test` — 19 contract tests pass, 0 fail.
- `npm run build` — pass; 66 routes generated.
- Backend `npm run typecheck` — pass.
- Backend `npm test -- --runInBand` — 38 suites / 169 tests pass.
- Browser smoke target: run `npm run dev`, visit `/`, `/pandits`, `/guidance`, `/tools`, `/login`, `/help`, then verify at 360px and 390px widths with keyboard focus. The build output confirms all routes compile; live backend routes remain environment-dependent.

## Backend dependencies and blockers

- D01 browser OAuth credentials and redirect origins must be configured for Google/Apple.
- D02/D03 approved commercial catalogue, taxes, entitlement scope, idempotent purchase verification and staging Razorpay keys are required before enabling recharge.
- D04 browser WebRTC interoperability with the Pandit dashboard, WSS/CORS and short-lived session bootstrap must be verified through the public tunnel before enabling the live production link. Local two-peer audio/video signaling is verified.
- D05 server notification preferences are now present and the account UI persists them. A real outbound delivery provider and per-channel operational policy still require staging configuration.
- D06 durable support/practitioner application intake is now present in the user-service database. Support operations still need a dashboard/work queue and notification routing.
- D07 verified phone-change flow is now present (SMS challenge, attempt limits, session revocation). SMS credentials/templates and staging verification remain manual.
- D08 retention/export/consent owner decisions are required before publishing stronger privacy claims.
- D10 private saved-context persistence, edit/delete, per-booking recipient sharing and practitioner access control are implemented in the user-service contract and customer UI. Retention/export policy and practitioner dashboard presentation still require owner decisions.
- D11 timed booking parity is implemented locally: the backend catalogue/quote owns scheduled depth/format prices, Chat Now rules, availability, timer, cancellation and refund behavior; the website consumes those contracts and preserves existing booking terms. Production deployment of the new catalogue/quote routes and authenticated staging verification remain required.

## Release gate

This is a reviewable local/staging implementation, not a production deployment. The live backend currently returns 404 for the new catalogue/quote routes, so production web booking is not claimed. No production policy, payment, booking, media, or saved-data success is simulated.
