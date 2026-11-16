# Pandit Talk human interaction system

## Intent

Make Pandit Talk feel responsive and human across the full website. A click, tap, scroll, route change, or data wait should communicate what happened without turning the calm yellow/gold visual language into a noisy animation showcase.

## Current state

- Global CSS has a small number of hover transitions and homepage-only reveal-on-scroll behavior.
- Buttons and links mostly change appearance instantly after activation; there is no shared pressed state or route transition cue.
- Four route-level `loading.tsx` files exist, but their visible loading treatment is mostly a generic notice followed by simple bars.
- Data-driven account, booking, report, notification, wallet, expert, guidance, and session screens each implement their own loading/error markup.
- Reduced-motion styles exist and must remain authoritative.

## Goals

- Give every interactive control a clear, calm press/hover/focus response within 150–320ms.
- Add lightweight page-entry and scroll-state choreography that works on touch, tablet, and desktop.
- Replace generic blank/notice waits with layout-shaped skeletons for meaningful route and API waits.
- Keep the existing professional yellow/gold palette, typography, spacing, and content hierarchy.
- Preserve keyboard, screen-reader, and reduced-motion behavior; motion must never hide content or block an action.
- Verify the system on 390px, 768px, 1024px, and 1440px viewports.

## Non-goals / anti-goals

- No new animation dependency or broad visual rebrand.
- No infinite decorative motion; looping animation is reserved for loading feedback.
- No layout-shifting hover transforms, auto-playing carousels, or animation on every scroll tick.
- No replacement of meaningful error/status text with visual-only indicators.

## Approach

Use a CSS-first interaction system with a few dependency-free client primitives where state is required:

1. Global interaction tokens and selectors for buttons, links, cards, summaries, form controls, and navigation. Pressed states use a short translate/shadow response; hover uses border/background/depth changes; focus remains highly visible.
2. A shared `MotionConfig`/`PageTransition` layer driven by `prefers-reduced-motion`, plus a scroll-aware header state and a small route progress cue for navigations that take long enough to observe.
3. A shared `Skeleton` component and page skeleton compositions. Route loading files and data-driven screens use shapes that match their eventual content (cards, list rows, forms, reports, wallet packs, and session panels).
4. Existing `RevealOnScroll` remains the section entrance mechanism, but gains a consistent stagger and a safe fallback. It is applied only to meaningful groups, not individual text fragments.

## Interaction design

- Timing: 160–220ms for hover/press, 260–360ms for section entry and route cues.
- Easing: `cubic-bezier(.2,.75,.25,1)` for entrance; `ease-out` for press release.
- Press: `transform: translateY(1px) scale(.99)` with a reduced shadow, then release; keyboard activation gets the same visual response without moving layout.
- Cards: a maximum 2px lift on hover/focus-visible, no transform on touch-only devices.
- Navigation: the sticky header gains a slightly stronger surface/shadow after scroll; mobile menu opens with a short opacity/translate transition and remains focus-trapped.
- Loading: skeletons use a restrained gold/sand shimmer; `prefers-reduced-motion: reduce` disables shimmer and uses a static surface.

## Skeleton coverage

- Route groups: root, auth, public, journal, legal, and customer loading shells.
- API screens: expert directory/detail, guidance expert selection, account/profile/story, bookings/list/detail, reports, notifications, wallet/recharge, and session queue.
- Action waits: keep existing labels such as “Refreshing…” or “Preparing secure checkout…” and add inline button progress rather than replacing the whole page.

## Accessibility and performance

- Respect `prefers-reduced-motion` for every transition, keyframe, and scroll behavior.
- Keep status text in the accessibility tree; skeleton decoration is `aria-hidden` and containers expose `aria-busy`.
- Never rely on motion alone to communicate state.
- Avoid forced reflow; use opacity/transform and a single passive scroll listener or `IntersectionObserver`.
- Keep initial route code dependency-free and avoid adding a motion package.

## Builder-check decisions

- Route progress is for same-origin, non-hash, non-download navigations activated without modifier keys or a new target. It starts after 120ms, clears on pathname/search changes, `popstate`, `pagehide`, or cancellation, and never blocks a hard reload.
- Press feedback is CSS `:active`/focus behavior on native links and buttons; it does not add `aria-pressed` to one-shot actions or pretend third-party controls are native controls.
- Initial API loads use skeletons when no stale data exists. Refreshes keep stale content visible, mark the region busy, and use the shared inline progress treatment instead of replacing useful content.
- The root and auth route groups receive loading shells in addition to public, journal, legal, and customer shells. Each shell keeps one polite status message and hides decorative skeletons from assistive technology.
- The header scroll state uses a 16px threshold, is initialized after hydration, changes only surface/shadow, and is disabled while the mobile menu owns the viewport.
- Mobile menu opening may animate; closed menus remain `display:none`/inert for focus safety, so closing is an immediate visibility change followed by focus restoration.
- Shared reveal delays are capped at 320ms and use a 70ms stagger between grouped cards.

## Verification

- Add UI tests for pressed-state class/attribute behavior, route loading skeleton semantics, reduced-motion behavior, and no horizontal overflow.
- Run focused Playwright checks at 390/768/1024/1440px, lint/type checks, and the existing project test suite.
- Capture screenshots of representative public, account, booking, tools, and session/loading states and inspect them visually before completion.

