# PanditTalk Pre-launch UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current truthful-but-negative pre-launch website into a clear, useful, conversion-friendly experience without inventing unavailable product data.

**Architecture:** Keep the current Next.js route structure and CSS system. Add shared availability/copy primitives, bounded client loading, local draft/reading persistence, and focused page-level changes. Use Playwright journeys and Axe scans as the behavioral contract.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS, Playwright, Axe.

**Spec:** `docs/superpowers/specs/2026-11-15-prelaunch-ux-overhaul-design.md`

## Global Constraints

- Preserve existing public URLs and API contracts.
- Do not invent profiles, prices, availability, reviews, or bookings.
- Keep new website bookings, recharge, and paid purchases paused until backend terms are approved.
- Keep touch targets at least 44px and preserve reduced-motion behavior.
- No visible keyboard/screen-reader implementation instructions in normal marketing copy.
- Anonymous drafts/readings must state their storage scope and provide clear reset controls.

## Review Focus

- Slow or unavailable session/directory APIs must resolve to a useful state instead of indefinite loading; test delayed and failed responses in `tests/ui/ux-overhaul.spec.ts`.
- Anonymous draft persistence must survive a new page and clear intentionally; test reload/new-page behavior in `tests/ui/journeys.spec.ts`.
- Long and sensitive tool inputs must explain value and data handling before submission; test visible copy and palm capture attributes in `tests/ui/ux-overhaul.spec.ts`.
- Mobile policy navigation must expose the current policy without requiring hidden horizontal swiping; test at 390px in `tests/ui/responsive.spec.ts`.
- Guest and signed-in shells must show one concise status message and a useful next action; test header/account fixtures in `tests/ui/ux-overhaul.spec.ts`.

---

### Task 1: Shared availability language and homepage conversion shell

**Files:**
- Create: `pandittalk-website/src/content/availability.ts`
- Modify: `pandittalk-website/src/app/page.tsx`
- Modify: `pandittalk-website/src/components/site/SiteHeader.tsx`
- Modify: `pandittalk-website/src/components/site/SiteFooter.tsx`
- Modify: `pandittalk-website/src/components/site/OfferNotice.tsx`
- Modify: `pandittalk-website/src/components/site/NotifyOpenForm.tsx`
- Test: `pandittalk-website/tests/ui/ux-overhaul.spec.ts`

**Interfaces:**
- Produce `availabilityCopy.publicStatus`, `availabilityCopy.detail`, `availabilityCopy.existingBooking`, and `availabilityCopy.waitlistLabel` as readonly strings.
- Produce `AvailabilityNotice` copy behavior through existing `OfferNotice` props; do not create a second competing notice system.

- [ ] Write failing tests for the new homepage heading, primary/secondary CTA hierarchy, concise availability wording, and absence of visible “Press Escape”/keyboard implementation instructions.
- [ ] Run the targeted tests and confirm they fail against the current homepage.
- [ ] Add the shared copy module and refactor the homepage hero, closing section, header guest state, footer CTA, and waitlist labels to use it.
- [ ] Keep the availability form available once in the hero and once in the footer, but remove repeated page-level urgency and replace “No Timer” with plain-language explanation.
- [ ] Run the targeted tests and the existing homepage navigation tests.

### Task 2: Session and Pandit directory loading reliability

**Files:**
- Modify: `pandittalk-website/src/components/site/SiteHeader.tsx`
- Modify: `pandittalk-website/src/features/experts/ExpertDirectory.tsx`
- Modify: `pandittalk-website/src/features/experts/types.ts`
- Modify: `pandittalk-website/src/app/globals.css`
- Test: `pandittalk-website/tests/ui/ux-overhaul.spec.ts`

**Interfaces:**
- Add a small abortable timeout helper in the owning components, returning the existing guest/empty/error state after the timeout.
- Extend the profile card display with a `bookable?: boolean`/existing source-derived availability decision without changing the backend DTO.

- [ ] Write failing tests for a slow session request, a slow directory request, directory API failure, and a profile with presence but no booking availability.
- [ ] Run the targeted tests and confirm they fail or time out against the current behavior.
- [ ] Add bounded fetch behavior and distinct user-facing messages for loading, unavailable data, and no published profiles.
- [ ] Make “online” non-actionable when booking is paused and move recovery actions below the first useful directory content.
- [ ] Run directory, navigation, and responsive tests.

### Task 3: Guidance flow and durable anonymous drafts

**Files:**
- Modify: `pandittalk-website/src/features/guidance/state.ts`
- Modify: `pandittalk-website/src/features/guidance/GuidanceFlow.tsx`
- Modify: `pandittalk-website/src/app/globals.css`
- Modify: `pandittalk-website/tests/ui/journeys.spec.ts`
- Test: `pandittalk-website/tests/ui/ux-overhaul.spec.ts`

**Interfaces:**
- Keep `GuidanceDraft` stable.
- Keep `readDraft`, `saveGuidanceDraft`, and `clearGuidanceDraft` signatures stable while moving storage to `localStorage` and exposing a storage-scope message.
- Replace the status-only step with a useful outcome step and update visible step labels without changing URL compatibility.

