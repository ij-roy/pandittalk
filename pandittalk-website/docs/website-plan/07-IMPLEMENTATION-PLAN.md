# Pandit Talk complete website implementation plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement task-by-task if available. Steps use checkboxes for tracking. Read the linked specifications before editing. This document is a handoff; execution was not performed by the planning agent.

**Goal:** Deliver the entire customer app experience in the existing website, alongside distinctive public, educational, support and legal pages.

**Architecture:** Extend Next.js App Router; use the current NestJS backend as the shared system of record. Add browser adapters for auth, Razorpay, Socket.IO and WebRTC. Separate public rendering from authorized customer data.

**Tech stack:** Existing Next.js/React/TypeScript/Tailwind; browser Socket.IO and WebRTC; Razorpay web checkout; proposed Playwright and TypeScript contract tests.

**Spec:** [Parity](02-APP-PARITY.md), [Pages](03-SITEMAP-AND-PAGES.md), [Brand](04-BRAND-AND-EXPERIENCE.md), [Architecture](05-ARCHITECTURE-AND-CONTRACTS.md), [Legal](06-LEGAL-AND-OPERATIONS.md).

## Global constraints

- All parity requirements P01–P18 are required for the complete website.
- Reuse the same customer identity, wallet, bookings, reports and expert data as the app.
- Coins and INR are different units; the backend owns amounts and entitlements.
- Automation must be visibly distinguished from human consultation.
- Sensitive data must not enter page URLs, analytics or public caches.
- Product must work at 360px and on desktop, with keyboard and screen reader access.
- Do not publish unsupported claims or enable unsafe paid paths.

Proposed file paths below are intentional targets, not claims that files already exist. Existing route ownership must be reconciled first. Code examples describe test/contracts, not completed functionality. Backend work lives in the monorepo and requires coordinated delivery; a web-only checkout cannot solve it by inventing responses.

## Task 1 — Freeze parity and integration contracts

Files: create `docs/implementation/contract-checklist.md`, `src/lib/api/contracts.ts`, `tests/contracts/payloads.test.ts`. Reference source inventory and backend DTOs/controllers.

Consumes: recorded source revisions. Produces: verified endpoint/payload/auth/error map and P01–P18 tracking with task/test links.

- [ ] Compare current revisions and account for every added mobile screen/client method.
- [ ] Inspect each relevant DTO, controller guard and service transition; record method, URL, request, response, errors and source file.
- [ ] Define strict schema validation for booking ID/status/time/amount, wallet units and report type. Unknown values fail visibly; no fabricated defaults.
- [ ] Add redacted fixtures for success, malformed response, unauthorized and insufficient coins; run the chosen contract runner.
- [ ] Record D01–D11 ownership and dependent feature gates. Agree approved catalogue/policy values before checkout work.

Gate: one reviewed source of truth per contract; staging access defined. No production requests needed.

## Task 2 — Shared shell and brand foundations

### Prerequisite delivery after Task 1: D11 timed booking parity

Files: coordinate the versioned catalogue/quote and targeted changes in the monorepo's `bookings/bookings.service.ts`, `chat/chat.gateway.ts`, session scheduling/jobs and relevant DTO/schema files identified during Task 1. Update website booking/session contracts alongside the mobile and Pandit dashboard consumers. Do not make unrelated app changes from the website checkout.

- [ ] Audit and approve the app's versioned timed catalogue, quote, availability, timer, queue, cancellation and refund rules.
- [ ] Test server-controlled 15/25/45-minute scheduled sessions and 15-minute Chat Now behavior for chat/audio/video; preserve existing booking semantics.
- [ ] Implement and verify atomic debits, slot/queue contention, waiting/no-show refunds, disconnect refunds, rejoin behavior and recoverable reconnect.
- [ ] Verify app/web/dashboard compatibility and deploy the backend catalogue/quote contract before enabling web booking.

This is a dependency of Tasks 6-8. Task 2 visual work can proceed independently. Task 14's required continuity implementation must pass before Task 12's continuity claims are published. The latest review adds these requirements to original app parity rather than removing any tool, account or payment capability.

Files: modify `src/app/layout.tsx`, `src/app/globals.css`; create `src/components/site/{Header,Footer,MobileNav}.tsx`, `src/components/ui/{Button,Field,Dialog,StatusPanel}.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`, `tests/e2e/navigation.spec.ts`.

Consumes: route map and brand requirements. Produces: shared accessible shell for public and customer routes.

- [ ] Audit logo/fonts and existing theme; establish contrast-tested color/type/spacing tokens.
- [ ] Implement semantic header/footer/menu and navigation states for guest/customer.
- [ ] Build form/dialog/status primitives with visible labels, focus restoration, keyboard dismissal and error summaries.
- [ ] Create responsive route shells with honest empty states; keep unfinished pages out of public navigation until usable.
- [ ] Verify keyboard traversal, 360px layout, 200% zoom, reduced motion and existing journal/legal layouts.

