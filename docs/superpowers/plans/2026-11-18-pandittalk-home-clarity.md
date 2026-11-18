# PanditTalk Homepage Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the homepage immediately communicate that PanditTalk connects visitors with real Pandits for private online consultations, while keeping the existing calm visual identity.

**Architecture:** Update the existing homepage copy and accessible labels in `src/app/page.tsx`; do not introduce a new component or change routes. Preserve the current visual system and use the existing panel, button, icon, and section classes. Update the homepage UI contract assertions, then verify with the existing test and production build commands.

**Tech Stack:** Next.js 15, React 19, TypeScript, Playwright, existing PanditTalk CSS design system.

---

### Task 1: Define the clearer homepage contract

**Files:**
- Modify: `pandittalk-website/tests/ui/ux-overhaul.spec.ts`

- [x] Replace assertions for the old abstract hero headline, supporting copy, hero card title, and section heading with the concrete consultation language:

```ts
await expect(page.getByRole('heading', { level: 1 })).toHaveText('Talk to a real Pandit about what’s on your mind.');
await expect(page.locator('.hero-copy > .button')).toHaveText(/Find a Pandit/);
await expect(page.getByText('Find guidance for love, marriage, career, family, or finances.', { exact: false })).toBeVisible();
await expect(page.getByRole('heading', { name: 'Find the right Pandit for your question.', exact: true })).toBeVisible();
await expect(page.getByRole('heading', { name: 'Find guidance for your question.', exact: true })).toBeVisible();
```

- [x] Add assertions that the homepage distinguishes human consultations from automated tools and exposes the new process language.

- [x] Run `npm test` from `pandittalk-website` and run the focused Playwright test so the changed contract fails before the implementation is updated.

### Task 2: Implement concrete service positioning

**Files:**
- Modify: `pandittalk-website/src/app/page.tsx`

- [x] Update homepage metadata to describe real Pandit profiles, private chat, timed sessions, and clearly labelled automated tools.

- [x] Replace the hero headline, supporting copy, and primary CTA with the concrete consultation message and `Find a Pandit` label.

- [x] Replace the hero process card title and all three step descriptions with topic selection, profile comparison, and chat/session selection.

- [x] Replace vague trust chips with concrete expectations: real profiles, private conversations, free browsing, and transparent booking terms.

- [x] Add the explicit distinction that consultations are with people and automated tools are separate and labelled.

- [x] Update the topic section, assurance section, Pandit preview section, learning section, and FAQ heading/links so they use direct service language without changing their routes or behavior.

### Task 3: Verify responsive rendering and regression safety

**Files:**
- No additional files.

- [x] Run `npm test`.

- [x] Run targeted ESLint on the changed files; the repository-wide `npm run lint` scan was also attempted but hung without output.

- [x] Run `npm run build`.

- [x] Use the running local website to inspect the desktop and mobile homepage, confirming the hero remains readable, the CTA remains visible, and the concrete copy does not overflow at mobile width.

- [x] Append the homepage positioning decision to the root `Decisions.md` without changing existing entries.