- [ ] Write a failing journey that opens a draft, closes/reopens in a new page, and expects its notes to remain with “saved on this device” copy.
- [ ] Run the journey and confirm it fails because the current implementation uses session storage and the status-only step.
- [ ] Implement localStorage persistence with safe fallback, explicit storage scope, and the five-step customer flow.
- [ ] Add a clear/reset path that preserves the existing confirmation behavior.
- [ ] Run all guidance journeys.

### Task 4: Tool forms, privacy context, and local reading return value

**Files:**
- Modify: `pandittalk-website/src/features/tools/ToolForm.tsx`
- Modify: `pandittalk-website/src/features/tools/Reading.tsx`
- Modify: `pandittalk-website/src/app/(public)/tools/page.tsx`
- Modify: `pandittalk-website/src/app/globals.css`
- Modify: `pandittalk-website/tests/ui/journeys.spec.ts`
- Test: `pandittalk-website/tests/ui/ux-overhaul.spec.ts`

**Interfaces:**
- Add a local `RecentReading` record containing tool kind, created timestamp, and a bounded display summary; never persist birth details or palm images.
- Add `readRecentReadings`, `saveRecentReading`, and `clearRecentReadings` helpers inside the tool feature with safe storage fallback.

- [ ] Write failing tests for visible “what you’ll get” and data-use copy, palm input capture support, and a successful reading leaving a local recent-reading affordance.
- [ ] Run the targeted tests and confirm they fail.
- [ ] Add concise pre-form explanations, privacy/data-use messaging, mobile capture hints, and a bounded local result summary.
- [ ] Keep detailed tools informational while purchases are paused and clearly distinguish them from free tools.
- [ ] Run tool journeys, palm validation, and Axe scans.

### Task 5: Authentication and customer-shell simplification

**Files:**
- Modify: `pandittalk-website/src/features/auth/AuthForm.tsx`
- Modify: `pandittalk-website/src/components/site/SiteHeader.tsx`
- Modify: `pandittalk-website/src/features/account/CustomerNav.tsx`
- Modify: `pandittalk-website/src/app/(customer)/home/page.tsx`
- Modify: `pandittalk-website/src/features/account/customer.module.css`
- Test: `pandittalk-website/tests/ui/ux-overhaul.spec.ts`

**Interfaces:**
- Preserve existing auth API payloads and return-to behavior.
- Add a dismissible customer-shell status state stored only for the current browser session; account data remains server authoritative.

- [ ] Write failing tests for “Sign in or create your account,” immediate phone-field visibility, one concise pause notice, and account-home next action.
- [ ] Run targeted auth/customer tests and confirm failures.
- [ ] Reorder auth content, clarify age/phone constraints before submission, and remove repeated pause copy.
- [ ] Add a dismissible account notice and a useful empty-home next action without changing private route protection.
- [ ] Run customer and auth journeys at 320px and 390px.

### Task 6: Legal, help, footer, and visible instruction cleanup

**Files:**
- Modify: `pandittalk-website/src/components/legal/LegalShell.tsx`
- Modify: `pandittalk-website/src/components/legal/legal.css`
- Modify: `pandittalk-website/src/components/site/HomeFaq.tsx`
- Modify: `pandittalk-website/src/components/site/SiteFooter.tsx`
- Modify: `pandittalk-website/src/app/(public)/help/page.tsx`
- Modify: `pandittalk-website/src/app/(public)/contact/page.tsx`
- Test: `pandittalk-website/tests/ui/responsive.spec.ts`
- Test: `pandittalk-website/tests/ui/ux-overhaul.spec.ts`

**Interfaces:**
- Preserve policy URLs and `aria-current` semantics.
- Add a mobile policy selector that navigates to the same existing policy paths.

- [ ] Write failing tests for a mobile policy selector/current-label behavior and for absence of visible keyboard instructions in FAQ/legal/help surfaces.
- [ ] Run targeted responsive/Axe tests and confirm failures.
- [ ] Implement the selector, keep the current policy visible, and visually hide implementation hints while preserving accessible names/descriptions.
- [ ] Reduce repeated footer and support choices to a smaller decision set.
- [ ] Run the full responsive and accessibility suite.

### Task 7: Visual verification and regression cleanup

**Files:**
- Modify: `pandittalk-website/tests/ui/ux-overhaul.spec.ts`
- Modify: `pandittalk-website/tests/ui/responsive.spec.ts`
- Modify: `pandittalk-website/src/app/globals.css` only where screenshots demonstrate a regression.

- [ ] Capture homepage, directory, tools, login, legal, and customer-home screenshots at 390px and 1440px.
- [ ] Review for first-screen hierarchy, repeated warnings, clipped controls, and excessive mobile scroll.
- [ ] Fix only evidence-backed visual regressions and rerun targeted screenshots.
- [ ] Run `npm test`.
- [ ] Run `npm run test:ui -- --reporter=line`.
- [ ] Run `npm run build`.
- [ ] Review `git diff` and confirm no credentials, backend contracts, or unrelated files changed.