Gate: useful navigation and no duplicate `/` route. No live feature claimed by a shell.

## Task 3 — Identity, account and protected data

Files: create `src/features/auth/{client,session,validation}.ts`, `src/app/api/auth/[action]/route.ts`, `(auth)` pages from document 03, `src/features/account/ProfileForm.tsx`, `tests/e2e/auth.spec.ts`.

Consumes: D01 and auth/profile contracts. Produces: authenticated browser session and profile shared with mobile.

- [ ] Test guest private-page access, invalid/expired OTP, safe return destination and refresh/logout behavior.
- [ ] Implement allowlisted auth adapter with secure cookies, CSRF/origin controls and redacted errors.
- [ ] Build OTP request/verify/resend with server throttling feedback and accessible paste/autofill.
- [ ] Integrate Google/Apple web credentials and social phone completion, including duplicate identity handling.
- [ ] Build profile/avatar edit from actual DTO; preserve existing mobile values.
- [ ] Test logout clearing private state and two-user isolation. Complete phone-change work under D07 before exposing that action as functional.

Gate: same user signs in on app/web, sees matching profile; private data never appears to another session.

## Task 4 — Discovery and practitioner identity

Files: create `src/features/experts/{client,types,filters}.ts`, `PanditCard.tsx`, `PanditDirectory.tsx`, `PanditProfile.tsx`; `/pandits` route pages; `tests/e2e/pandits.spec.ts`.

Consumes: expert contracts and approved biography assets. Produces: stable selected Pandit ID for guidance/chat.

- [ ] Port real category/premium/sort behavior with explicit unknown-data states.
- [ ] Implement directory, profile, clear filters, loading/error/no-results and busy/offline states.
- [ ] Add supported language/name discovery and server-authorized availability refresh.
- [ ] Connect authored articles, reviews and verified metadata without manufactured badges.
- [ ] Add legacy expert redirects and test unlisted/deleted practitioners.

Gate: P03/P04 work with staging data and all CTAs preserve the intended practitioner.

## Task 5 — Wallet and payment recovery

Files: create `src/features/wallet/{client,types,checkout}.ts`, `WalletView.tsx`, `RechargeForm.tsx`, `PaymentStatus.tsx`; wallet route pages; `tests/e2e/wallet.spec.ts`. Backend dependency D02/D03.

Consumes: authenticated session and authoritative packages. Produces: reconciled `coinBalance` and transaction state.

- [ ] Test server order creation/verification and repeated verification before UI integration.
- [ ] Render coin balance/history and packages with INR/bonus/tax distinctions.
- [x] Load Razorpay on explicit checkout action, pass server-created order and verify result server-side. Website recharge now uses the backend wallet package list, server-created Razorpay order, and server verification response; live enablement still requires the production Razorpay credentials and `PAYMENTS_ENABLED=true`.
- [ ] Implement pending/cancelled/failed/verified states and status recovery after refresh/tab closure.
- [ ] Re-fetch wallet after confirmed state changes; prevent repeat submission while outcome is unknown.
- [ ] In test mode replay webhook/verification and verify exactly one credit.

Gate: successful test payment, delayed confirmation and duplicate callback all produce correct ledger outcomes.

## Task 6 — Guided and scheduled bookings

Files: create `src/features/guidance/{state,steps}.tsx`, `src/features/bookings/{client,types}.ts`, `SlotPicker.tsx`, `BookingSummary.tsx`, `BookingDetail.tsx`; guidance/booking pages; `tests/e2e/booking.spec.ts`.

Consumes: identity, expert, wallet and verified booking contracts. Produces: persisted booking ID and authoritative start/format/status.

- [ ] Implement area/notes/service-scope/format/Pandit steps; preserve backwards editing and private draft across recharge.
- [ ] Fetch capacity-aware timed slots for the selected duration and display timezone with final summary.
- [ ] Reconcile total and wallet before commit; handle expired quote/slot taken/insufficient coins.
- [ ] Create once; on network timeout reconcile booking state before retrying mutation.
- [ ] Build detail/confirmation/history/cancel and calendar file from persisted records.
- [ ] Test two customers competing for one slot and replayed commit; assert one booking/debit.

Gate: P05/P06/P11 booking portion passes with a real staging Pandit schedule.

## Task 7 — Chat and queue

Files: create `src/features/sessions/{socket,events,session-state}.ts`, `ChatRoom.tsx`, `QueuePanel.tsx`; chat route; `tests/e2e/chat.spec.ts`.

Consumes: existing socket contract, D01 bootstrap and booking state. Produces: reconciled session lifecycle shared by all session formats.

