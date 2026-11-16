# Architecture and integration contracts

## Existing foundation

Target website has Next.js `15.5.22`, React `19.1.0`, TypeScript, Tailwind 4, Framer Motion, Markdown rendering, article API clients and reusable legal documents. These are observed versions, not a claim that they are the latest or a security recommendation. At implementation kickoff check current vendor advisories and compatible patches before freezing the release lockfile.

Keep App Router. Server-render public content. Use client components at interaction boundaries. Organize customer code by domain under `src/features/{auth,experts,guidance,bookings,sessions,wallet,tools,reports,notifications,account,support}`. Preserve `src/lib/articles`, `src/components/articles`, `src/content/legal` and their existing contracts where sound.

Suggested routes: `src/app/(public)`, existing `(journal)` and `(legal)`, plus `(customer)` and `(auth)` groups. There must be exactly one owner for `/`: replace the current `src/app/page.tsx` or move it, never create duplicate route-group roots. Group layouts must not leak personalized cached data.

## Backend ownership and browser auth

The NestJS backend remains authoritative for identities, authorizations, quotes, payments, coin ledger, bookings, session lifetime, media credentials, tools and reports. The Next.js server can be a browser-facing adapter; it must not reproduce wallet or refund business logic.

Recommended browser design: HTTP-only, Secure cookies through same-origin Next.js auth handlers, short-lived access credentials, refresh rotation and server-side forwarding to the existing backend. Inspect current backend token rotation semantics first. Browser social OAuth needs its own configured redirect/origin/audience verification; native Google/Apple SDK configuration is not reusable unchanged.

Protect cookie-authenticated mutations with origin checks and CSRF protection. Allow only specific upstream paths; never implement an arbitrary URL proxy. Validate response shapes and mask upstream internal errors. No long-lived bearer token in localStorage or URL. A Socket.IO/media bootstrap may need an ephemeral, narrowly scoped browser credential; adding such an endpoint is new backend work, not an observed feature. Confirm compatibility before adopting the cookie architecture. If direct access tokens are necessary temporarily, keep short-lived tokens in memory and document the renewal/XSS tradeoff.

## Observed HTTP surface

These are controller routes, subject to any prefix in backend bootstrap. Confirm request DTOs, response envelopes, authorization guards and error shapes in a checked-in contract before client implementation.

- Identity: `POST /auth/request-otp`, `/verify-otp`, `/google`, `/apple`, `/complete-social`, `/link-google`, `/refresh`, `/logout`.
- Profile: `GET/PATCH/DELETE /users/profile`, `POST /users/profile/avatar`.
- Discovery: `GET /experts`, `/experts/:id`, `/experts/:id/available-slots`, `/experts/:id/all-slots`.
- Customer bookings: `POST/GET /bookings`, `GET /bookings/:id`, `PATCH /bookings/:id/status`, `POST /bookings/:id/review`.
- Instant chat: `POST /bookings/chat-now`; `POST/GET/DELETE /bookings/chat-now/queue`; inspect `/bookings/pandit/:panditId/status` for current user chat recovery/availability semantics.
- Wallet: `GET /wallet`, `POST /wallet/create-order`, `/wallet/verify-payment`; `/wallet/webhook` is server-to-server, never a customer-controlled proxy target.
- Tools: `POST /tools/kundli`, `/horoscope`, `/compatibility`, `/tarot`, `/palm-reading`, `/monthly-horoscope`, `/unlock`; `GET /tools/unlocked`.
- Reports: `GET /reports`, `/reports/:id`.
- Notifications: `GET /notifications`, `/notifications/unread-count`, `PATCH /notifications/read-all`, `/notifications/:id/read`.
- Audio/video: `POST /sessions/{audio|video}/create`, `/join`; `GET/DELETE /sessions/{audio|video}/:bookingId`. Availability to a customer must be checked against guards; do not expose privileged create/delete actions merely because they exist.
- Articles: `GET /articles`, `/articles/sitemap`, `/articles/authors/:panditId`, `/articles/:slug`, `POST /articles/:slug/events`. Publishing and Blogger synchronization stay privileged.

