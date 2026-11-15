# Pandit Talk Footer Redesign

## Intent

Replace the current footer's oversized CTA-plus-sitemap treatment with a compact, trustworthy ending to the page. The footer should help an unfamiliar visitor understand the brand, find the next useful destination, and reach support or policy information without feeling like a second landing page.

## Goals

- Establish a clear three-layer hierarchy: brand/action, navigation, and utility/legal information.
- Remove the oversized “Choose where to begin” block and repeated “Prepare a draft” action.
- Rebalance desktop navigation so Legal does not create a long isolated column and dead space.
- Keep mobile navigation compact and accessible through native disclosure controls.
- Align “Back to top” with the utility row instead of leaving it isolated below the footer content.
- Preserve keyboard navigation, visible focus states, reduced-motion behavior, and responsive layouts.

## Non-goals

- No new footer animation, decorative dots, or extra visual effects.
- No changes to site-wide branding, routing, or header behavior.
- No removal of required legal, accessibility, support, or account links.

## Approach

Use one compact brand/action row, a balanced navigation grid, and one compressed utility/legal row. Keep the existing `FooterNav` disclosure behavior, but render the Legal group as a two-column desktop sub-grid so its eight links do not determine the height of the entire footer. On mobile, keep all groups collapsed by default and use smaller link rhythm while retaining touch-safe targets.

## Acceptance criteria

- Desktop footer reads as one intentional component rather than a CTA section followed by a sitemap.
- The four navigation areas have balanced visual weight at desktop widths.
- Mobile footer is materially shorter when a group is expanded, without reducing link hit areas below 44px.
- Support, policy, disclaimer, and “Back to top” content are visually grouped and easy to scan.
- Existing footer accessibility and responsive tests continue to pass, with focused assertions added for the new structure.
