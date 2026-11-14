# Waiting room pandit ETA

Issue #298: silent “Waiting for pandit…” feels like abandonment.

## Behavior

While `waitingForPandit` is true (chat / audio / video):

- Soft ETA: pandits usually join within a few minutes
- Elapsed wait time
- Countdown to the 10-minute no-show full-refund window (matches refund policy)

Shared helpers: `lib/waitingRoomEta.ts`, UI: `components/session/WaitingForPanditStatus.tsx`.

Tracks #298.
