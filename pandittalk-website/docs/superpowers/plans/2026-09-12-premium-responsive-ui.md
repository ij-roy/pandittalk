# Pandit Talk premium responsive UI implementation plan

**Goal:** Inspect the existing public website and improve its UI and UX across public, journal, legal and customer screens with a coherent premium glassmorphism style.

**Architecture:** Retain the existing Next.js routes and API contracts. Establish shared warm ivory/copper tokens, frosted surfaces, typography, spacing, form and navigation patterns in the root shell; make focused improvements to existing feature components.

**Constraints:** Preserve brand language and honest availability notices. Keep legal content intact. Do not invent practitioners, testimonials, availability or successful payments. Respect reduced motion, keyboard navigation, long content and 200% zoom. Do not deploy as part of local verification.

- [ ] Inspect live content and every route family; identify visual and interaction defects.
- [ ] Replace the flat shared styles with accessible glass surfaces, responsive type, aligned containers, consistent controls and mobile spacing.
- [ ] Improve shared navigation: current-page state, touch targets, Escape dismissal, link dismissal, bounded scrolling and keyboard focus.
- [ ] Recompose the home page using the existing brand hierarchy, a quiet decorative editorial visual, human topic prompts and clear next actions.
- [ ] Fix consultation/auth/tool journey usability and recoverable states.
- [ ] Improve account/customer layouts, forms and session controls.
- [ ] Unify journal/legal/public information layouts and remove conflicting chrome/theme styles.
- [ ] Run contract tests, TypeScript, ESLint, production build, responsive route checks, keyboard interaction checks and automated accessibility scans. Inspect generated screenshots.
- [ ] Record observed issues, fixes, test coverage and remaining environment-dependent limitations.
