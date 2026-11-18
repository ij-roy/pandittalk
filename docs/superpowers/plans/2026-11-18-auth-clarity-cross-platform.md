# Cross-Platform Auth Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make website and mobile authentication clearly communicate “sign in or create an account,” prioritize the phone action, expose legal links, and give an animated explanation when social sign-in needs consent.

**Architecture:** Keep the existing OTP and social-auth APIs unchanged. Update the website `AuthForm`/`SocialSignIn` and the mobile `login`/`SocialAuthButtons` presentation and interaction layers so both platforms share the same wording, ordering, and consent behavior. Use existing design tokens and add only small auth-specific style/attention states.

**Tech Stack:** Next.js 15, React 19, Playwright, Expo SDK 54, React Native, TypeScript.

---

### Task 1: Lock the required auth behavior with failing checks

**Files:**
- Modify: `pandittalk-website/tests/ui/ux-overhaul.spec.ts`
- Modify: `pandittalk-mobile/scripts/verify-login-layout.cjs`

- [ ] Add website assertions for the direct heading, removal of the old eyebrow text, visible legal-link styling, centered social heading, and social buttons that remain pressable before consent.
- [ ] Add a website interaction assertion that clicking a social button without consent produces the consent message and attention state.
- [ ] Replace the existing expectation that unconfigured social buttons are HTML-disabled with an expectation that they remain visible and explain their state through interaction.
- [ ] Extend the mobile source contract to require `Sign in or create your account`, the direct phone-account explanation, and consent-attention behavior in `SocialAuthButtons`.
- [ ] Run the focused website tests and `node scripts/verify-login-layout.cjs`; confirm they fail against the current implementation.

### Task 2: Fix website hierarchy and consent interaction

**Files:**
- Modify: `pandittalk-website/src/features/auth/AuthForm.tsx`
- Modify: `pandittalk-website/src/features/auth/SocialSignIn.tsx`
- Modify: `pandittalk-website/src/app/globals.css`

- [ ] Remove the `Your private Pandit Talk space` eyebrow without replacement.
- [ ] Change the heading to `Sign in or create your account.` and explain that an Indian mobile number either creates a new account or opens an existing one.
- [ ] Remove wallet/report language from the first screen and reduce the secondary “while you wait” and access-help emphasis.
- [ ] Move the age/terms/privacy consent row above the primary `Send code` action.
- [ ] Give the Terms & Conditions and Privacy Policy links a clear gold color, bold weight, underline, and visible focus state.
- [ ] Center the social separator label and reduce its visual weight relative to the phone form.
- [ ] Keep social buttons interactive when consent is missing; on press, focus the checkbox, show the existing accessible message, and apply a short attention animation. Keep true in-flight disabling.
- [ ] For genuinely unavailable providers, show a specific unavailable message instead of a silent dead control.
- [ ] Reduce vertical spacing around secondary notices and help links so the phone field, consent, and primary CTA dominate.

### Task 3: Match the mobile auth experience

**Files:**
- Modify: `pandittalk-mobile/app/login.tsx`
- Modify: `pandittalk-mobile/components/SocialAuthButtons.tsx`
- Modify: `pandittalk-mobile/components/premium-auth-ui.tsx` only if shared auth typography requires it

- [ ] Use the same `Sign in or create your account` wording and direct phone-account explanation as the website.
- [ ] Keep the checkbox before `Get OTP`, make legal links visibly bold and underlined, and preserve the same 18+ consent meaning.
- [ ] Center `or continue with` and keep provider buttons visually consistent with the website order.
- [ ] Make dimmed provider buttons pressable; animate the pressed button, show a toast explaining that consent is required, and focus/scroll to the checkbox.
- [ ] Preserve Google/Apple platform availability rules and all existing OTP, resend, cooldown, and legal URL behavior.

### Task 4: Verify, document, and inspect both layouts

**Files:**
- Modify: `Decisions.md` by appending only

- [ ] Run the focused website auth tests and the full website contract/UI suites.
- [ ] Run `node scripts/verify-login-layout.cjs`, `npm run typecheck`, and `npm run lint` in `pandittalk-mobile`.
- [ ] Render the website auth page at desktop and mobile sizes and inspect the hierarchy and interaction state.
- [ ] Launch or inspect the Expo development build login screen at a phone-sized viewport and verify matching copy/order/interaction.
- [ ] Append the cross-platform auth decision and constraints to `Decisions.md` without editing previous entries.
