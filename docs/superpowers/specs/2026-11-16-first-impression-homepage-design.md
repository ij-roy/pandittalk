# Pandit Talk First-Impression Homepage Design

**Date:** 2026-11-16

## Purpose

Make the public homepage immediately understandable, trustworthy, and usable for a first-time visitor on phones, tablets, laptops, and wide desktop screens. The page must honestly reflect the current pre-launch state without inventing Pandits, reviews, testimonials, or usage statistics.

## Evidence from the rendered site

The current homepage was inspected at 320×568, 390×844, 768×1024, 1024×768, 1440×900, and 1920×1080.

- The warm cream, forest, and ochre palette feels calm and credible.
- The header and mobile menu are clear, and the main value proposition is understandable.
- The hero repeats “Pandit Talk” directly below the header brand and offers three competing actions.
- The email input grows to roughly 12rem tall because a flex-basis intended for horizontal width is applied inside a column flex container. It looks like a broken textarea.
- The decorative Hindi card takes substantial first-screen space without explaining the service, process, or trust boundaries.
- The waitlist appears before visitors have seen enough evidence to justify sharing an email.
- The homepage depends on a live Pandit API and can show three large skeleton rows for an extended time, making the product look unfinished.
- The story panel, eight single-column topic rows, live directory skeleton, learning section, six-question FAQ, closing CTA, and footer CTA make the mobile page unnecessarily long.
- The same actions are repeated in the hero, directory loading state, FAQ closing block, and footer.
- “No Timer” and countdown-related language are internal product framing that distracts a new visitor from the actual value. Detailed service terms can remain on dedicated pages.

## Design direction

Use a trust-first, editorial marketplace layout with the existing visual language.

### Motion and visual assets

- Use a restrained, locally owned adaptation of React Bits’ Fade Content pattern for below-fold section reveals. Content must remain available without JavaScript and become fully static under `prefers-reduced-motion`.
- Use a locally owned adaptation of React Bits’ Spotlight Card pattern on a small number of trust/discovery cards. The spotlight may respond to a fine pointer but must not be required to understand or operate a card.
- Add a lightweight SVG/CSS line-art motif to the hero guide card. Animate only decorative rings/gradient drift, never text or controls.
- Do not use WebGL backgrounds, typewriter effects, text scrambling, autoplay carousels, or continuous cursor trails. They are visually louder, more expensive, and less appropriate for a calm, trust-sensitive service.

### 1. Hero

- Keep one value-focused H1: “Find a calmer next step for the question on your mind.”
- Remove the duplicate oversized brand name.
- Keep two actions only: a primary “Explore Pandits” action and a secondary “Prepare a private draft” action.
- Replace the decorative Hindi card with a practical “A thoughtful way to begin” guide containing three short steps.
- Add compact, truthful trust points: real Pandit profiles, private preparation, free exploration, and no charge today.
- Show booking status as a short text link, not a form and not timer language.

### 2. Starting topics

- Keep all eight useful topics but present them as compact two-column choices on phones and four-column choices on desktop.
- Place this section early so a visitor can recognize their reason for coming.

### 3. Trust and process

- Consolidate the current conversation and story sections into three concise cards: know the person, prepare privately, and choose the next step.
- Link to detailed process and trust pages rather than explaining every feature on the homepage.

### 4. Pandit discovery

- Do not mount the live directory on the homepage. It remains available at `/pandits`, where loading, filters, empty states, and errors are appropriate.
- Use an honest profile-preview section describing what visitors can inspect—introduction, practice area, and languages—with one link to the directory.
- Do not fabricate profiles or social proof when the API is unavailable.

### 5. Explore and FAQ

- Keep the journal and free tools as two optional discovery cards.
- Reduce the homepage FAQ to the four highest-value first-visit questions: booking availability, what to bring, tools versus a Pandit, and privacy of saved drafts.
- Remove the repeated closing action cluster.

### 6. Availability update

- Place one compact email form near the end of the homepage, after trust and product explanation.
- The email control must remain a normal 48–56px field at all tested widths.
- Keep privacy and no-spam copy visible.

## Responsive behavior

- **320–414px:** primary action remains in the initial viewport; two topic columns where text remains readable; cards stack; touch targets are at least 44px; no horizontal overflow.
- **768px:** hero uses the available width without a large empty half; guide card stacks below copy; topic choices remain compact.
- **1024px and above:** hero uses a balanced two-column layout; the guide card earns its space by explaining the product; supporting sections avoid excessive vertical whitespace.
- **1440–1920px:** content remains within the existing 1200px reading width and does not stretch into sparse, disconnected islands.
- **Large text and reduced motion:** content reflows to one column where necessary and remains keyboard accessible.

## Acceptance criteria

- Exactly one H1 and no duplicate hero brand line.
- Exactly two hero buttons, with one visually primary.
- No waitlist form, live directory skeleton, “No Timer,” “countdown,” or “minute-by-minute” wording in the homepage main content.
- One availability form near the end of the homepage.
- Email input computed height no greater than 56px at 390px and 1440px widths.
- Topics render in two columns at 390px and four columns at desktop width.
- No horizontal overflow at all required responsive test sizes.
- WCAG automated scan remains clean, build succeeds, and the public UI suite passes.
- Decorative animation stops under reduced motion, and revealed content remains visible and usable.

