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

A new quote/catalogue contract is recommended because current pricing constants are distributed across app and backend. Proposed response fields: `quoteId`, `expiresAt`, `serviceType`, `sessionModel`, `scopeDescription`, `completionPolicyVersion`, `coinsRequired`, `currency`, `taxDisclosure`, `policyVersion`. These fields are a proposed backend change. Until available, derive display from a single approved versioned catalogue and reconcile against server totals before commitment; block stale prices instead of silently charging another amount.

## Real-time and media

Source socket commands include `joinSession`, `leaveSession`, `sendMessage`, `typing`, `endSession`; audio/video join/leave/end; `requestGraceRefund`; `videoCameraState`. Inspect both `lib/chatSocket.ts` and `chat.gateway.ts` for exact payload/acknowledgement/event names and namespace. Reuse participant authorization and reconcile refund authority; replace fixed-minute termination under D11. Preserve operational timestamps without customer countdowns. Socket disconnect is not proof a booking ended.

Use the browser Amazon Chime SDK with existing meeting/attendee backend flows. Run a browser↔existing Pandit dashboard proof before building polished video UI. Use device consent, tile cleanup, reconnection and supported-browser behavior from the [official Chime JavaScript SDK](https://aws.github.io/amazon-chime-sdk-js/). Native `expo-pandit-chime` is reference behavior, not browser code.

Real-time infrastructure stays on the existing service; do not assume a Next.js deployment can host persistent Socket.IO connections. Cross-origin allowlists, WSS/HTTPS, proxy timeouts and media connectivity must be tested in staging.

## Tool provenance and input boundaries

Backend integrates Prokerala and OpenAI; tarot uses random card selection; palm analysis sends images to an AI provider. Map each output section to calculation, generated interpretation or human contribution and label accurately. Do not present generated narrative as mathematically calculated planetary positions or a Pandit's personal review.

Validate birth date/time/place on both sides; keep date-only values separate from session timestamps. Current backend has a fixed IST offset: require explicit India-supported scope until historical timezone/overseas inputs are handled correctly. Reject unsupported input rather than defaulting to an unrelated city or fabricated birth time.

Palm uploads require MIME decoding, size/pixel limits, safe image conversion, metadata stripping where feasible and a retention policy. Do not cache sensitive payloads in CDN/service worker. Paid generation requires a reconciled debit/report/refund lifecycle; an HTTP timeout does not authorize another debit. Audit the current monthly unlock flow, which accepts report payload, before treating browser-supplied content as trusted paid output.

## Explicit dependency register

- **D01 Browser auth:** OAuth web configuration, cookie/refresh integration, CSRF and socket bootstrap. Owner: web + backend.
- **D02 Commercial catalogue:** authoritative pricing/units, taxes and entitlement scopes. Owner: product + backend.
- **D03 Transaction reliability:** contention/idempotency and pending-payment status recovery. Owner: backend; web implements state UI.
- **D04 Browser media:** Chime compatibility with current Pandit dashboard and booking lifecycle. Owner: web + backend.
- **D05 Notification persistence:** current local preferences cannot sync; server preferences and optional web push are additions. Owner: backend.
- **D06 Support/application:** durable ticket and practitioner application intake were not established by the inspected customer endpoints. Owner: operations + backend.
- **D07 Phone change:** currently a coming-soon action; requires authenticated number replacement and recovery protections. Owner: backend.
- **D08 Privacy controls:** actual retention/deletion behavior, consent records and optional export workflow. Owner: legal/operations + backend.
- **D09 Provenance:** tool disclosures, practitioner claims and reviewed brand content. Owner: product/editorial.
- **D10 Story continuity (required):** private context persistence, customer edit/delete, explicit per-consultation recipient sharing and practitioner access controls. Remaining reflection/media enhancements are optional. Owner: product + backend.
- **D11 No-timer service model (required):** approved pricing/scope, lifecycle, capacity scheduling, queue, interruption/refund/completion/follow-up rules and legacy migration across app, website and Pandit dashboard. Owner: product + operations + backend.

## Testing/deployment shape

### D11 implementation boundary: no-timer conversations

Add a versioned service-model discriminator to quotes and persisted bookings, separating legacy timed bookings from new no-timer conversations. Proposed values are `legacy_timed` and `no_timer`; these are new contract requirements, not existing API fields. The server must reject client attempts to switch an existing booking's model or price. Auth expiry, heartbeat timestamps, start times and technical wait timeouts remain separate from paid conversation duration.

For the new model, remove sold-minute auto-completion in jobs, socket handlers and media teardown paths. Do not merely remove the UI timer. Store explicit completion/leave/interruption reasons, preserve the customer's end action and define the practitioner completion process without forcing a customer to declare their life problem solved. No extra charge or new debit because elapsed minutes increased. Keep abuse/security controls and let technical outages produce a recoverable state under an approved policy.

Capacity planning must prevent overlap without treating a planning estimate as a hidden customer cutoff. Define practitioner capacity, unavailable/busy states, accepted queue expectations and handling when a previous conversation runs beyond an internal planning estimate. Do not fabricate a maximum duration, queue SLA or unlimited follow-up entitlement. Product/operations must settle the offer economics and completion/fair-use policy; backend implementation and claim publication depend on that decision.

Deploy model-aware changes across mobile, website and Pandit dashboard before enabling new-model bookings. Existing timed bookings keep the terms purchased and their clearly identified legacy behavior. No-timer advertising must route to the supported new offer; silently falling back to the old offer is prohibited.

### D10 implementation boundary: story continuity

Proposed private data model: customer-owned context with an opaque ID, text, created/updated timestamps and deletion state; an explicit share record binds a selected context version to a booking and its selected Pandit. These are additions, not observed endpoints. Document APIs for create/read/update/delete and per-booking share/revoke with ownership checks. Keep context out of query strings, analytics and public caches.

Before booking, let the customer preview what will be shared and with whom. Starting fresh means no prior context is attached. Editing a saved note must not silently change a past shared version. Explain the difference between deleting private notes, revoking future access and retention of already shared consultation records; apply the approved policy. Test unauthorized direct-ID access and practitioner reassignment. No automatic summarization, recording or transcription is necessary for this requirement.

Proposed test tooling: Playwright for customer journeys and an appropriate TypeScript unit/contract runner such as Vitest; these are not installed today. Select compatible versions at implementation time. Use a dedicated staging backend, test users/Pandit, Razorpay test mode and real browser devices for media. No production charges or destructive account tests during development.

Separate configuration for public origins and server secrets. Never expose payment secret, cloud credentials, AI keys or refresh tokens through `NEXT_PUBLIC_*`. Keep existing article environment configuration compatible. Add redacted request IDs, payment/session state telemetry, uptime checks and rollback flags; never log OTPs, palm images, birth details, chat bodies or private notes.
