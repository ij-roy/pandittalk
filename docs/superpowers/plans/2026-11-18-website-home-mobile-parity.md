# Website home mobile-parity plan

## Goal

Bring the authenticated website home into the same service-first information architecture as the approved mobile home while using a spacious responsive web layout.

## Decisions already approved

- Lead with real Pandit consultations and keep Chat Now and scheduled audio/video booking visible together.
- Use the same six discussion topics as mobile: Career & Business, Love & Relationships, Finance & Wealth, Marriage & Family, Health & Wellbeing, and Spiritual Protection.
- Keep Helpful reading before Self-service tools, remove the word “Optional”, and leave a clear 32px separation before Latest.
- Render Latest articles as calm social-style posts: author/logo row, square flush image, and one slow metadata position that alternates between read time and category.

## Implementation

1. Pass server-fetched public articles into the authenticated home and keep account data client-side.
2. Replace the old dashboard-first home with consultation hero/actions, featured Pandit preview, profile progress, topics, reading rail, tools, latest feed, upcoming booking, and account summaries.
3. Add responsive CSS at desktop, tablet, and phone widths using the existing gold, sage, rose, and paper brand palette.
4. Update home contract and Playwright tests to cover section ordering, removed Optional copy, article feed semantics, API-error recovery, booking visibility, and viewport overflow.

## Verification

- `npm test -- tests/contracts/home-feed-layout.test.ts`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run test:ui` (new home tests pass; unrelated existing login/journal checks remain environment-sensitive)
