# Pandit Talk complete website — agent handoff

Prepared 10 September 2026. This is a planning deliverable; no website implementation or deployment was performed.

## Latest review: first-screen promise and story continuity

The first screen must explain **Why Pandit Talk?** Lead with **Traditional Wisdom + Real Pandits + Modern Technology**, then make the two real next steps visible: explore a Pandit for a scheduled Audio/Video session or check Chat Now availability. Add the required section **Your story shouldn't have to start from zero every time.** See documents 03/04 for copy and visual direction.

The current target is parity with the app's versioned timed offer: scheduled Audio/Video sessions and Chat Now use server-controlled durations, quotes, availability, countdowns and refund rules. The website must read those contracts from the backend and must not duplicate prices or simulate bookings. Existing bookings retain their agreed terms, including any legacy model that is no longer used for new creation. Production availability remains gated on a deployed backend contract and authenticated staging verification.

“Resolution” means being heard, clarifying the question and agreeing a next step, not guaranteeing an external life outcome. Pricing, conversation scope, completion, breaks, follow-up, practitioner capacity and fair-use rules must be established before publishing/enabling the offer. Do not invent unlimited free access or replace it with an undisclosed time cap.

This website-repository Markdown packet is the current handoff. The previously generated PDF predates this review and remains unchanged; do not use it as the current approval version.

## Outcome

Build the complete customer website at `pandittalk.com`: every customer-facing mobile capability, public discovery and landing pages, educational content, account and service journeys, and a coherent legal/support experience. A website that sends customers to the app to complete normal actions does not meet this brief.

Read these documents in order:

1. [Product model and competitor research](01-RESEARCH-AND-PRODUCT-MODEL.md)
2. [App parity specification](02-APP-PARITY.md)
3. [Sitemap and page specifications](03-SITEMAP-AND-PAGES.md)
4. [Brand, human experience and content direction](04-BRAND-AND-EXPERIENCE.md)
5. [Architecture, integrations and backend dependencies](05-ARCHITECTURE-AND-CONTRACTS.md)
6. [Legal, privacy, support and operating requirements](06-LEGAL-AND-OPERATIONS.md)
7. [Implementation plan](07-IMPLEMENTATION-PLAN.md)
8. [Acceptance tests and release gates](08-ACCEPTANCE-AND-LAUNCH.md)
9. [Source inventory](09-SOURCE-INVENTORY.md)

## Sources of truth

- Target website: `D:/Projects/pandittalk-website`, inspected HEAD `ae8fba3217f79e9a89d0d1c10783a1e8de15b9d2`.
- Mobile/backend reference: `D:/Projects/PanditTalk-Monorepo`, inspected HEAD `bb5a5a3af74af518cc18ffa2fb4798cb5259b291`.
- Mobile app: `apps/mobile/app`, supporting clients in `apps/mobile/lib`.
- Backend: `apps/backend/apps/user-service/src`; persistence schema in `apps/backend/apps/user-service/prisma/schema.prisma`.
- Existing article publishing/admin: `apps/dashboard`; do not rebuild it as customer account functionality.
- Website already uses Next.js App Router, React, TypeScript and Tailwind. Preserve its current articles, author URLs, privacy and terms routes.

These findings are based on source inspection, not a signed-in production audit. An endpoint or screen in source is evidence of implementation intent, not proof that its deployed service works. Recheck diffs since the recorded revisions before coding. The existing untracked `.mobile-shots/` folder belongs to the user; preserve it.

## Scope rules

- All parity requirements P01–P18 are required for the complete website. Build phases are sequencing, not permission to omit later features.
- Required public/trust extensions and proposed differentiators are identified separately. Do not silently turn optional ideas into launch blockers or remove parity to fund them.
- Reuse the same customer identity, wallet, bookings, reports and expert data as the app. Never create a disconnected website wallet or demo booking system.
- Expose the app's timed offer through the reviewed backend catalogue/quote contract, preserving terms for existing bookings. Coins and INR are different units; the backend owns amounts and entitlements.
- Real Pandits, sourced biographies, real rates and attributable writing. Never invent reviews, credentials, popularity labels, lineage, availability or success statistics.
- Product must work at 360px and on desktop, with keyboard and screen reader access.
- Sensitive data must not enter page URLs, analytics or public caches.
- Automation must be visibly distinguished from human consultation.
- India-first, adult customer service is the planning baseline, consistent with existing terms. Worldwide birth-time support and international payments require explicit supported backend behavior.
- Preserve app capability even where wording needs improvement: e.g. health/finance/legal topic discovery remains available as spiritual guidance, without presenting Pandits as regulated professional advisers.

## Decisions already made by this brief

One cohesive website, extending the existing Next.js project; a calm public layer and a fully usable signed-in product; all three consultation formats; every current free/paid tool; shared backend; human-led brand; no forced app installation. This is an architectural programme divided into independent, testable deliverables.

## Owner inputs that must be obtained before publishing dependent claims

Actual legal entity/address and grievance ownership; final coin/pricing/tax policies; support hours and response commitments; confirmed practitioner verification process and evidence; photo/biography permissions; licensed fonts/photography; verified store URLs; approved Hindi translations; approved retention schedule; whether additional backend work can be delivered by this implementation agent or must be handed to the backend owner. These do not prevent building the documented interfaces and test fixtures, but do prevent publishing unsupported claims or enabling unsafe paid paths.

## Paste into the coding agent

> Build the complete Pandit Talk website using `docs/website-plan/00-START-HERE.md` and every linked specification. First compare the current repo and mobile/backend revisions to the source inventory. Preserve existing user changes and article/legal URLs. Implement `07-IMPLEMENTATION-PLAN.md` in dependency order and record evidence for P01–P18 and `08-ACCEPTANCE-AND-LAUNCH.md`. Keep fixture data confined to tests/previews. Backend gaps must become explicit contract changes with integration tests, never simulated customer success. Complete the product, including wallet, booking, chat, browser audio/video, tools, reports, account, notifications, public content, legal and support. Do not deploy or change live policies without a concrete reviewable release and the required owner facts.
