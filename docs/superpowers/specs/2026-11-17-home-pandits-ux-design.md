# Customer Home and Pandit Directory UX Design

## Objective

Make the authenticated home and public Pandit directory feel ready for a large consumer service: task-led, easy to scan, honest about availability and price, and free of repeated detours that compete with booking.

## Evidence from the current screens

- The customer home uses a marketing-scale greeting before the user's actual task, then repeats navigation through an account tab bar, summary cards, secondary cards, and the global footer.
- The primary home panel gives two static format boxes the visual treatment of controls even though they are not interactive.
- Wallet, Updates, and Reports are clickable cards but lack a strong directional affordance; their empty values receive more visual weight than the primary action.
- The refresh action is an unexplained icon separated from the content it refreshes.
- The home stylesheet contains the entire customer-home ruleset twice.
- The directory repeats `Prepare a draft` and `Try free tools` in the toolbar, filter panel, slow-loading state, error/empty states, every Pandit row, and its compact footer.
- Directory cards devote more space to repeated secondary links and negative copy (`No published reviews yet`) than to the actual decision.
- The directory API is slow enough for the current 1.2-second fallback to appear in normal use; that fallback duplicates another pair of actions before skeleton rows.
- The backend publishes the current booking catalog, but the directory does not surface the duration and price users need before choosing a person.
- At mobile widths, each Pandit occupies a very tall card because three actions stack vertically, making comparison unnecessarily slow.
- Most production portraits currently fail to resolve, so a deliberate fallback presentation is required; the interface must not imply that generic initials are real portraits.

## Product and interaction direction

### Customer home

- Keep one dominant task: continue the next booking when present; otherwise explore Pandits.
- Reduce the greeting to supporting context and move the task panel higher in the first viewport.
- Replace the two non-interactive format cards with concise explanatory text inside the primary action area.
- Give Refresh a visible label and keep it adjacent to the overview heading.
- Keep Wallet, Updates, and Reports as compact linked summaries with a visible arrow and consistent hover/focus treatment.
- Replace the three large secondary cards with a compact lower-priority link list. Keep the browser-only note last and explain that it does not book or charge.
- Preserve the gold/cream palette and existing backend state; do not invent personalization or values.

### Pandit directory

- Use a shorter task-led heading and make filtering the immediate utility after it.
- Fetch `/booking-catalog` alongside `/experts` and display one source-of-truth booking summary above results: Chat Now duration/total and the lowest scheduled duration/base price.
- Remove draft/tool links from normal directory browsing and loading. Keep recovery states focused on retry, clear filters, or support.
- Keep each Pandit row as a consistent comparison unit: identity, specialty, language/experience facts, honest availability signal, and one dominant `View availability` action.
- Hide the repeated absence of reviews; show ratings only when trustworthy public reviews exist.
- Use a compact mobile layout and full-width primary action without turning every row into a long menu.
- Do not display the legacy `price_per_session` expert field because the booking catalog/quote service is the approved source of truth.

## Reference patterns

- Astrotalk makes live availability, verification, experience, rating, price and Chat/Call actions visible within the browsing decision.
- Preply and Clarity expose price and availability before users open every profile.
- Pandit Talk should adopt the information hierarchy—not copy their visual style or make claims the backend cannot support.

## Responsive behavior

- 1440/1024: compact horizontal customer navigation; one strong primary panel; three small summaries. Directory rows align facts and CTA in predictable columns.
- 768: primary home content stacks before supporting format copy; directory filters use the existing disclosure and rows use two columns.
- 375: no horizontal overflow; actions are at least 44px; directory cards use one CTA; lower-priority links become compact rows; footer remains outside this scoped redesign.

## Accessibility and trust

- Keep semantic headings, status regions, labels and live loading announcements.
- Use visible focus indicators and more than color to indicate clickability/status.
- Respect reduced motion and avoid layout shifts when data resolves.
- Never turn `isOnline` into a guaranteed booking claim; Chat Now is rechecked by the booking service.
- Never show a review aggregate that has not passed the existing public-review trust filter.

## Acceptance criteria

- The directory has no routine `Prepare a draft` or `Try free tools` links and no repeated slow-loading action block.
- Each loaded Pandit has one clear primary action labelled around availability.
- Backend catalog terms appear once and are not hardcoded.
- Customer home has a labelled refresh control, explicit card affordances, and a compact lower-priority section.
- Both pages fit 375, 768, 1024 and 1440 viewports without horizontal overflow.
- Focused Playwright tests, lint, type checking/build, and screenshot review pass before pushing.
