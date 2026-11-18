# Auth Hierarchy Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten the website and mobile authentication layouts so the phone field, consent, and primary action dominate without changing PanditTalk's existing brand system.

**Architecture:** Keep authentication behavior and API contracts unchanged. Apply layout-only changes through auth-scoped website CSS, a compact mobile hero option, and explicit responsive tests that measure the vertical order and spacing of the primary group.

**Tech Stack:** Next.js 15, React 19, Playwright, Expo SDK 54, React Native, TypeScript.

---

### Task 1: Add failing hierarchy checks

**Files:**
- Modify: `pandittalk-website/tests/ui/ux-overhaul.spec.ts`
- Modify: `pandittalk-mobile/scripts/verify-login-layout.cjs`

- [ ] **Step 1: Add website assertions for compact auth hierarchy.**

Add a Playwright test that visits `/login` at 390px and 1440px and asserts:

```ts
test('login gives the phone form the strongest visual hierarchy', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/login');
    const bounds = await page.evaluate(() => {
      const rect = (selector: string) => {
        const node = document.querySelector<HTMLElement>(selector);
        if (!node) throw new Error(`Missing ${selector}`);
        const box = node.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom, height: box.height };
      };
      return {
        page: rect('.auth-page'),
        panel: rect('.auth-panel'),
        phone: rect('input[name="phone"]'),
        consent: rect('#auth-social-consent'),
        primary: rect('.auth-panel form button[type="submit"]'),
        social: rect('.auth-social-heading'),
      };
    });
    expect(bounds.phone.bottom).toBeLessThan(bounds.social.top);
    expect(bounds.consent.top).toBeGreaterThan(bounds.phone.bottom);
    expect(bounds.primary.top).toBeGreaterThan(bounds.consent.bottom);
    expect(bounds.social.top - bounds.primary.bottom).toBeGreaterThanOrEqual(20);
    expect(bounds.panel.height).toBeLessThan(width === 390 ? 700 : 620);
  }
});
```

- [ ] **Step 2: Extend the mobile verifier for compact-brand rules.**

Require `compact` on the login `BrandHero`, a reduced logo halo style, and a reduced button spacer so the source contract prevents the large vertical stack from returning.

- [ ] **Step 3: Run the focused checks and confirm they fail.**

Run from `pandittalk-website`:

```powershell
npx playwright test tests/ui/ux-overhaul.spec.ts --grep "strongest visual hierarchy" --workers=1
```

Run from `pandittalk-mobile`:

```powershell
node scripts/verify-login-layout.cjs
```

Expected: the new website layout test fails on the current panel height/spacing, and the mobile verifier fails because `BrandHero` is not yet compact.

### Task 2: Tighten the website auth layout

**Files:**
- Modify: `pandittalk-website/src/app/globals.css`

- [ ] **Step 1: Reduce auth-only page and card spacing without changing global colors.**

Add auth-scoped overrides after the existing auth rules:

```css
.auth-page { max-width: 600px; padding-top: 30px; padding-bottom: 54px; }
.auth-page > h1 { max-width: 17ch; margin-bottom: 12px; font-size: clamp(2.2rem, 4vw, 3.35rem); }
.auth-page > .lede { max-width: 560px; margin-bottom: 18px; font-size: 1rem; line-height: 1.55; }
.auth-panel { margin: 18px 0 12px; padding: 22px; border-radius: 18px; }
.auth-panel > form.stack { gap: 14px; margin-top: 0; padding-top: 0; border-top: 0; }
.auth-panel > .stack:not(form) { gap: 14px; margin-top: 18px; padding-top: 16px; }
.auth-panel form .actions { margin: 2px 0 0; gap: 8px; }
.auth-panel form .actions .button:not(.secondary) { min-height: 52px; font-size: 1rem; }
.auth-availability { margin: 10px 0 0; padding: 8px 12px; border: 0; background: transparent; color: var(--muted); font-size: .82rem; text-align: center; }
.auth-help-links { margin-top: 8px; text-align: center; font-size: .78rem; }
```

Do not introduce new color variables or alter existing brand token values.

- [ ] **Step 2: Add responsive auth spacing.**

Inside the existing mobile media query, constrain the card and page padding while preserving minimum touch targets:

```css
.auth-page { padding: 24px 18px 40px; }
.auth-page > h1 { font-size: 2.2rem; }
.auth-panel { padding: 18px; }
.auth-panel > .stack:not(form) { margin-top: 14px; padding-top: 14px; }
```

- [ ] **Step 3: Run the focused website tests.**

Run:

```powershell
npx playwright test tests/ui/ux-overhaul.spec.ts --grep "strongest visual hierarchy|sign-in explains|social sign-in explains" --workers=1
```

Expected: all focused auth tests pass.

### Task 3: Compact the mobile auth hero and form rhythm

**Files:**
- Modify: `pandittalk-mobile/components/premium-auth-ui.tsx`
- Modify: `pandittalk-mobile/app/login.tsx`

- [ ] **Step 1: Add an opt-in compact `BrandHero`.**

Extend the props with `compact?: boolean`; when true, use a 76-point logo halo, a 50-point logo, a 22-point brand name, and a 16-point bottom margin. Keep all colors and typography tokens from the existing design system.

- [ ] **Step 2: Enable compact mode on login and tighten form spacing.**

Pass `compact` to the login hero, reduce `authIntro.marginBottom` to 16, reduce `btnSpacer.height` to 12, and keep the existing `Send code`/consent/social order unchanged.

- [ ] **Step 3: Run mobile verification.**

Run:

```powershell
npm run typecheck
node scripts/verify-login-layout.cjs
npm run lint -- --no-cache
```

Expected: typecheck and verifier pass; lint has no new errors.

### Task 4: Full regression and decision record

**Files:**
- Modify: `Decisions.md` by appending only

- [ ] **Step 1: Run website regression suites.**

Run from `pandittalk-website`:

```powershell
npm test
npm run test:ui -- --workers=1
npm run build
```

- [ ] **Step 2: Inspect live responsive bounds.**

Check `http://localhost:3000/login` at 390px and 1440px and confirm the primary form group appears before social/support content; check the public tunnel returns HTTP 200.

- [ ] **Step 3: Append the decision.**

Append a dated entry to `Decisions.md` explaining that the auth layout was tightened through spacing, width, and responsive hierarchy while preserving the existing brand tokens and behavior contracts. Do not edit earlier entries.

- [ ] **Step 4: Run `git diff --check` and report exact verification results.**
