# Human Interaction System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Pandit Talk feel responsive and human with consistent micro-interactions, scroll-aware states, and layout-shaped loading feedback across public, account, booking, tools, and session flows.

**Architecture:** Keep the existing Next.js App Router and CSS architecture. Add one dependency-free client motion coordinator for navigation/scroll state, one reusable skeleton component for meaningful waits, and shared CSS tokens/selectors for press, hover, entry, and loading behavior. Adopt those primitives in route loading shells and the existing `useApi` screens without changing business logic.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, existing global CSS, Playwright UI tests.

**Spec:** `docs/superpowers/specs/2026-11-16-human-interactions-design.md`

## Global Constraints

- Preserve the existing yellow/gold theme, typography, spacing, and content hierarchy.
- No new animation dependency; use CSS and small client components.
- Motion must respect `prefers-reduced-motion: reduce`.
- Skeleton decoration is `aria-hidden`; loading containers expose `aria-busy` and keep readable status text.
- No infinite decorative motion; looping animation is for loading feedback only.
- Verify at 390px, 768px, 1024px, and 1440px.
- Route progress ignores modifier/new-tab/hash/download activations and clears on pathname/search changes, `popstate`, `pagehide`, or cancellation.
- Initial API loads use skeletons only when no stale data exists; refreshes keep stale content visible with `aria-busy` and inline progress.

## Review Focus

- A tap/keyboard activation must feel acknowledged without causing layout shift. Test by holding a button/link and inspecting its pressed transform.
- Reduced-motion users must see no transitions, shimmer, or route progress animation. Test with Playwright emulation.
- A slow route/API response must retain useful status text and show a layout-shaped skeleton, not a blank panel. Test public loading and at least two API screens with delayed responses.
- Scroll state must not change header geometry or create horizontal overflow. Test phone/tablet/desktop scroll dimensions.
- Skeletons must disappear cleanly when data arrives and must not remain in the accessibility tree. Test `aria-busy` and `aria-hidden` transitions.

---

### Task 1: Add failing interaction and loading regression coverage

**Files:**
- Modify: `pandittalk-website/tests/ui/ux-overhaul.spec.ts`

**Interfaces:**
- Consumes: current public pages and existing route/API mocks.
- Produces: executable coverage for press feedback, route progress, scroll state, reduced motion, and skeleton semantics.

- [ ] **Step 1: Write failing tests**

  Add tests that:
  - hold the homepage primary button and assert its computed transform changes while pressed;
  - click a same-origin route link while delaying the response and assert `#route-progress` becomes visible, then disappears after navigation;
  - scroll the homepage and assert the header exposes a `data-scrolled="true"` state without changing `document.documentElement.scrollWidth`;
  - emulate reduced motion and assert the route progress has no animation and the reveal/skeleton animation names are `none`;
  - delay `/api/backend/experts`, assert an `aria-busy` results region and `aria-hidden` skeleton rows, then fulfill data and assert the rows replace the skeletons.

- [ ] **Step 2: Run the focused tests to verify the expected failures**

  Run from `pandittalk-website`:

  ```powershell
  $env:UI_BASE_URL='http://localhost:3000'; npx playwright test tests/ui/ux-overhaul.spec.ts -g 'interaction|route progress|scroll state|reduced motion|skeleton' --workers=1 --trace=off --reporter=line
  ```

  Expected: failures because the route progress node, scroll state attribute, and shared press/skeleton behavior do not yet exist.

### Task 2: Build the shared motion coordinator and interaction CSS

**Files:**
- Create: `pandittalk-website/src/components/site/SiteMotion.tsx`
- Modify: `pandittalk-website/src/app/layout.tsx`
- Modify: `pandittalk-website/src/components/site/SiteHeader.tsx`
- Modify: `pandittalk-website/src/app/globals.css`

**Interfaces:**
- Consumes: `usePathname`, existing site header/menu structure, `prefers-reduced-motion`.
- Produces: `<SiteMotion />`, `#route-progress`, `html[data-scroll-state]`, and shared pressed/hover/page-entry selectors.

- [ ] **Step 1: Implement `SiteMotion`**

  Render a visually unobtrusive `#route-progress` bar with `role="progressbar"` and `aria-hidden="true"`. Listen for same-origin anchor activations without modifier keys, new targets, downloads, or hash-only changes; delay showing progress by 120ms to avoid flashes, and clear it on pathname/search changes, `popstate`, `pagehide`, or cancellation. Add a passive scroll listener that toggles `document.documentElement.dataset.scrollState` between `top` and `scrolled` at a 16px threshold using `requestAnimationFrame`. Disable route animation work when reduced motion is requested.

- [ ] **Step 2: Mount `SiteMotion` in the root layout**

  Render it once inside `<body>` beside `SiteHeader`, so every route receives the same coordinator without changing page components.

- [ ] **Step 3: Add header scroll state**

  Give `SiteHeader` a `data-scroll-state` derived from the document state (or a CSS parent selector) and ensure the sticky shell changes only shadow/background opacity, never its measured height or horizontal bounds.

- [ ] **Step 4: Add global motion selectors**

  Extend `globals.css` with:
  - shared 160–220ms transitions for `.button`, links, cards, summaries, and form controls;
  - `:active` press transform/shadow feedback;
  - `page-enter` opacity/translate entry for newly mounted page content;
  - route progress styling in gold/sand;
  - mobile menu opacity/translate open state;
  - `@media (prefers-reduced-motion: reduce)` overrides that remove transforms, transitions, keyframes, and smooth scroll.

- [ ] **Step 5: Run Task 1 tests**

  Expected: all shared interaction, route progress, scroll, and reduced-motion assertions pass except skeleton adoption assertions owned by Task 3.

