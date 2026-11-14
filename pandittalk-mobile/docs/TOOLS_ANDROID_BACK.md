# Tools stack Android back

Issue #295: hardware back inside nested `/tools/*` screens sometimes exited the app instead of popping the tool or returning to the Tools tab.

## Behavior

- `tools/_layout` Android `BackHandler`: pop within the tools stack when possible; otherwise dismiss / `goToToolsHub` (never return `false`)
- “Explore Astrology Tools” uses `goToToolsHub` (`dismissTo` / `replace`) instead of `push('/(tabs)/tools')` so the hub isn’t stacked twice

Tracks #295.