## Client contract anchors

Use these current mobile exports as semantic references; remove native stores/imports when adapting. Do not blindly copy permissive normalization that invents a date, identity or success from malformed data.

```ts
type CreateBookingPayload = {
  panditId: string; startTime: string; area: string;
  depth: string; format: string; notes?: string;
};
type VerifyPaymentPayload = {
  razorpayOrderId: string; razorpayPaymentId: string;
  razorpaySignature: string;
};
type UnlockToolType =
  | 'monthly_horoscope' | 'detailed_kundli' | 'detailed_compatibility';
```

Current functions include `createBooking`, `getUserBookings`, `getBookingById`, `getAllSlots`, `submitReview`, `chatNow`, `getReports`, `getReportById`, `postKundli`, `postDetailedKundli`, `postCompatibility`, `postDetailedCompatibility`, `postUnlockTool`, `getUnlockedTools`. The new browser clients should preserve these meanings; their signatures may remove explicit access tokens when the cookie adapter owns authentication.

## Money, concurrency and entitlement requirements

Backend must validate package ID and calculate INR amount. Razorpay creates the order server-side; the browser receives only public checkout configuration. Signature verification and webhook reconciliation happen server-side; a checkout callback alone never credits coins. [Razorpay official documentation](https://razorpay.com/docs/).

Require idempotent payment verification, duplicate webhook handling, atomic wallet debit/booking creation, slot contention protection, negative-balance prevention and idempotent refunds. Existing source contains portions of these flows; proving these properties requires integration tests. Do not claim they are missing solely because this review did not audit every transaction.

A versioned booking catalogue and quote contract is now required at the backend boundary because the app and website must not maintain separate pricing decisions. The public catalogue exposes the supported areas, timed depths, formats, Chat Now rules, session policy and cancellation/refund policy. The quote endpoint returns the authoritative `sessionModel`, depth, format, duration and total coins. The website displays those returned values and submits no client-calculated amount or duration; stale, unavailable or conflicting quotes stop confirmation instead of silently changing the charge.

## Real-time and media

Source socket commands include `joinSession`, `leaveSession`, `sendMessage`, `typing`, `endSession`; audio/video join/leave/end; `requestGraceRefund`; `videoCameraState`. Inspect both `lib/chatSocket.ts` and `chat.gateway.ts` for exact payload/acknowledgement/event names and namespace. Reuse participant authorization and keep the server as the authority for timed session end and refund calculations. The browser renders `sessionStarted`, `timeRemaining` and terminal/refund events; it must not extend or invent the countdown. Socket disconnect is not proof a booking ended.

Use browser WebRTC with the provider-neutral session config and Socket.IO signaling boundary. Run a browser↔existing Pandit dashboard proof before building polished video UI. Use device consent, track cleanup, reconnection, free STUN by default, and optional coturn for restrictive networks. Native `react-native-webrtc` is a custom-dev-client adapter, not browser code.

Real-time infrastructure stays on the existing service; do not assume a Next.js deployment can host persistent Socket.IO connections. Cross-origin allowlists, WSS/HTTPS, proxy timeouts and media connectivity must be tested in staging.

## Tool provenance and input boundaries

Backend integrates Prokerala and OpenAI; tarot uses random card selection; palm analysis sends images to an AI provider. Map each output section to calculation, generated interpretation or human contribution and label accurately. Do not present generated narrative as mathematically calculated planetary positions or a Pandit's personal review.

Validate birth date/time/place on both sides; keep date-only values separate from session timestamps. Current backend has a fixed IST offset: require explicit India-supported scope until historical timezone/overseas inputs are handled correctly. Reject unsupported input rather than defaulting to an unrelated city or fabricated birth time.

Palm uploads require MIME decoding, size/pixel limits, safe image conversion, metadata stripping where feasible and a retention policy. Do not cache sensitive payloads in CDN/service worker. Paid generation requires a reconciled debit/report/refund lifecycle; an HTTP timeout does not authorize another debit. Audit the current monthly unlock flow, which accepts report payload, before treating browser-supplied content as trusted paid output.

## Explicit dependency register

- **D01 Browser auth:** OAuth web configuration, cookie/refresh integration, CSRF and socket bootstrap. Owner: web + backend.
- **D02 Commercial catalogue:** authoritative pricing/units, taxes and entitlement scopes. Owner: product + backend.
- **D03 Transaction reliability:** contention/idempotency and pending-payment status recovery. Owner: backend; web implements state UI.
- **D04 Browser media:** WebRTC compatibility with current Pandit dashboard and booking lifecycle. Owner: web + backend.
- **D05 Notification persistence:** current local preferences cannot sync; server preferences and optional web push are additions. Owner: backend.
- **D06 Support/application:** durable ticket and practitioner application intake were not established by the inspected customer endpoints. Owner: operations + backend.
- **D07 Phone change:** currently a coming-soon action; requires authenticated number replacement and recovery protections. Owner: backend.
- **D08 Privacy controls:** actual retention/deletion behavior, consent records and optional export workflow. Owner: legal/operations + backend.
- **D09 Provenance:** tool disclosures, practitioner claims and reviewed brand content. Owner: product/editorial.
- **D10 Story continuity (required):** private context persistence, customer edit/delete, explicit per-consultation recipient sharing and practitioner access controls. Remaining reflection/media enhancements are optional. Owner: product + backend.
- **D11 Timed booking parity (required):** the app and website share the versioned catalogue/quote, timed scheduled depths and formats, Chat Now presence/queue rules, server session timer, cancellation, interruption and refund behavior. Existing records retain their stored terms. Owner: product + operations + backend.

## Testing/deployment shape

### D11 implementation boundary: timed app parity

Keep `legacy_timed` as the model for new website bookings and reject `no_timer` for new creation. The backend catalogue owns Entry (15m), Standard (25m), Deep (45m), scheduled chat/audio/video adjustments, Chat Now (15m), queue limits, waiting timeout, server countdown, cancellation and refund rules. The website reads the catalogue and quotes; it never copies those values into a charge request.

The server remains authoritative for slot contention, wallet debits, session start/end, waiting/no-show refunds, Pandit disconnect refunds and rejoin eligibility. The browser renders server timestamps/events and preserves the distinction between leaving, rejoining and ending. Existing bookings retain their stored duration, amount and model; a copy migration must not reinterpret them.

Deploy the backend contract before presenting web booking as available. Verify the same quote, booking, timer, cancellation and refund outcomes against the app, then enable scheduled and Chat Now entry points together. A missing deployed catalogue/quote route is a release blocker, not a reason to fall back to duplicated website pricing.

### D10 implementation boundary: story continuity

Proposed private data model: customer-owned context with an opaque ID, text, created/updated timestamps and deletion state; an explicit share record binds a selected context version to a booking and its selected Pandit. These are additions, not observed endpoints. Document APIs for create/read/update/delete and per-booking share/revoke with ownership checks. Keep context out of query strings, analytics and public caches.

Before booking, let the customer preview what will be shared and with whom. Starting fresh means no prior context is attached. Editing a saved note must not silently change a past shared version. Explain the difference between deleting private notes, revoking future access and retention of already shared consultation records; apply the approved policy. Test unauthorized direct-ID access and practitioner reassignment. No automatic summarization, recording or transcription is necessary for this requirement.

Proposed test tooling: Playwright for customer journeys and an appropriate TypeScript unit/contract runner such as Vitest; these are not installed today. Select compatible versions at implementation time. Use a dedicated staging backend, test users/Pandit, Razorpay test mode and real browser devices for media. No production charges or destructive account tests during development.

Separate configuration for public origins and server secrets. Never expose payment secret, cloud credentials, AI keys or refresh tokens through `NEXT_PUBLIC_*`. Keep existing article environment configuration compatible. Add redacted request IDs, payment/session state telemetry, uptime checks and rollback flags; never log OTPs, palm images, birth details, chat bodies or private notes.
