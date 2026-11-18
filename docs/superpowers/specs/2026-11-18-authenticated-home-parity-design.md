# Authenticated Home Parity Design

## Goal

Make the first screen after sign-in feel like the same PanditTalk product on web and mobile by using the current mobile `Consult` home as the visual and interaction source of truth, while adding equivalent access to its core options on the website.

## User outcome

After signing in, a user should immediately understand that PanditTalk is for finding and speaking with a real Pandit. The next action should be obvious: browse Pandits, then choose Chat Now or a scheduled consultation. Account status, discussion topics, journal content, private preparation, and free tools should be reachable on both platforms with matching labels and order.

## Design decisions

1. Preserve the current mobile home visual language: warm screen background, gold consultation hero, clear `Browse pandits`/`Chat Now`/`Book chat, audio or video` actions, topic tiles, reading rail, and optional tools.
2. Reshape the authenticated website home to follow the same sequence instead of presenting a separate account-only dashboard as its primary experience.
3. Keep booking, wallet, updates, reports/profile, topics, journal, free tools, private preparation, and help available on both platforms. Platform-specific navigation controls may differ, but destination names and capabilities must match.
4. Use the same service language on both platforms: `Talk to a verified Pandit`, `Browse Pandits`, `Chat Now`, `Book chat, audio or video`, `What would you like to discuss?`, `Helpful reading`, and `Optional self-service tools`.
5. Keep the existing PanditTalk colors and assets. Improve parity through layout, labels, content order, and real service evidence rather than introducing a new visual theme.
6. Keep profile completion secondary. The mobile profile-progress card may remain as a compact secondary card, but it must not displace the consultation path; the website receives an equivalent profile continuation entry.
7. The mobile home search must not promise expert search while only querying articles. Either make its behavior match the website directory search or label it as article search; the preferred implementation is to route the primary discovery action to the Pandit directory and keep article search explicit.

## Shared authenticated-home sequence

1. Branded authenticated header and welcome context.
2. Consultation hero with `Talk to a verified Pandit` and one discovery action.
3. Primary actions for `Chat Now` and `Book chat, audio or video`.
4. Account status shortcuts for bookings, wallet, updates, and reports/profile where applicable.
5. `What would you like to discuss?` topic grid with the same labels and routes.
6. `Helpful reading` with the same journal destination.
7. `Optional self-service tools` and private preparation links.

## Responsive behavior

- Web keeps the mobile order in a wider two-column/rail layout where space permits.
- Mobile keeps the current stacked card and horizontal reading-rail behavior.
- Both layouts retain minimum 44px interactive targets, visible focus/pressed states, reduced-motion behavior, and no horizontal overflow.
- No authenticated-home action is intentionally exclusive to one client.

## Testing requirements

- Website UI tests assert the authenticated home exposes the shared hero, primary actions, status destinations, topics, journal, tools, and private preparation at 390px and desktop widths.
- Mobile static verification asserts the shared wording and destination labels remain present in the current home source.
- Website full UI, build, and mobile typecheck/lint/verifier must pass after the parity changes.
