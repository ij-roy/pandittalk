# Customer Home and Pandit Directory UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Strengthen visual hierarchy and booking affordance on `/home` and `/pandits` while preserving the gold/cream brand and backend truth.

**Architecture:** Recompose the existing React components rather than adding a parallel design system. The home continues to consume bookings/wallet/notifications/reports. The directory adds one public `/booking-catalog` query and keeps `/experts` as the profile source. CSS remains in the existing customer module and global directory rules.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules/global CSS, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-17-home-pandits-ux-design.md`

### Task 1: Lock the hierarchy contract with failing browser tests

**Files:**
- Modify: `pandittalk-website/tests/ui/customer-home.spec.ts`
- Modify: `pandittalk-website/tests/ui/journeys.spec.ts`

- [x] Assert that home Refresh has a visible label, summary cards expose a directional affordance, and lower-priority links are compact.
- [x] Assert that the directory shows backend catalog terms, gives each Pandit one primary availability action, and does not repeat draft/tool links.
- [x] Assert no horizontal overflow at 375, 768, 1024 and 1440.
- [x] Run the focused tests and confirm they fail for the missing behavior.

### Task 2: Recompose the customer home

**Files:**
- Modify: `pandittalk-website/src/app/(customer)/home/page.tsx`
- Modify: `pandittalk-website/src/features/account/HomeOverview.tsx`
- Modify: `pandittalk-website/src/features/account/customer.module.css`

- [x] Tighten the page intro and primary-panel spacing.
- [x] Replace non-interactive format cards with concise supporting copy.
- [x] Add a visible Refresh label and clear arrow affordances to linked summaries.
- [x] Convert secondary cards to compact lower-priority links with the note last.
- [x] Remove the duplicated customer-home stylesheet block.

### Task 3: Rebuild directory information hierarchy

**Files:**
- Modify: `pandittalk-website/src/app/(public)/pandits/page.tsx`
- Modify: `pandittalk-website/src/features/experts/ExpertDirectory.tsx`
- Modify: `pandittalk-website/src/features/experts/types.ts` only if source-derived fields are needed
- Modify: `pandittalk-website/src/app/globals.css`

- [x] Query the public booking catalog and render a single dynamic price/duration summary.
- [x] Remove routine draft/tool detours from filters, loading, cards and compact results.
- [x] Keep error/empty recovery narrowly focused on retry, clear filters, or support.
- [x] Restructure each Pandit row into predictable facts, honest availability, and one `View availability` CTA.
- [x] Compact mobile cards and strengthen hover/focus/active affordances.

### Task 4: Verify, visually inspect, and ship

**Files:**
- No additional production files.

- [x] Run focused tests and the full website browser and contract suites.
- [x] Run scoped lint, type checking, and `git diff --check`. A production build was not run against the `.next` directory owned by the active local development server.
- [x] Capture local screenshots at 375, 768, 1024 and 1440 for home and directory; compare against live production captures.
- [ ] Commit only scoped files with a neutral message and push.
