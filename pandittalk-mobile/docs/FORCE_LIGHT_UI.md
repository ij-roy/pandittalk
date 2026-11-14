# Force light UI (iOS Dark Mode clash) — GitHub #59 / #71

## Problem

Product screens use fixed light tokens (`BG` `#F2F0EB`, ivory cards) while
`userInterfaceStyle` was `automatic` and navigation/StatusBar followed system
Dark Mode → light-on-light status bar icons (#59). Splash also had a separate
dark background, causing a dark→light flash on cold start (#71).

## Fix (Option C / App Store polish)

Ship as **light-only** until a real dark theme exists:

| Change | File |
| --- | --- |
| `userInterfaceStyle: "light"` | `apps/mobile/app.json` |
| Splash `backgroundColor: "#F2F0EB"`; remove `dark` splash variant | `apps/mobile/app.json` |
| Always `DefaultTheme`; `StatusBar style="dark"` | `apps/mobile/app/_layout.tsx` |

## Verify

- Device Dark Mode on → status bar icons remain dark (readable on ivory)
- Cold start → splash matches app background (no black splash flash)
- Rebuild native binary after `app.json` splash / UI style changes (`npx expo prebuild` / EAS)
