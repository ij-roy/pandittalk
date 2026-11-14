# Session teardown promise safety

Leaving or ending chat / audio / video sessions runs async cleanup (Chime `stopMeeting`, socket leave/disconnect).

Unhandled rejections from that path can white-screen React Native (issue #279).

## Guarantees

- `teardownSession` / `handleSessionEnded` on audio and video wrap cleanup in try/catch and never reject
- Fire-and-forget callers (`void finalizeSession()`, socket `onSessionEnded`) always attach `.catch(...)`
- Unmount cleanups catch leave/removeAllListeners and `.catch` native stop promises
- Chat refund / leave cleanup is try/caught before navigating away

Tracks #279.
