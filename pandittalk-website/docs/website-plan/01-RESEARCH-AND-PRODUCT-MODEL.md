# Research and product model

## Research boundary

Research date: 10 September 2026. Public Astrotalk pages and official regulator/vendor documentation were reviewed. No competitor account was created and no paid consultation, refund or authenticated wallet journey was tested. Public claims are reported as claims, not independent validation. Several dynamic consultation pages exposed mostly navigation in the text response; this is not evidence that the service is absent.

## Astrotalk: observed model

Astrotalk's public site combines consultation discovery with free astrology utilities, a large educational/search surface, and links to spiritual-product commerce. Its navigation exposes chat/call, multiple horoscope periods, Kundli, compatibility, tarot, calculators, Panchang, blog and practitioner registration. It also promotes reviews, media recognition and app access. This is a broad acquisition ecosystem rather than a single landing page. [Source: Astrotalk homepage](https://astrotalk.com/).

The chat page promotes an introductory free chat; the call page advertises an introductory free call and multiple languages. These are acquisition offers whose exact eligibility and paid conversion were not tested. Borrow the low-friction way to discover a suitable practitioner, but establish Pandit Talk's own offer economics before promising a free session. [Chat](https://astrotalk.com/chat-with-astrologer), [Call](https://astrotalk.com/talk-to-astrologer).

Astrotalk's published refund page describes per-minute chat/call charging and restrictions on refunds, including connected calls and incorrect contact details. Pandit Talk should make its own no-timer service scope and coin-credit rules understandable before purchase and give customers a visible resolution path. This is a product recommendation, not a claim about actual competitor dispute handling. [Refund and cancellation terms](https://astrotalk.com/refund-and-cancellation-policy).

## Competitive lessons and independent recommendations

1. **Discovery needs breadth.** People arrive through a question, an article, a free tool or a known Pandit. Give each a coherent route to the same consultation system.
2. **Selection needs evidence.** Show language, practice, experience with a provenance policy, actual availability, service scope, price and a practitioner introduction before asking for money.
3. **Trust needs operational proof.** Clear session boundaries, accessible end controls, transaction references and visible refund status support the positioning better than large reassurance badges.
4. **Return visits should be useful.** Upcoming bookings, purchased reports and authored learning content belong on the signed-in home. Avoid anxiety-driven streaks or daily fear alerts.
5. **SEO should answer real questions.** Start with useful guidance topics and existing articles. A large cloned calculator directory would add maintenance cost without proving value.

Do not claim Astrotalk lacks human service, ethical practices or transparent pricing. This research cannot establish those claims. Do not copy its text, visual identity, practitioner photos, reviews or page structures.

## Pandit Talk's observed model

The source describes a service marketplace with scheduled consultations, instant chat, a prepaid coin wallet, free discovery tools and paid detailed reports. Practitioner-written articles form an existing educational channel. The customer app and Pandit dashboard share the backend.

Historical timed-model source values, for migration reconciliation only; these are not the new no-timer offer:

- Scheduled audio: Entry 151 / 15 minutes; Standard 301 / 25 minutes; Deep 501 / 45 minutes. The mobile presentation uses INR labels; backend wallet accounting uses coins.
- Video adds 150 to the base package in the mobile pricing model.
- Instant chat backend constants: 101, 15 minutes, with a separate 5-minute buffer constant. Do not present the buffer as paid consultation time without verifying its role.
- Detailed Kundli: 251 coins; monthly horoscope: 101 coins; detailed compatibility: 201 coins in backend tool unlock constants.
- Actual coin packages, paid/bonus composition and INR purchase prices come from the wallet API. Do not infer a universal 1:1 conversion from these values.

Evidence: `apps/mobile/lib/bookingPricing.ts`; backend `bookings/bookings.service.ts` and `tools/tools.service.ts`; mobile `lib/walletApi.ts`. These numbers are not a final commercial approval or a commitment to keep prices unchanged.

## Recommended business design

Offer an unrushed conversation with transparent scope, price and a customer-chosen next step. No Timer. Just Resolution. is the primary requested differentiator, not a guarantee of external life outcomes. Explain the cost before the customer commits. Let people browse Pandits and free tool descriptions without creating an account. Ask for sign-in at the point it is needed for wallet, paid entitlement or private records.

Keep practitioner discovery independent of recharge. Use a real, reviewed refund policy and link it beside the booking summary. Give a customer a useful stopping point after a consultation: what was discussed, what remains uncertain, and a next step they choose themselves. Proposed note-taking is customer-controlled and does not imply that sessions are recorded.

Measure completed consultations, connection success, repeat voluntary use, report retrieval and support resolution. Do not optimize primarily for longer sessions, larger coin purchases or fear-based return visits.

## Architecture approaches considered

- **Recommended: extend the current Next.js website with the existing backend.** Preserves content/SEO work and supports public rendering plus browser sessions. Requires browser auth, payment and media adapters.
- **Expo web export.** May reuse visual code, but native auth, Razorpay and native WebRTC modules still need browser-safe boundaries; existing article/legal architecture would become harder to unify.
- **Separate marketing and customer websites.** Can isolate deployments, but adds navigation, identity, cookie and SEO coordination. No demonstrated need for that complexity in this brief.

## Opportunities beyond parity

Required trust extensions: no-timer service delivery and customer-controlled story continuity, pricing explanation, first-session guide, verifiable practitioner stories, complete help/legal routes, accessible session controls, visible automation disclosure and a humane no-results/offline experience.

Proposed differentiators: optional pre-session question sheet, private post-session reflection, practitioner introduction audio with transcript, curated topic reading paths and a clear data-control centre. Backend-dependent persistence must be implemented explicitly; these are not existing app features.

Defer commerce, subscriptions, referral schemes, livestreaming, community forums and large new calculator collections. They are neither established customer app parity nor necessary to express this brand.
