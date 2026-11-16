# Customer Home Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the authenticated customer home into a compact, action-led dashboard that makes finding a Pandit and choosing Chat Now or a scheduled session the clear next step.

**Architecture:** Keep `CustomerNav` as the single account-level navigation. Replace the repeated shortcut grid and text-heavy overview with a primary next-step panel, compact live summary cards, and a small secondary-links section. Continue using the existing `/bookings`, `/wallet`, and `/notifications/unread-count` API hooks so the redesign does not duplicate backend state or prices.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules/global CSS, Playwright UI tests, Node contract tests.

**Spec:** `C:\Users\roybe\.codex\attachments\c8f7903f-3cc0-42df-8a70-7f12ee0b4bfd\goal-objective.md`

## Global Constraints

- The page must have one visually dominant next action: find a Pandit and choose Chat Now or a scheduled session.
- Account-level destinations must not be repeated as a second navigation system and a full shortcut-card sitemap.
- Prepare-a-draft is optional and must not compete with booking as a primary action.
- Visible copy must not expose keyboard-test instructions such as “Press Escape to leave this notice.”
- Existing booking, wallet and notification API contracts remain the source of truth.
- Preserve the yellow/gold Pandit Talk theme and responsive behavior at 375px, 768px, 1024px and 1440px.

## Review Focus

- No-booking customer: one clear booking CTA, no four-button empty-state overload — covered by the empty-home UI test.
- Existing booking customer: next booking remains the primary panel with resume/detail actions — covered by the populated-home UI test.
- API loading and partial failure: layout stays stable and recovery remains available — covered by the loading/error UI test.
- Mobile and tablet widths: summary cards and actions stack without horizontal overflow — covered by responsive UI assertions.
- Accessibility: headings, labels and visible copy remain user-facing; keyboard-only recovery remains available without leaking implementation text — covered by copy and landmark assertions.

### Task 1: Define the redesigned home contract in tests

**Files:**
- Modify: `pandittalk-website/tests/ui/ux-overhaul.spec.ts`

**Interfaces:**
- Consumes: existing `/home` fixture and API route mocks.
- Produces: browser assertions for the new primary action, summary hierarchy, removed duplicate grid and responsive layout.

- [ ] **Step 1: Add failing tests** for the empty state, populated state, error/loading recovery, visible-copy cleanup and responsive layout.
- [ ] **Step 2: Run the focused Playwright tests** and confirm they fail because the old shortcut grid and multi-action notice still exist.

### Task 2: Recompose the customer home page

**Files:**
- Modify: `pandittalk-website/src/app/(customer)/home/page.tsx`
- Modify: `pandittalk-website/src/features/account/HomeOverview.tsx`

**Interfaces:**
- Consumes: existing `Booking`, wallet, unread-count and `useApi` data.
- Produces: one primary next-step panel, compact live summary cards, and a small secondary-links section.

- [ ] **Step 1: Replace the page-level nine-card shortcut grid** with the redesigned content structure.
- [ ] **Step 2: Replace the overview toolbar and empty state** with a subtle refresh control, meaningful booking-first copy, one primary Explore Pandits CTA and one secondary How it works link.
- [ ] **Step 3: Render wallet, updates and reports as compact status cards** with clear values and one action each.
- [ ] **Step 4: Preserve populated next-booking and partial-error recovery behavior** while removing visible Escape/test instructions and repeated draft/tool links.
- [ ] **Step 5: Add a compact “More from your space” section** for lower-priority tools, story and optional draft access without competing with booking.

### Task 3: Implement responsive visual hierarchy

**Files:**
- Modify: `pandittalk-website/src/features/account/customer.module.css`
- Modify: `pandittalk-website/src/app/globals.css` only if a shared rule is required

**Interfaces:**
- Consumes: the new home class names and existing theme tokens.
- Produces: stable desktop/tablet/mobile layouts with no horizontal overflow, balanced card proportions, and visible focus/hover states.

- [ ] **Step 1: Add the primary-panel, summary-grid and secondary-links styles** using the existing cream/gold palette.
- [ ] **Step 2: Add breakpoints for 375px, 768px, 1024px and 1440px behavior**, including stacked primary actions and two/one-column summary cards.
- [ ] **Step 3: Remove or override the old home-tile sizing rules** so the page does not retain the oversized nine-card layout.
- [ ] **Step 4: Verify keyboard focus, contrast, wrapping and reduced-motion-safe transitions.**

### Task 4: Verify and ship

**Files:**
- No additional production files.

- [ ] **Step 1: Run the focused UI tests and the complete website test suite.**
- [ ] **Step 2: Run website lint, typecheck/build and `git diff --check`.**
- [ ] **Step 3: Inspect screenshots at desktop, tablet and mobile widths.**
- [ ] **Step 4: Commit only the scoped home-dashboard changes and push them.**