- [ ] Record exact server event payloads/acks; test unauthorized room access and ended booking rejection.
- [ ] Implement instant chat/queue join/status/leave, accepted/missed events and active booking recovery.
- [ ] Build history, send acknowledgement, typing, failed draft retention and ID deduplication.
- [ ] Render server waiting/start/end/refund state with the server countdown and clean up listeners on navigation.
- [ ] Test user↔Pandit dashboard chat, reconnect, duplicate events and end/review transition.

Gate: no fake messages, hidden fixed-minute cutoff or client-calculated refunds.

## Task 8 — Browser audio and video

Files: create `src/features/sessions/webrtc.ts`, `AudioRoom.tsx`, `VideoRoom.tsx`, `DeviceCheck.tsx`; audio/video routes; `tests/e2e/media.spec.ts`.

Consumes: Task 7 state model and D04. Produces: browser↔Pandit audio/video with identical booking/refund lifecycle.

- [x] Prove local browser WebRTC interoperability through the API/WebSocket front door; repeat through the public tunnel before presentation.
- [ ] Build user-initiated permission/device preflight and waiting room.
- [ ] Implement mute/camera/device/tile states, reconnect and the server-authorized timed lifecycle.
- [ ] Distinguish leave/rejoin from end and policy-backed grace cancellation; release all tracks/listeners on exit.
- [ ] Test camera denied, microphone denied, device absent, network interruption and Pandit disconnect on real supported browsers.
- [ ] Verify refund amounts against ledger, plus completion/review.

Gate: both formats work beyond mocked browser media. App-install fallback alone fails parity.

## Task 9 — Free tools

Files: create `src/features/tools/{client,schemas}.ts`, `BirthDetailsForm.tsx`, `KundliResult.tsx`, `CompatibilityResult.tsx`, `HoroscopeResult.tsx`, `PalmForm.tsx`, `TarotResult.tsx`; free routes; `tests/e2e/tools-free.spec.ts`.

Consumes: documented provider inputs/output and D09. Produces: all five free result experiences.

- [ ] Implement accessible inputs with birth place/time scope, date validation and two-subject permissions.
- [ ] Render actual Kundli chart/planets and textual equivalent; compatibility and horoscope sections.
- [ ] Build two-palm upload/preview/replace and server validation with pre-upload disclosure.
- [ ] Build tarot result with source-consistent card semantics and reduced motion.
- [ ] Add provider-error/retry paths without fictional results or leaking input to URLs/logs.
- [ ] Verify actual staging provider output once; use deterministic fixtures for repeated UI testing.

Gate: P13 complete, personal results absent from sitemap/caches.

## Task 10 — Paid tools and saved reports

Files: create `src/features/tools/PaidToolSummary.tsx`, `DetailedKundli.tsx`, `DetailedCompatibility.tsx`, `MonthlyHoroscope.tsx`; `src/features/reports/{client,ReportList,ReportDetail}.tsx`; paid/report routes; `tests/e2e/reports.spec.ts`.

Consumes: wallet and entitlement contracts; backend reconciliation from D03. Produces: paid results retrievable across devices without duplicate charge.

- [ ] Define entitlement scope from backend behavior for each report type, including monthly period.
- [ ] Implement cost disclosure, unlock/generation, pending/failure/refund and saved record recovery.
- [ ] Render every output section listed in P14 with automated provenance and restrained language.
- [ ] Add report list/detail and print stylesheet; unknown report type fails safely.
- [ ] Purchase on app, open on web; purchase on web, open on app; test another user's ID and generation timeout/retry.

Gate: P14/P15 complete with exactly-once charge or a reconciled refund and accessible report.

## Task 11 — Notifications, reviews and account controls

Files: create `src/features/notifications/{client,NotificationList,Preferences}.tsx`, `src/features/bookings/ReviewForm.tsx`, `src/features/account/{DeleteAccount,PrivacyControls}.tsx`; corresponding account/notification/review routes; `tests/e2e/account.spec.ts`.

Consumes: session completion, notification endpoints, D05/D07/D08. Produces: P11 review and P16/P18 account actions.

- [ ] Implement all nine notification types, badge/read/read-all and authorized deep links.
- [ ] Add server-synced preferences when D05 is delivered; label local-only behavior if staged temporarily, without claiming cross-device completion.
- [ ] Implement eligible rating/comment submission and duplicate/ineligible rejection.
- [ ] Build real phone-change flow after backend readiness and authenticated deletion with impact/retention disclosure.
- [ ] Test active session/account deletion policy, session expiry and preference changes on two devices.

Gate: actionable account controls; no coming-soon success substitutes.

## Task 12 — Public, educational and trust pages

Files: modify root page and article chrome; create `src/content/site/{home,approach,how-it-works,topics}.ts`, public route pages from document 03, `tests/e2e/public-pages.spec.ts`.