### Task 3: Create reusable skeleton primitives and improve route loading shells

**Files:**
- Create: `pandittalk-website/src/components/site/Skeleton.tsx`
- Modify: `pandittalk-website/src/app/globals.css`
- Create: `pandittalk-website/src/app/loading.tsx`
- Create: `pandittalk-website/src/app/(auth)/loading.tsx`
- Modify: `pandittalk-website/src/app/(public)/loading.tsx`
- Modify: `pandittalk-website/src/app/(customer)/loading.tsx`
- Modify: `pandittalk-website/src/app/(journal)/loading.tsx`
- Modify: `pandittalk-website/src/app/(legal)/loading.tsx`

**Interfaces:**
- Consumes: existing `skeleton-line`, `skeleton-block`, and `skeleton-button` styles.
- Produces: `Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonRows`, and `PageLoadingShell` components with `aria-hidden` decoration and consistent gold shimmer/static reduced-motion behavior.

- [ ] **Step 1: Add `Skeleton.tsx`**

  Define typed variants (`line`, `block`, `avatar`, `button`, `card`) and compositions for text, cards, rows, and page shells. Keep all decorative nodes `aria-hidden` and expose a visually hidden loading label through the shell.

- [ ] **Step 2: Expand skeleton CSS**

  Add component classes for avatars, cards, list rows, form fields, and article/legal bodies. Keep dimensions fluid with `minmax(0,1fr)` and clamp widths so no skeleton can cause horizontal overflow.

- [ ] **Step 3: Replace generic route loading markup**

  Keep each route’s existing recovery links and status copy, but replace generic bar clusters with a composition matching the eventual page: root/auth form shells, public hero/cards, customer overview/cards, journal cards, and legal document paragraphs.

- [ ] **Step 4: Run delayed-route loading tests**

  Verify each route shell is visible, `aria-busy="true"` is present, skeleton decoration is hidden from assistive technology, and reduced motion produces a static skeleton.

### Task 4: Adopt skeleton and feedback states in data-driven features

**Files:**
- Modify: `pandittalk-website/src/features/experts/ExpertDirectory.tsx`
- Modify: `pandittalk-website/src/features/experts/ExpertDetail.tsx`
- Modify: `pandittalk-website/src/features/guidance/GuidanceFlow.tsx`
- Modify: `pandittalk-website/src/features/account/HomeOverview.tsx`
- Modify: `pandittalk-website/src/features/account/Account.tsx`
- Modify: `pandittalk-website/src/features/account/ProfileForm.tsx`
- Modify: `pandittalk-website/src/features/account/StoryContext.tsx`
- Modify: `pandittalk-website/src/features/bookings/BookingViews.tsx`
- Modify: `pandittalk-website/src/features/reports/Reports.tsx`
- Modify: `pandittalk-website/src/features/notifications/Notifications.tsx`
- Modify: `pandittalk-website/src/features/wallet/Wallet.tsx`
- Modify: `pandittalk-website/src/features/wallet/WalletRecharge.tsx`
- Modify: `pandittalk-website/src/features/sessions/SessionPage.tsx`
- Modify: `pandittalk-website/src/features/sessions/QueuePanel.tsx`

**Interfaces:**
- Consumes: `Skeleton` primitives and global interaction selectors.
- Produces: layout-shaped loading states and animated state transitions that preserve existing API/business behavior.

- [ ] **Step 1: Replace plain loading notices where a stable layout is known**

  Add skeleton compositions for lists, cards, profile headers, report detail, wallet packs, booking detail, notifications, and session queue. Keep existing readable status text and recovery links.

- [ ] **Step 2: Add transition-safe result swaps**

  Use keyed wrappers/classes to fade/slide skeletons out and loaded content in once. Do not animate height from zero or delay content after data is available. When `useApi` has stale data, keep it visible and only show busy/progress treatment.

- [ ] **Step 3: Add human feedback to long actions**

  Ensure existing `aria-busy` action labels keep a consistent inline spinner/progress treatment while preserving button width and preventing double submits.

- [ ] **Step 4: Run focused feature tests**

  Exercise delayed experts, bookings, reports, notifications, wallet, and session queue responses; verify skeleton-to-content replacement, no horizontal overflow, and reduced-motion behavior.

### Task 5: Full visual verification and cleanup

**Files:**
- Modify: `pandittalk-website/tests/ui/ux-overhaul.spec.ts` as needed for final assertions.
- Create: `pandittalk-website/output/ui-audit/motion-*` screenshots (generated artifacts only).

**Interfaces:**
- Consumes: all shared motion/skeleton behavior from Tasks 2–4.
- Produces: evidence across representative public, account, booking, tools, and session states.

- [ ] **Step 1: Run lint and type checks**

  ```powershell
  npx eslint src/components/site/SiteMotion.tsx src/components/site/Skeleton.tsx src/components/site/SiteHeader.tsx src/app/layout.tsx src/features tests/ui/ux-overhaul.spec.ts
  npx tsc --noEmit
  ```

- [ ] **Step 2: Run the full project tests**

  ```powershell
  npm test
  ```

- [ ] **Step 3: Run the complete UI suite with one worker**

  ```powershell
  $env:UI_BASE_URL='http://localhost:3000'; npx playwright test --workers=1 --trace=off --reporter=line
  ```

- [ ] **Step 4: Capture and inspect screenshots**

  Capture representative routes at 390×844, 768×1024, 1024×900, and 1440×900, including a delayed loading state. Confirm there is no layout shift, clipped skeleton, dead-looking click, or horizontal overflow.

- [ ] **Step 5: Run `git diff --check`, review the focused diff, and commit**

  Use a focused commit such as `ui: add human interaction and loading states`; leave unrelated worktree changes untouched.

