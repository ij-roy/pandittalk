# Pandit Talk Footer Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the shared Pandit Talk footer compact, brand-led, balanced on desktop, and shorter on mobile while preserving every required destination and accessibility behavior.

**Architecture:** Keep `SiteFooter` responsible for content and grouping, keep `FooterNav` responsible for responsive disclosure and keyboard movement, and replace the old CTA/sitemap/bottom styles with three explicit layout bands. Legal remains a navigation group but receives a two-column desktop link grid so its height no longer creates dead space.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS in `src/app/globals.css`, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-16-footer-redesign-design.md`

## Global Constraints

- Preserve all existing footer destinations, including legal, accessibility, support, grievance, and account links.
- Do not add decorative footer dots, footer animation, or a second landing-page-sized CTA section.
- Keep mobile disclosure native and keyboard accessible.
- Keep touch targets at or above 44px for footer links and summaries.
- Preserve the user's existing uncommitted palette test changes in `tests/ui/ux-overhaul.spec.ts`.
- Verify the required responsive viewports: 320, 360, 375, 390, 414, 768, 1024, 1280, 1366, 1440, and 1920px widths.

## Review Focus

- A first-time visitor must see the brand and one clear useful action without a duplicate draft CTA; covered by the updated footer hierarchy test.
- Legal must not become a tall isolated desktop column; covered by the desktop Legal grid test.
- Expanded mobile navigation must keep usable touch targets and avoid horizontal overflow; covered by the mobile footer test and responsive suite.
- Utility information must remain scannable with Back to top in the same visual row; covered by the utility structure test.
- Keyboard behavior and reduced-motion behavior must not regress; covered by the existing UX and responsive suites.

### Task 1: Pin the new footer contract with Playwright tests

**Files:**
- Modify: `pandittalk-website/tests/ui/ux-overhaul.spec.ts` (footer tests only; preserve the user's appended palette test)

**Interfaces:**
- Consumes: Current shared footer selectors and route fixtures.
- Produces: Assertions for `.footer-brand-row`, `.footer-actions`, `.footer-nav-group--legal`, `.footer-nav__items`, `.footer-utility-row`, and `.footer-back-top` used by later tasks.

- [ ] **Step 1: Replace the old CTA test with a brand-led footer test**

Assert that the footer contains the Pandit Talk brand link, one primary Explore Pandits button, no `Choose where to begin.` heading, no footer `Prepare a draft` link, and the concise explanatory sentence.

- [ ] **Step 2: Add desktop balance and utility structure assertions**

At 1440px, assert that the Legal group is present, its `.footer-nav__items` has two computed grid columns, the utility row contains copyright and Back to top, and the disclaimer is separated into the policy row.

- [ ] **Step 3: Extend the mobile footer test**

At 390px, assert groups start closed, opening Discover reveals links, every visible footer navigation link has a computed minimum height of at least 44px, and the footer has no horizontal overflow.

- [ ] **Step 4: Run the focused tests to verify the new contract fails against the current footer**

Run: `npm run test:ui -- --grep "footer"`

Expected: the new hierarchy assertions fail because the current implementation still renders the old oversized CTA and class structure.

### Task 2: Rebuild the footer component hierarchy

**Files:**
- Modify: `pandittalk-website/src/components/site/SiteFooter.tsx`
- Modify: `pandittalk-website/src/components/site/FooterNav.tsx`

**Interfaces:**
- Consumes: Existing route arrays, `organizationName`, `supportEmail`, `BackToTop`, `LinkKeyboardGroup`, and `SiteIcon`.
- Produces: The semantic class structure asserted in Task 1, with all existing routes preserved and the Legal group marked as `.footer-nav-group--legal`.

- [ ] **Step 1: Implement the brand/action row**

Use the existing logo asset and a compact Pandit Talk home link, add one concise visitor-facing sentence, and keep only the Explore Pandits primary action. Remove the old oversized heading, second draft action, and footer duplicate draft link.

- [ ] **Step 2: Add navigation item wrappers and Legal group semantics**

Wrap each `FooterNav` link list in `.footer-nav__items`; apply `.footer-nav-group--legal` to the Legal group without changing native `details` behavior or keyboard handling.

- [ ] **Step 3: Recompose the utility and policy rows**

Place copyright, support/free-tools/booking-update links, and Back to top in `.footer-utility-row`. Place the disclaimer plus editorial/accessibility links in `.footer-policy-row`.

### Task 3: Implement responsive footer styling

**Files:**
- Modify: `pandittalk-website/src/app/globals.css`

**Interfaces:**
- Consumes: Task 2 class names and existing theme tokens.
- Produces: A compact three-band layout with balanced desktop columns, two-column Legal links on desktop, native accordion presentation at 900px and below, and 44px mobile targets.

- [ ] **Step 1: Replace obsolete footer-top styles with brand/action styles**

Use restrained vertical padding, a visible footer boundary, a small logo/brand lockup, one action, and no oversized display heading.

- [ ] **Step 2: Balance desktop navigation and Legal**

Use a four-area grid with the Legal group internally split into two columns; tighten link rhythm and keep the main navigation visually subordinate to the brand row.

- [ ] **Step 3: Style utility and policy rows**

Keep copyright, support links, disclaimer, and Back to top grouped with intentional gaps and no isolated bottom control.

- [ ] **Step 4: Tighten mobile disclosure and small-screen stacking**

Keep all groups collapsed on mobile, preserve 44px link targets, use a shorter expanded link rhythm, and stack the brand/action and utility content without horizontal overflow.

### Task 4: Verify the redesigned footer

**Files:**
- No additional source files.

- [ ] **Step 1: Run focused footer UI tests**

Run: `npm run test:ui -- --grep "footer"`

Expected: all footer tests pass.

- [ ] **Step 2: Run the shared contract suite**

Run: `npm test`

Expected: all contract tests pass.

- [ ] **Step 3: Run lint, build, and responsive UI checks**

Run: `npm run lint` and `npm run build` and `npm run test:ui -- tests/ui/responsive.spec.ts`

Expected: lint has no errors, build exits 0, and every responsive route/viewport check passes.

- [ ] **Step 4: Inspect desktop and mobile screenshots**

Use the local preview at 1440×900 and 390×844 to confirm the footer is compact, the Legal column is balanced, the utility row reads as one group, and the mobile accordion does not create excessive dead space.
