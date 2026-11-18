# Cross-platform navigation parity design

## Goal

Make the signed-in PanditTalk mobile app and website expose the same product areas with the same names, while keeping the website responsive and avoiding duplicate navigation layers.

## Approved information architecture

The five primary destinations are shared by both clients:

1. Consult — the authenticated home and consultation actions.
2. Experts — find and compare Pandits.
3. Guidance — structured guidance journeys.
4. Tools — self-service astrology tools.
5. Profile — personal profile and account details.

Secondary destinations are Wallet, Sessions, Reports, Notifications, Articles, and Settings. Share PanditTalk and Rate PanditTalk remain low-frequency actions near the bottom of the mobile drawer. Logout remains separated as a destructive action.

## Mobile behavior

The existing five-item bottom tab bar remains the primary navigation. The hamburger drawer no longer repeats Profile as a row and no longer contains a menu search field. Its profile header opens Profile, the wallet card opens Wallet, and the remaining rows are grouped by account activity and resources.

## Website behavior

Signed-in desktop users see one app header with Consult, Experts, Guidance, Tools, and Articles, followed by notification, wallet, and Profile controls. The old customer sub-navigation bar is removed. Account destinations are reached through Profile, while Notifications remains a bell action.

At mobile widths, the signed-in website renders the same five-item fixed bottom navigation as the mobile app. The existing hamburger menu remains for secondary destinations, and page content receives enough bottom padding to stay above the bar.

Public website navigation keeps its existing discovery and support links. Marketing links such as Our approach and How booking works remain available through public pages and the footer, not the signed-in app navigation.

## Label and route compatibility

Visible labels use Consult, Experts, Guidance, Tools, Profile, Sessions, Articles, and Notifications. Existing routes such as `/bookings`, `/account`, and `/articles` remain valid; only their navigation labels and placement change.

## Accessibility and responsive requirements

- Keep visible focus states and minimum 44px interactive targets.
- Preserve unread notification announcements and badges.
- Respect reduced-motion preferences.
- Avoid horizontal overflow at 375px, 390px, 768px, 1024px, and desktop widths.
- Do not hide customer content behind the fixed mobile navigation.
