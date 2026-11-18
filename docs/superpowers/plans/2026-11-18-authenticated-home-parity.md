# Authenticated Home Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the authenticated website home with the current professional mobile `Consult` home so both clients expose the same consultation-first journey and destinations.

**Architecture:** Keep the current mobile home components and brand treatment as the source of truth. Add a focused website authenticated-home composition around the existing account APIs and reuse existing website directory, guidance, journal, tools, booking, wallet, notification, and account routes. Add parity tests at the boundary instead of creating a cross-project runtime package, because the web and Expo projects have independent build roots.

**Tech Stack:** Next.js/React/Playwright for the website; Expo Router/React Native/TypeScript for mobile; existing PanditTalk design tokens and route contracts.

---

### Task 1: Lock the shared authenticated-home contract with failing tests

**Files:**
- Modify: `pandittalk-website/tests/ui/customer-home.spec.ts`
- Create: `pandittalk-mobile/scripts/verify-home-parity.cjs`

- [ ] **Step 1: Add website assertions first**

Extend the empty-state authenticated-home test to require the consultation-first content:

```ts
await expect(page.getByRole('heading', { name: 'Talk to a verified Pandit', exact: true })).toBeVisible();
await expect(page.getByRole('link', { name: /Browse pandits/i })).toBeVisible();
await expect(page.getByRole('link', { name: /Chat Now/i })).toBeVisible();
await expect(page.getByRole('link', { name: /Book chat, audio or video/i })).toBeVisible();
await expect(page.getByRole('heading', { name: 'What would you like to discuss?', exact: true })).toBeVisible();
await expect(page.getByRole('link', { name: 'Career' })).toBeVisible();
await expect(page.getByRole('link', { name: 'Helpful reading' })).toBeVisible();
await expect(page.getByRole('link', { name: 'Optional self-service tools' })).toBeVisible();
```

Keep existing booking and account-status assertions so functionality is not lost.

- [ ] **Step 2: Add the mobile parity verifier before implementation**

Create a source verifier that reads `app/(tabs)/index.tsx` and checks for the shared phrases `Talk to a verified pandit`, `Chat Now`, `Book chat, audio or video`, `What would you like to discuss?`, `Helpful reading`, and `Optional self-service tools`. Also assert the source contains the shared `/experts`, `/articles`, and `/tools` destinations.

- [ ] **Step 3: Run focused tests and observe expected failures**

Run:

```powershell
cd pandittalk-website
npm run test:ui -- --workers=1 tests/ui/customer-home.spec.ts -g "shared authenticated-home"
cd ..\pandittalk-mobile
node scripts/verify-home-parity.cjs
```

Expected: the website fails because the current authenticated home is account-summary-only, while the mobile verifier establishes the contract that the implementation must preserve.

### Task 2: Add the consultation-first authenticated-home composition to the website

**Files:**
- Modify: `pandittalk-website/src/features/account/HomeOverview.tsx`
- Modify: `pandittalk-website/src/app/(customer)/home/page.tsx`
- Modify: `pandittalk-website/src/features/account/customer.module.css`

- [ ] **Step 1: Add the same mobile-inspired consultation hero**

Use the current mobile wording and visual order:

```tsx
<p className="eyebrow">Live Pandit consultations</p>
<h2>Talk to a verified Pandit</h2>
<p>Start a live chat or book an audio or video consultation with an expert you trust.</p>
<Link className="button" href="/pandits">Browse Pandits</Link>
<Link className="button secondary" href="/pandits">Chat Now</Link>
<Link className="text-link" href="/how-it-works">How it works →</Link>
```

Keep next-booking and past-booking states task-led, with a direct `Browse Pandits` action.

- [ ] **Step 2: Add the same consultation sections used by mobile**

Add the shared topic heading and links, followed by `Helpful reading`, `Optional self-service tools`, `Prepare a private note`, and `Help`. Use existing website routes and minimum 44px targets.

- [ ] **Step 3: Keep account status, but make it secondary**

Retain Bookings, Wallet, Updates, and Reports status cards and existing retry/error behavior. Place them after the consultation action so they support rather than dominate the first screen.

- [ ] **Step 4: Match mobile’s existing brand language responsively**

Use current cream, gold, sage, border, and ink variables. At desktop, use a two-column consultation panel; at 390–620px, stack actions and topic tiles without horizontal overflow. Do not introduce a new color theme or remove current accessibility behavior.

- [ ] **Step 5: Run customer-home tests**

Run `cd pandittalk-website; npm run test:ui -- --workers=1 tests/ui/customer-home.spec.ts` and expect all booking, error, responsive, and shared-home assertions to pass.

### Task 3: Preserve the mobile visual system while closing parity gaps

**Files:**
- Modify: `pandittalk-mobile/app/(tabs)/index.tsx`
- Modify: `pandittalk-mobile/components/TabTopHeader.tsx` only if matching status destinations need a visible entry
- Modify: `pandittalk-mobile/app/(tabs)/_layout.tsx` only if tab labels need to match website destination vocabulary
- Create: `pandittalk-mobile/scripts/verify-home-parity.cjs`

- [ ] **Step 1: Keep the current mobile hero and rails**

Do not replace `HeroBanner`, `Chat Now`, `Book chat, audio or video`, `Helpful reading`, or `Optional self-service tools` with a generic dashboard. Only normalize copy case and accessibility labels when needed for cross-platform matching.

- [ ] **Step 2: Make the home search honest**

If the home search continues to query only articles, change its placeholder and accessibility label to `Search journal articles`. Keep Pandit discovery on the `Browse pandits` path so it matches the website.

- [ ] **Step 3: Keep account destinations reachable without crowding the hero**

Wallet, Notifications, Bookings, Reports, and Profile must remain reachable through the header, menu, tabs, or secondary home links on mobile just as they are on the website.

- [ ] **Step 4: Run mobile checks**

Run:

```powershell
cd pandittalk-mobile
npm run typecheck
npm run lint -- --no-cache
node scripts/verify-home-polish.cjs
node scripts/verify-home-parity.cjs
```

Expected: typecheck and verifier scripts pass; lint has no new errors.

### Task 4: Full parity and production verification

**Files:**
- Modify: `Decisions.md` by appending one new entry only after verification

- [ ] **Step 1: Run website contracts and full UI coverage**

Run `cd pandittalk-website; npm test` and `npm run test:ui -- --workers=1`. Expect all contract, responsive, and accessibility coverage to pass.

- [ ] **Step 2: Run the isolated website production build**

Stop the website dev server before running `npm run build`, then restart it and verify the local and tunneled website still respond.

- [ ] **Step 3: Append the implementation decision without modifying earlier entries**

Append:

```markdown
## 2026-11-18 — Use the mobile Consult home as the authenticated-home source of truth

- Decision: Preserve the current mobile Consult home’s consultation-first visual hierarchy and align the authenticated website home to the same hero, actions, topic discovery, journal, tools, private preparation, and account-status destinations.
- Why: The mobile home is the more professional and task-oriented experience. The website previously presented an account dashboard while mobile presented a consultation feed, making the same signed-in product feel different across clients.
- Impact: Both clients now teach the same post-login journey and expose the same core destinations; platform-specific layout remains responsive and native while brand tokens, copy, and primary actions stay aligned.
```

- [ ] **Step 4: Run final whitespace verification**

Run:

```powershell
git diff --check
```

Report the final test and build evidence with links to changed files.
