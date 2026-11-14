# Home pull-to-refresh

Home (`/(tabs)` / `/(tabs)/home`) supports pull-to-refresh on the main feed list.

On refresh the screen:

1. Reloads featured + feed articles from the articles API
2. Re-fetches the signed-in user profile (greeting + profile progress card)
3. If a search query is active, refreshes search results

Matches the Experts and Profile tab refresh pattern (`RefreshControl` with gold tint).

Tracks #294.
