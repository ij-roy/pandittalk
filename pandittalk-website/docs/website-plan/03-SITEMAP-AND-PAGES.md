# Sitemap and page contracts

Every listed route is a proposed web route unless explicitly marked existing. Public pages must render meaningful server content; private pages require authorization, `noindex` and private/no-store data handling. Route groups do not change public URLs.

## Public navigation

Desktop: Pandits, Find guidance, Tools, Learn, Our approach; secondary How it works, Pricing, Help, Sign in. Signed-in header adds wallet, notifications and account. Mobile: a compact menu plus persistent product navigation when signed in. Footer groups Discover, Learn, Pandit Talk, Support, Legal and For Pandits. No enormous keyword footer.

## Public pages

### `/` — Main landing page

Audience: a curious or uncertain first-time visitor. Primary action: Find your Pandit. Secondary action: See how it works. Structure:

1. First screen: **Why Pandit Talk?** → **Traditional Wisdom + Real Pandits + Modern Technology** → **No Timer. Just Resolution.** → **Aapko apni baat samjhane ki jaldi nahi honi chahiye...** → **We believe a meaningful conversation shouldn't feel like a race against a clock.** → **You Talk. We Stay.** Use the real portrait, typography and responsive hierarchy in document 04.
2. Choose what you want to discuss: career, relationships, family, education, business and general direction; preserve the complete topic set in guidance.
3. A small live practitioner selection with language, practice, availability and actual pricing links. API failure produces a clear browse/retry state, never invented people.
4. Three-step explanation: choose a person/format, see price, have the conversation.
5. The Pandit Talk promise expressed through concrete practices: no guaranteed outcomes, clear charges, private handling and support.
6. Free tool entry points and authored reading, clearly separate from human consultation.
7. One genuine practitioner story; real customer feedback only if consent and provenance exist.
8. First-session questions, pricing/refund links and closing invitation.

Immediately after the hero, before topics/directories, add the dedicated **No Timer. Just Resolution.** section and **Your story shouldn't have to start from zero every time.** section. Follow document 04 for copy, visual composition and actual customer-controlled context.

Returning signed-in visitors can reach `/home` directly; do not make the marketing page their only home.

### `/our-approach` and `/about`

Approach: philosophy, what astrology can and cannot offer, customer agency, human versus automated services, practical conduct commitments. About: founder's actual account of why the service exists, named team where approved, real operational contact and practitioner community. Avoid fictional founder letters or invented generational history. Link the two without repeating the entire manifesto.

### `/how-it-works`

Explain browse, optional guidance flow, sign-in, coins, no-timer conversation scope and formats, booking, waiting/joining, end/review and support. Include an example using current server-approved price data. Explain microphone/camera browser requirements and why birth information may be requested. Link to a first-session preparation guide.

Add a **How your story stays with you** anchor explaining saved context, explicit per-consultation sharing, editing/deletion and starting fresh. Explain approved completion, breaks and follow-up terms next to the no-timer offer.

### `/pricing`

Separate scheduled audio, scheduled video, instant chat, paid tools and wallet purchase packages. Each price has a unit, service scope/deliverable, tax treatment and policy link. Explain paid versus bonus coins and what refunds return. Do not use approximate UI constants as the commercial source of truth. If catalogue API is unavailable, temporarily provide the policy and availability notice, not stale buy buttons.

### `/pandits` and `/pandits/[id]`

Implement P03/P04. Desktop directory: heading, concise filters, result count, list/grid of comparable practitioners; details: real portrait and identity, introduction, practice/language, evidence, reviews, authored articles and booking panel. Small screens keep content first and expose a compact action bar without covering consent or price details. Only published profiles enter sitemap.

### `/guidance` and `/guidance/[topic]`

Hub explains choosing a topic and routes to the five-step service flow at `/guidance/start`. Eight booking topics from P05 receive reviewed landing content when ready: career, love, family, marriage, education, health, business, finance. Each topic page needs a distinct situation, useful preparatory questions, limits, relevant Pandits, authored articles and a preselected flow CTA. Unknown slugs return 404. Do not publish thin placeholders just to meet a route count.

### `/tools` and tool routes

