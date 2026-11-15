# Pandit Talk website implementation evidence

Date: 10 September 2026

## Implemented

- Restored the reviewed Next.js App Router website revision from commit `ae8fba3217f79e9a89d0d1c10783a1e8de15b9d2` without overwriting current user files.
- Added shared warm editorial shell, accessible navigation, public footer, mobile menu and responsive 360px-friendly layout.
- Added required home hierarchy: “Traditional Wisdom + Real Pandits + Modern Technology”, “No Timer. Just Resolution.”, Hindi and English supporting copy, “You Talk. We Stay.” and story-continuity section.
- Added public Pandit discovery/detail, guidance hub/topic flow, free tools, articles/authors preservation, approach/about, how-it-works, pricing, trust, editorial, accessibility, help/contact, for-Pandits and download routes.
- Added private route shells for bookings/history/review, chat/audio/video session screens, wallet/history, reports, notifications, profile/account/deletion and story controls.
- Added durable backend contracts for private saved contexts (versioned edit/delete, explicit booking/Pandit sharing and customer/Pandit read access), notification preferences, phone-change challenges, support requests and Pandit applications. The customer UI now calls these contracts instead of presenting local-only or disabled controls.
- Added the persisted `sessionModel` booking field and an explicit disabled-by-default No Timer gate. Legacy bookings retain their stored timed terms; No Timer is never silently substituted.
- Added secure browser auth adapter: encrypted HTTP-only cookie, OTP/social routes, refresh rotation, safe internal return paths, origin checks and server-only refresh token handling.
- Added strict same-origin backend proxy with path allowlist, sensitive query exclusion, private no-store responses, server authorization forwarding, payload limits and redacted error states.
- Added strict contract tests for safe redirects, endpoint allowlists, origin checks, phone normalization, booking lifecycle, calendar privacy, session event names and no-timer purchase gating.
- Upgraded Next.js to 15.5.25, the August 2026 maintenance release; AVIF optimization remains disabled by the patched release. See the official security release: https://nextjs.org/blog/august-2026-security-release.

## Verification

- `npx tsc --noEmit` — pass.
- `npm run lint` — pass with nine non-blocking warnings for existing raw images, one unused directive and one media hook dependency; no errors.
- `npx tsx --test tests/contracts/*.test.ts` — 9 pass, 0 fail.
- `npm run build` — pass; 67 routes generated.
- Backend `npm run build:user-service` — pass.
- Backend `npm test` — 66 tests pass after adding the missing test providers to the existing controller health spec.
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
- D11 No Timer has an explicit persisted model and disabled-by-default policy gate, but the actual duration-free queue, WebRTC session TTL, fair-use/capacity rules, completion semantics and approved pricing are not yet supplied. The website blocks new No Timer creation with an explicit no-charge response; it does not hide a legacy timer or silently fall back to timed pricing. Existing legacy bookings remain readable/resumable under their stored terms.

## Release gate

This is a reviewable local/staging implementation, not a production deployment. Paid and session-dependent customer mutations remain disabled until the owners deliver and test the contracts above. No production policy, payment, booking, media, or saved-data success is simulated.