Consumes: actual profiles/prices, document 04 and existing article feed. Produces: complete public acquisition and learning experience.

- [ ] Build homepage, approach/about, how-it-works/pricing, guidance hub/topics, tools hub and download page using approved content.
- [ ] Apply the approved timed-booking hero hierarchy and optional-note explanation. Verify the first-screen hierarchy at 390 × 844 and natural flow at 360px/enlarged text; verify all duration/price/refund claims against D11 before publication.
- [ ] Preserve article/author URLs, API behavior and publisher ownership; improve layout and related discovery.
- [ ] Add trust/editorial/accessibility content with accountable claims.
- [ ] Connect public CTAs to actual product flows and resume after authentication.
- [ ] Review every image/biography/review/statistic for provenance and every paragraph for brand specificity.

Gate: public pages lead to usable product journeys; no fake testimonials or thin topic pages.

## Task 13 — Legal, support and practitioner applications

Files: extend `src/content/legal`, preserve legal renderer; create `src/content/help`, `src/features/support/{ContactForm,ApplicationForm}.tsx`; all remaining legal/help/contact/for-Pandits routes; `tests/e2e/support-legal.spec.ts`.

Consumes: approved operational facts and D06/D08. Produces: durable support/application and versioned legal pages.

- [ ] Reconcile policies against actual payment/session/tool/deletion behavior with owners.
- [ ] Implement required documents with dates, anchors, print and app-webview compatibility.
- [ ] Build help articles and contextual escalation from payment/booking/report screens.
- [ ] Connect forms to acknowledged durable intake with rate limits, consent and clear failure state.
- [ ] Preserve practitioner dashboard links and validate application delivery; no automatic publishing of applicants.

Gate: owner-approved policies and real delivered test support/application records.

## Task 14 — Required story continuity and selected extras

Files: required `src/features/account/StoryContext.tsx`, `src/features/bookings/ContextSharePicker.tsx`, `src/app/(customer)/account/story/page.tsx` and corresponding backend private context/share storage and APIs. If selected, add `src/features/guidance/PreparationSheet.tsx`, `src/features/account/Reflection.tsx`, profile media and learning paths.

Consumes: required continuity specification in document 04 and D10. Produces: persistent customer-controlled context with per-consultation practitioner sharing. Owner selection applies only to remaining optional proposals.

- [ ] Implement required context save/retrieve/edit/delete, explicit recipient selection and Start fresh. Verify practitioner-side access and denial for other Pandits. Record optional selections separately.
- [ ] Implement preparation with skip and clear sharing scope; integrate existing notes only within real DTO limits.
- [ ] If reflection selected, add owner-only persistence/edit/delete and no automatic practitioner sharing.
- [ ] If introduction media selected, use consented asset and transcript; if reading paths selected, use reviewed articles.
- [ ] Test privacy, keyboard use and mobile layouts.

Gate: required continuity works end to end; chosen extras are real and unselected optional proposals remain outside launch scope.

## Task 15 — Release verification and handoff

Files: update `src/app/{sitemap,robots}.ts`, metadata, `next.config.ts` where required; create `docs/implementation/release-evidence.md`, `rollback.md`; test suites in document 08.

- [ ] Complete route/alias inventory, internal-link validation, canonicals and public/private indexing checks.
- [ ] Run lint, TypeScript, build and meaningful contract/E2E tests using installed scripts.
- [ ] Test desktop/mobile browsers, real payment sandbox, real two-party media and cross-device account/report parity.
- [ ] Review accessibility, content and redacted observability; document any remaining release blockers honestly.
- [ ] Produce staging evidence and a reversible deployment plan with backend compatibility and feature flags.
- [ ] Obtain final owner review of the concrete release/policy content before publishing; after authorized deployment run non-destructive smoke tests.

Gate: every required P and release check passes or the release is explicitly blocked. A partial marketing launch is not completion of this brief.

## Concrete test case: reopening an existing purchase

Precondition: a dedicated staging user owns one successfully purchased detailed Kundli report; record its ID, current coin balance and the full ledger entries before the test. No other activity may mutate this user's wallet during this test.

1. Authenticate as that user and fetch `GET /reports`; locate the recorded report ID.
2. Open `/reports/[id]`; assert the returned payload's actual narrative and planet names are displayed.
3. Reload the route twice; navigate to the report list and open it again.
4. Fetch `GET /wallet` and the complete backend test ledger for that user. Assert the balance equals the pre-test balance and no new debit was created. If the wallet endpoint paginates history, compare the backend ledger rather than only the displayed page.
5. Authenticate as a second user and request `GET /reports/:id`; assert denial without report payload.

This test checks reopening; a separate purchase replay test must assert exactly one debit during generation. Financial/session invariants are enumerated in document 08. Do not substitute label-only UI assertions for ledger and authorization checks.
