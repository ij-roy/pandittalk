# Cross-platform navigation parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align signed-in mobile and website navigation around the same five primary PanditTalk destinations and make the website responsive at mobile widths.

**Architecture:** Keep the existing mobile tab bar as the source of truth. Simplify the mobile drawer, replace the website’s duplicate customer navigation with a responsive five-item customer nav, and make the global website header render app destinations when signed in while preserving public navigation for signed-out users.

**Tech Stack:** Expo Router, React Native, Next.js App Router, React, CSS Modules/global CSS, Node contract tests, Playwright.

---

### Task 1: Lock the navigation contract with regression tests

**Files:**
- Create: `pandittalk-website/tests/contracts/navigation-parity.test.ts`
- Test: `pandittalk-website/tests/contracts/navigation-parity.test.ts`

- [ ] **Step 1: Write source-level tests for the five primary destinations and secondary-menu cleanup.**
- [ ] **Step 2: Run the contract test and verify it fails against the current duplicate navigation.**

### Task 2: Simplify the mobile drawer

**Files:**
- Modify: `pandittalk-mobile/components/SideMenu.tsx`

- [ ] **Step 1: Remove the drawer search state, search field, and menu-search dependency.**
- [ ] **Step 2: Remove the duplicate Profile row while keeping the profile header actionable.**
- [ ] **Step 3: Rename My Sessions and My Reports to Sessions and Reports and group the remaining rows.**
- [ ] **Step 4: Run mobile typecheck and the navigation contract test.**

### Task 3: Replace the website customer sub-navigation

**Files:**
- Modify: `pandittalk-website/src/app/(customer)/layout.tsx`
- Modify: `pandittalk-website/src/features/account/CustomerNav.tsx`
- Modify: `pandittalk-website/src/features/account/customer.module.css`

- [ ] **Step 1: Render the customer nav as a mobile-only five-item bottom bar.**
- [ ] **Step 2: Use Consult, Experts, Guidance, Tools, and Profile labels with existing route-compatible destinations.**
- [ ] **Step 3: Add responsive safe-area padding and remove the old desktop account bar styling.**
- [ ] **Step 4: Run website typecheck and contract tests.**

### Task 4: Align the signed-in website header

**Files:**
- Modify: `pandittalk-website/src/components/site/SiteHeader.tsx`
- Modify: `pandittalk-website/src/components/site/SiteIcon.tsx`
- Modify: `pandittalk-website/src/app/globals.css`

- [ ] **Step 1: Select app navigation links when signed in and preserve public links when signed out.**
- [ ] **Step 2: Replace signed-in My home/Account/Updates text links with Consult-area navigation, notification, Wallet, and Profile controls.**
- [ ] **Step 3: Keep secondary account links in the mobile menu without repeating the five bottom destinations.**
- [ ] **Step 4: Add responsive styles for the app header and profile menu without changing the brand palette.**
- [ ] **Step 5: Run lint, typecheck, contract tests, and responsive UI tests.**

### Task 5: Verify the full cross-platform result

**Files:**
- Modify: `Decisions.md`

- [ ] **Step 1: Append the navigation decision without modifying existing decision history.**
- [ ] **Step 2: Run website contracts, website build, website lint, mobile typecheck, mobile lint, and mobile tests.**
- [ ] **Step 3: Run the responsive Playwright checks at mobile and desktop widths.**
- [ ] **Step 4: Inspect the final diff and report any environment-only failures separately.**
