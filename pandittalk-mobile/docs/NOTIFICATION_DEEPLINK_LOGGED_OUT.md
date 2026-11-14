# Notification deep link while logged out

Issue #270: tapping a session notification with no auth session dropped the destination.

## Behavior

1. Notification response / cold-start last response → `openSessionOrQueueLogin`
2. If no access token → stash `bookingId` in `usePendingDeepLinkStore` and `router.replace('/login')`
3. After `authHydrated` + token → consume pending id and `navigateToSession`

Tracks #270.
