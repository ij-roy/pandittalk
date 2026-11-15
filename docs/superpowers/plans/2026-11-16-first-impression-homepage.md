# First-Impression Homepage Implementation Plan

> **For Codex:** Use `superpowers:executing-plans` to execute this plan task by task with TDD.

**Goal:** Shorten and clarify the Pandit Talk homepage so first-time visitors understand the service, trust it, and find a relevant next step on mobile and desktop.

**Spec:** `docs/superpowers/specs/2026-11-16-first-impression-homepage-design.md`

**Architecture:** Keep the existing Next.js page, shared header/footer, icons, FAQ component, and notification form. Recompose the homepage and its scoped CSS. Remove the homepage dependency on `ExpertDirectory`; the directory remains unchanged on `/pandits`. Add small locally owned components adapted from React Bits interaction patterns rather than installing a large animation system.

**Tech stack:** Next.js 15, React 19, TypeScript, CSS, Playwright, axe-core.

## Global constraints

- Do not invent testimonials, experts, ratings, review counts, customer counts, or outcomes.
- Do not change service availability or legal claims.
- Do not remove topics or dedicated directory functionality.
- Use existing design tokens and components.
- Preserve keyboard behavior, 44px minimum targets, reduced-motion support, and large-text reflow.
- Make all local file edits with `apply_patch`.
- Commit with the repository's configured author and no assistant attribution.

## Task 1: Specify the first-visit hierarchy in UI tests

**Files:**

- Modify: `pandittalk-website/tests/ui/ux-overhaul.spec.ts`
- Modify: `pandittalk-website/tests/ui/responsive.spec.ts`

**Steps:**

1. Add Playwright assertions that the homepage has no `.hero-brand`, exactly two hero buttons, a visible hero guide, no hero form, and one update form near the end.
2. Add assertions that homepage main content contains no timer/countdown language and no Pandit skeleton/loading state.
3. Add responsive assertions at 390px and 1440px for normal email field height, two/four topic columns, and balanced hero behavior.
4. Add assertions for reveal/spotlight enhancement hooks and reduced-motion visibility.
5. Run the focused tests and confirm they fail for the missing redesign, not because of test setup.

**Expected:** Focused Playwright tests fail on the current duplicate brand, extra hero action, hero form, missing guide, oversized input, and current topic layout.

**Commit:** Include these tests with Task 2 after they pass.

## Task 2: Recompose the homepage and fix the form sizing defect

**Files:**

- Modify: `pandittalk-website/src/app/page.tsx`
- Modify: `pandittalk-website/src/app/globals.css`
- Create: `pandittalk-website/src/components/site/RevealOnScroll.tsx`
- Create: `pandittalk-website/src/components/site/SpotlightCard.tsx`

**Steps:**

1. Remove the duplicate brand, decorative-only hero card, third hero action, and hero waitlist form.
2. Add the practical three-step guide, trust points, and concise availability link.
3. Move topics directly after the hero and make their grid compact across responsive widths.
4. Replace the large conversation/story blocks with three concise trust/process cards.
5. Replace the homepage `ExpertDirectory` with an honest profile-exploration section that links to `/pandits` without fake data.
6. Keep the journal/tools pair, reduce FAQ items, remove the repeated closing CTA, and add one dedicated update panel at the end.
7. Correct `.notify-open-row .field input` so its flex basis cannot become vertical height.
8. Add restrained React Bits-inspired reveal and spotlight wrappers, a lightweight CSS hero aurora, and a hero line-art asset. Keep all content static for reduced-motion users.
9. Run the focused Playwright tests until green.

**Expected:** Focused homepage tests pass at 390px and 1440px, with a compact email field and no live directory skeleton.

**Commit:** `Improve homepage first impression`

## Task 3: Verify every supported screen size and regressions

**Files:**

- Modify only if a failing verification exposes a covered defect.

**Steps:**

1. Capture and visually inspect homepage screenshots at 320×568, 390×844, 768×1024, 1024×768, 1440×900, and 1920×1080.
2. Run contract tests, the complete Playwright UI suite, lint, build, and `git diff --check`.
3. Run an independent final code review against this plan and spec; fix Critical or Important findings through a new failing test before implementation.
4. Confirm the final diff contains no unrelated user changes and push the committed result to the existing remote branch requested by the user.

**Expected:** All checks pass, responsive screenshots show no overflow or disproportionate controls, and the remote branch contains the verified commit.

**Commit:** Amend only if verification requires fixes; otherwise no additional commit.

## Review focus

- First-screen clarity at 320×568 and 390×844.
- Tablet composition at 768×1024.
- Email field computed height and form wrapping.
- Honest behavior when the Pandit API is unavailable.
- Repeated CTAs and page length.
- Timer/countdown language accidentally leaking back into the homepage.
- Keyboard, large-text, reduced-motion, and no-horizontal-overflow behavior.

