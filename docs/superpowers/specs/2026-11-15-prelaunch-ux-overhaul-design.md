# PanditTalk Pre-launch UX Overhaul Design

## Intent

Make the customer website feel like a trustworthy, useful product even while new website bookings and recharge are paused. A first-time visitor should understand what Pandit Talk offers, get useful value without signing in, know exactly what is unavailable, and have one clear next step.

The current site is visually calm and technically defensive, but it leads with unavailable functionality, repeats the same pause message across nearly every page, exposes implementation-oriented keyboard instructions to normal users, and leaves data-backed areas in loading or empty states for too long. This design addresses those abandonment causes without inventing live supply, prices, reviews, or booking availability.

## Goals

- Lead with the customer outcome, not the product's temporary unavailability.
- Explain the future conversation model in plain language instead of relying on “No Timer” jargon.
- Make the pre-launch state intentional: explore real profiles, try free tools, prepare a draft, and join a clearly scoped availability list.
- Reduce repeated negative messaging and competing calls to action.
- Give the Pandit directory, session checks, and other API-backed surfaces bounded loading and useful recovery states.
- Preserve drafts across browser restarts with an honest storage message.
- Reduce friction and surprise in tools, authentication, account, help, and legal flows.
- Keep strong existing accessibility behavior while removing visible implementation instructions from normal content.
- Create return value through saved drafts, saved tool results on the current device, journal discovery, and clear next actions.

## Non-goals

- Re-opening bookings, wallet recharge, or paid tools without approved backend terms and catalogue data.
- Fabricating practitioner profiles, reviews, prices, availability, testimonials, or business metrics.
- Replacing the existing API, authentication system, or backend contracts.
- Introducing manipulative streaks, fear-based notifications, or guaranteed-outcome language.
- Rebuilding the visual identity from scratch. The existing warm editorial system remains the foundation.

## Anti-goals

- Do not make every page repeat that bookings are paused.
- Do not put “No Timer status” into the customer’s task flow as if it were a user decision.
- Do not make a waitlist form the dominant content before users see product value.
- Do not show a Pandit as “online” in a way that implies the user can start a conversation when booking is disabled.
- Do not expose keyboard, screen-reader, or implementation instructions as visible marketing copy.

## Approaches considered

1. **Pre-launch conversion overhaul (chosen).** Reframe the existing website around useful pre-launch actions, improve truthful fallback states, and make the current limitations concise. This preserves the current backend and can ship safely now.
2. **Open the full marketplace now.** This would solve the largest conversion problem, but it requires approved service scope, pricing, catalogue, and backend readiness that are not present in the current website source. It is a later product-readiness project.
3. **Visual polish only.** This would improve spacing and styling but leave the unavailable-product framing, long loading states, and weak return value intact. It does not address the main abandonment causes.

## Experience design

### Homepage

The hero becomes:

- Eyebrow: “Traditional wisdom · Real Pandits · Modern technology”
- Heading: “Find a calmer next step for the question on your mind.”
- Supporting copy: explain real Pandits, free automated tools, private preparation, and transparent terms.
- Primary action: “Explore Pandits”.
- Secondary action: “Try a free tool”.
- Tertiary action: “Prepare a private draft”.
- Compact status banner: “New conversations are opening soon. Join the list for one availability email.”

The page keeps the story and topic sections, but removes duplicate waitlist forms and repeated pause explanations. Pandit preview and free tools move closer to the useful first visit. The FAQ remains, but its visible copy is user-facing only; keyboard guidance remains programmatically available.

### Availability messaging

Centralize status language in a small shared content module. Use “New conversations are opening soon” for public pages and “Existing bookings remain available” only where relevant. The phrase “No Timer” is retained only in explanatory detail, paired with “without a minute-by-minute countdown.”

### Directory

Keep real API-backed profiles and filters. Make loading bounded, distinguish “loading,” “no published profiles,” and “could not load,” and offer one primary recovery action. A profile with presence data must also show whether it is currently bookable. The directory page should lead with profile discovery rather than an availability warning or waitlist form.

### Guidance drafts

Use five customer steps: area, question, useful outcome, format, and Pandit preference, followed by a review state. Remove the status-only step. Store anonymous drafts in `localStorage`, label them as “saved on this device,” and offer sign-in as the way to keep them across devices.

### Tools

Add a short “What you’ll get” explanation and privacy/data-use note before long inputs. Keep the existing clear human-versus-automated distinction. Add mobile capture support for palm images where the browser supports it. Make paid cards visibly informational while purchases are paused. Persist a small local recent-reading record after successful free readings, with clear “saved on this device” and clear/delete controls.

### Authentication and account

Change sign-in language to “Sign in or create your account.” Put the phone action above the long availability explanation. Explain India-only phone support and the 18+ requirement before submission, without repeating the pause state in multiple blocks. Make the account shell show a dismissible status notice and a useful next action instead of a permanent negative banner.

### Legal and support

Keep the policy tabs accessible, but use a mobile policy selector instead of requiring horizontal swiping. Hide keyboard instructions visually. Keep the current policy, effective date, summary, and table navigation clear. On support pages, distinguish “support” from “availability updates” and reduce inbox choice overload.

### Visual system

Keep the warm cream, green, ochre, serif/sans pairing. Reduce oversized decorative space where it delays useful content on mobile. Keep visible focus states, 44px touch targets, reduced motion behavior, and the existing no-horizontal-overflow guarantees.

## Constraints

- Next.js 15, React 19, TypeScript, existing CSS system, and existing Playwright/Axe test stack.
- No new production dependency unless a current capability cannot reasonably implement the behavior.
- No real credentials, backend schema changes, or external message sending changes.
- Existing public URLs and legal deep links remain stable.
- The UI must remain truthful when APIs are unavailable.
- All new behavior is test-first with a failing UI or contract test before production implementation.

## Success criteria

- A first-time visitor can explain the product and choose a next step without learning “No Timer” terminology.
- The homepage contains one availability message, not several repeated shutdown messages.
- The directory never remains indefinitely in a loading state and never presents unavailable presence as bookable.
- A draft survives a browser restart and clearly communicates its storage scope.
- Long tool forms explain value and data handling before asking for sensitive details.
- Sign-in, legal, help, and account pages are usable without visible implementation instructions.
- Existing contract and UI/accessibility suites remain green.
