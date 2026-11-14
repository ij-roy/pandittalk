# Acceptance and release evidence

Maintain `docs/implementation/release-evidence.md` with requirement ID, exact test/manual scenario, environment, observed result, date and remaining issue. This planning packet does not claim these checks have run.

## Critical journeys

- **A01 / P01–P06:** Guest opens a guidance topic, chooses area/service-scope/video/Pandit, signs in, recharges, returns with private draft intact, selects slot and receives persisted confirmation with matching total/timezone.
- **A02 / P03/P07/P08:** Guest chooses an online Pandit, authenticates, starts instant chat, exchanges messages with the existing Pandit dashboard, reconnects without duplicate messages/charge, ends and reviews.
- **A03 / P07/P16:** Busy Pandit → queue → refresh → status retained → acceptance notification → same chat booking; leaving queue prevents later unintended start.
- **A04 / P09:** Scheduled browser audio: permission/preflight/wait/start/mute/leave/rejoin/end. No countdown or cutoff at the former minute threshold; server controls explicit completion and technical interruptions. Pandit-side disconnect produces only server-confirmed refund behavior.
- **A05 / P10:** Scheduled video with local/remote camera, camera off, device switch, dropped network and rejoin. Tracks stop after exit; no invisible microphone/camera capture continues.
- **A06 / P12:** Successful Razorpay test recharge, cancelled checkout, failed verification, delayed webhook, duplicate webhook, closed tab and return. Each order credits at most once; no lost successful payment or fabricated success.
- **A07 / P13:** Every free tool completes with valid fixture and staging input; invalid birth place/time or corrupt palm image returns an understandable error. Personal input never appears in location bar, public HTML cache, logs or analytics.
- **A08 / P14/P15:** Buy detailed Kundli, detailed compatibility and monthly report. Reopen from reports and the mobile app. Reload/retry does not create another charge. Failed paid generation has an explicit reconciled outcome.
- **A09 / P11/P16:** History, cancellation eligibility, confirmed refund, review submission, read/read-all and all notification destinations work for the owning user.
- **A10 / P02/P18:** Profile/avatar updates synchronize with app, social phone completion works, logout clears state, phone change follows verified flow, deletion follows policy and revokes access.
- **A11 / P17:** Existing article/author/legal links still work, unpublished content stays private and article CTA reaches the same guidance system.
- **A12 / P18:** Help/contact/application submission is durably received; failure never displays sent. Privacy/deletion/grievance contact is usable.

## Latest-review acceptance additions

- **A13 / First screen:** At desktop and 390 × 844 normal text size, confirm the Why Pandit Talk hierarchy, three-part value proposition, No Timer statement and primary CTA. At 360px and enlarged text verify no clipped/shrunken copy. Real portrait, restrained visual accents and no decorative countdown. Confirm dedicated No Timer and story-continuity sections precede directory/tool-heavy content.
- **A14 / D11:** For new chat/audio/video bookings, advance a controlled staging clock beyond the old 15/25/45-minute limits. Assert no sold-minute session termination, media teardown or extra debit, and no customer countdown. End remains available. Test explicit completion, interruption/rejoin, queue capacity and legacy-booking behavior separately. Changing an ID/model in the browser cannot alter charges or terms.
- **A15 / D10:** Save context on one device and read it on another. Edit/delete it, choose a note and recipient for a booking, then verify that only that Pandit receives the deliberately shared version. Start fresh on another booking and verify no prior context is attached. Test revocation and unrelated-user/Pandit access denial. No recording/transcription or fabricated practitioner memory may substitute for this flow.

## Money and authorization invariants

- Two competing bookings for one slot yield one confirmed occupancy and no unjustified second debit.
- Concurrent spending on app/web cannot make balance negative.
- Tampered package/price/user/Pandit/booking IDs are rejected server-side.
- Repeated verification/unlock/cancel/refund events never duplicate ledger effects.
- Another user cannot fetch a report, booking, transcript, notification, wallet or meeting credential by changing an ID.
- Socket room membership and message sender identity are server-authorized.
- Refreshed/expired tokens cannot silently join a paid room or reuse revoked account access.
- Monthly entitlement/generation cannot be unlocked using forged browser content or another user's report.
- Pending payment and booking outcomes remain recoverable across refresh and device changes.

## Interface completeness

Every required route has loading, empty, validation, permission, expired-session, upstream failure and success handling as applicable. All buttons have real behavior. No mock ratings/availability, fake testimonials, synthetic success toasts, coming-soon alerts masquerading as functionality or mandatory app redirects for supported browser flows.

All mobile route files in document 09 are mapped to P01–P18 or an explicit alias/layout/non-feature rationale. Add mappings for any mobile features changed since the recorded revision. This is the final omission check, not just a count of pages.

## Accessibility/browser acceptance

Test keyboard-only onboarding and booking, focus order/traps, screen reader labels/status, 200% zoom, 360/390/768/1280/1440 widths, reduced motion, long names/Hindi text, chart text equivalents and touch target size. Target WCAG 2.2 AA and verify against the current standard during implementation.

Test current supported Chrome/Edge desktop, Safari macOS/iOS and Chrome Android; add Firefox if supported by selected media SDK. Record exact versions tested. Browser capability limitations get explicit recovery guidance; a generic desktop-only build fails the brief.

## Performance and SEO budgets

Targets for measured public-page real-user p75 when sufficient data exists: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1. These are engineering targets, not measurements of this site. Before traffic is available, use representative mobile lab runs and document device/network settings. Lazy-load checkout/media/tool-heavy UI outside the initial public bundle, size imagery and avoid decorative WebGL on critical paths.

Check public server rendering, titles/descriptions/canonicals, truthful structured data, sitemap exclusions, robots, redirects and broken links. Confirm no private cache cross-user leakage; `noindex` cannot substitute for auth. Do not promise ranking outcomes.

## Operational readiness

- Staging and production origins, cookies, OAuth, socket CORS and payment callback domains are configured and verified.
- Payment keys/AI/cloud credentials remain server-only; CSP and upload limits accommodate only necessary services.
- Alerting covers elevated auth/payment/media/report failures using redacted IDs.
- Support/grievance routing and practitioner conduct reporting have accountable owners.
- Legal/entity/tax/refund/retention facts are approved and match the implementation.
- Feature flags prevent discovery of unavailable paid paths; a hidden required capability still counts as incomplete parity.
- Rollback preserves ledger/bookings and compatible API versions; no destructive migration without a separate reviewed plan.

## Completion definition

Complete means all P01–P18, required public/legal/support routes, source-to-web mappings and critical tests pass with real staging integrations. No-timer service and story continuity are required review additions; remaining optional differentiators are accepted separately. Provide preview URL, test evidence, backend dependencies delivered, policy approvals, remaining nonblocking limitations and rollback instructions. Screenshots and a successful build alone cannot demonstrate functional parity.