Hub groups five free tools and three paid deeper readings, displaying free/paid and automated interpretation clearly. Tool pages pair a short explanation/methodology with the actual form and result journey in P13/P14. Do not create separate indexable result pages containing someone's birth details. A daily sign article can be indexed only if it is genuinely public editorial content and not a private generated result.

### `/articles`, `/articles/[slug]`, `/authors/[id]` — existing

Preserve URLs and current backend feeds. Improve reading layout, navigation, related content and suitable Pandit links. Article detail: title, accurate byline, date, category, reading body, image credit and editorial correction link. Author detail must distinguish author credentials from consultation availability.

### `/help`, `/help/[slug]`, `/contact`

Initial help articles: first consultation; coins and payment pending; booking/cancellation; joining audio/video; chat reconnect; finding reports; account and phone access; deletion/privacy; refunds and complaints. Each article offers actual steps and an escalation path. Contact displays confirmed email/hours and a structured support submission if a ticket endpoint exists. Forms cannot say submitted until storage/delivery is acknowledged.

### `/trust`, `/editorial-policy`, `/accessibility`

Trust: verified selection process, conduct/reporting, data practices and honest service limitations. Editorial: author/reviewer roles, corrections and AI disclosure standards. Accessibility: supported assistance channels and known limitations, maintained from actual testing. Avoid unverified certification or universal accessibility claims.

### `/join-as-pandit`, `/for-pandits`

Explain suitability, real verification steps, expected conduct and application process. Preserve useful intent from `landing_page/pandit_registration.html` but audit its submission destination before reuse. Application must have consent, server validation and durable acknowledgement. Practitioner login links to the existing `dashboard.pandittalk.com`; dashboard authoring/admin is not a new customer feature. If no application endpoint exists, this is an explicit backend work item.

### `/download`

Use confirmed store links, actual app screenshots and the benefits of mobile. Customers can continue on the website. Do not publish a fake App Store button or expose local APK build artifacts as a download.

## Private product routes

- `/home`: upcoming booking, resume active session, wallet summary, recent reports and private saved context with edit/delete/share/start-fresh controls.
- `/login`, `/verify-otp`, `/link-phone`, `/profile-setup`: P02, normally noindex.
- `/guidance/start`: P05; browse steps may be guest-accessible, commitment requires auth.
- `/bookings/new`, `/bookings`, `/bookings/[id]`, `/bookings/[id]/review`: P06/P11.
- `/sessions/[bookingId]/chat`, `/audio`, `/video`: P07–P10; server checks booking membership on every transport.
- `/wallet`, `/wallet/recharge`, `/wallet/payment-status`: P12; payment references are private.
- `/reports`, `/reports/[id]`: P15; signed-in owner only.
- `/notifications`: P16.
- `/account`, `/account/profile`, `/account/notifications`, `/account/privacy`, `/account/delete`: P18.
- `/account/story`: D10; private context list/editor, delete and sharing controls. Per-booking context selection belongs in booking review, with recipient preview and Start fresh.

## Legal routes

Retain existing `/privacy` and `/terms-and-conditions`. Add `/refund-and-cancellation-policy`, `/pricing-policy`, `/disclaimer`, `/cookie-policy`, `/grievance-redressal`, `/delete-account`. The public deletion page explains the process and leads to the authenticated action. `/pricing-policy` explains rules; `/pricing` displays the commercial catalogue. Avoid duplicating contradictory rules between them. Existing privacy/terms pages remain stable for app webviews.

## Utility and failure pages

Custom not-found page, recoverable global error boundary, maintenance/service-unavailable state, auth-expired state, forbidden private-resource state, loading skeletons, accessible offline/retry messaging and payment-pending state. A user must never land on raw JSON, an endless spinner or a success screen after a failed request.

## SEO and migration requirements

One canonical production host; redirect alternate host. Preserve article slugs, authors and legal anchors used by the app. Add canonical metadata, truthful Open Graph, Article/Breadcrumb structured data where supported by visible content, sitemap of published public pages and intentional robots behavior. `noindex` is not access control. Do not include sessions, private reports, auth pages, query-result combinations or payment callbacks in sitemap. Normalize pagination/filter canonicals and avoid indexing every filter permutation. Add redirects for renamed expert links; verify existing deep links with the mobile owner.
